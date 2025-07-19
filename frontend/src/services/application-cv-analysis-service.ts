// services/application-cv-analysis-service.ts
import { ResumeService } from './resume-service';
import { JobService } from './jobs-service';
import { api } from './user-service';
import { ResumeAnalysis } from '@/types/resume';
import { JobPosting, JobApplication, JobApplicationDetails } from '@/types/jobs';

export interface ApplicationAnalysis {
  application_id: string;
  candidate_name: string;
  match_score: number;
  resume_analysis: ResumeAnalysis['resume_analysis'];
  job_match: ResumeAnalysis['job_match'];
  candidate_profile: ResumeAnalysis['candidate_profile'];
  recommendation: string;
  analyzed_at: string;
}

export class ApplicationCVAnalysisService {
  // Cache pour stocker les analyses temporairement
  private static analysisCache = new Map<string, ApplicationAnalysis>();

  /**
   * Analyse le CV d'une candidature en utilisant le ResumeService existant
   */
  static async analyzeApplicationCV(applicationId: string): Promise<ApplicationAnalysis> {
    try {
      // Vérifier le cache d'abord
      if (this.analysisCache.has(applicationId)) {
        const cached = this.analysisCache.get(applicationId)!;
        const cacheAge = Date.now() - new Date(cached.analyzed_at).getTime();
        // Cache valide pendant 1 heure
        if (cacheAge < 3600000) {
          return cached;
        }
      }

      console.log('Démarrage analyse CV pour candidature:', applicationId);

      // 1. Récupérer les détails de la candidature
      const applicationDetails = await JobService.getApplicationDetails(applicationId);
      
      if (!applicationDetails.resume_url) {
        throw new Error('Aucun CV trouvé pour cette candidature');
      }

      // 2. Télécharger le CV de la candidature
      const resumeFile = await this.downloadApplicationResume(applicationId);
      
      // 3. Créer un fichier de description de poste
      const jobDescriptionFile = await this.createJobDescriptionFile(applicationDetails.job_posting);

      // 4. Utiliser le ResumeService existant pour l'analyse
      console.log('Lancement analyse avec ResumeService...');
      const analysisResult = await ResumeService.analyzeResume(resumeFile, jobDescriptionFile);

      // 5. Formater le résultat
      const formattedAnalysis: ApplicationAnalysis = {
        application_id: applicationId,
        candidate_name: applicationDetails.candidate_name,
        match_score: analysisResult.job_match.match_score,
        resume_analysis: analysisResult.resume_analysis,
        job_match: analysisResult.job_match,
        candidate_profile: analysisResult.candidate_profile,
        recommendation: this.generateRecommendation(analysisResult.job_match.match_score),
        analyzed_at: new Date().toISOString()
      };

      // 6. Mettre en cache
      this.analysisCache.set(applicationId, formattedAnalysis);

      console.log('Analyse terminée avec succès, score:', formattedAnalysis.match_score);
      return formattedAnalysis;

    } catch (error: any) {
      console.error('Erreur lors de l\'analyse de la candidature:', error);
      throw new Error(`Impossible d'analyser le CV: ${error.message}`);
    }
  }

  /**
   * Analyse en masse tous les CV d'une offre d'emploi
   */
  static async bulkAnalyzeJobApplications(jobId: string): Promise<{
    success: number;
    failed: number;
    results: ApplicationAnalysis[];
    errors: string[];
  }> {
    try {
      console.log('Démarrage analyse en masse pour offre:', jobId);

      // Récupérer toutes les candidatures de l'offre
      const applicationsResponse = await JobService.getJobApplications(jobId, { limit: 100, offset: 0 });
      const applicationsWithCV = applicationsResponse.data.filter(app => app.resume_url);

      console.log(`${applicationsWithCV.length} candidatures avec CV trouvées`);

      const results: ApplicationAnalysis[] = [];
      const errors: string[] = [];
      let success = 0;
      let failed = 0;

      // Analyser chaque candidature (séquentiellement pour éviter la surcharge)
      for (const application of applicationsWithCV) {
        try {
          const analysis = await this.analyzeApplicationCV(application.id);
          results.push(analysis);
          success++;
          console.log(`✅ Analyse réussie pour ${application.candidate_name}`);
        } catch (error: any) {
          failed++;
          const errorMsg = `❌ Échec analyse ${application.candidate_name}: ${error.message}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }

        // Petite pause pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`Analyse masse terminée: ${success} réussies, ${failed} échecs`);

      return { success, failed, results, errors };

    } catch (error: any) {
      console.error('Erreur lors de l\'analyse en masse:', error);
      throw new Error(`Erreur analyse en masse: ${error.message}`);
    }
  }

  /**
   * Récupère une analyse spécifique depuis le cache
   */
  static getApplicationAnalysis(applicationId: string): ApplicationAnalysis | null {
    return this.analysisCache.get(applicationId) || null;
  }

  /**
   * Efface le cache d'analyse
   */
  static clearAnalysisCache(applicationId?: string): void {
    if (applicationId) {
      this.analysisCache.delete(applicationId);
    } else {
      this.analysisCache.clear();
    }
  }

  /**
   * Télécharge le CV d'une candidature et le convertit en File
   */
  private static async downloadApplicationResume(applicationId: string): Promise<File> {
    try {
      const response = await api.get(`/job-postings/applications/${applicationId}/resume`, {
        responseType: 'blob'
      });

      if (response.status !== 200) {
        throw new Error('Impossible de télécharger le CV');
      }

      // Créer un objet File à partir du blob
      const blob = response.data;
      const filename = `cv_${applicationId}.pdf`; // Nom par défaut
      
      return new File([blob], filename, { type: blob.type || 'application/pdf' });

    } catch (error: any) {
      console.error('Erreur téléchargement CV:', error);
      throw new Error('Impossible de récupérer le CV pour l\'analyse');
    }
  }

  /**
   * Crée un fichier temporaire avec la description de l'offre d'emploi
   */
  private static async createJobDescriptionFile(jobPosting: JobPosting): Promise<File> {
    try {
      const jobDescription = this.formatJobDescription(jobPosting);
      const blob = new Blob([jobDescription], { type: 'text/plain' });
      
      return new File([blob], `job_${jobPosting.id}.txt`, { type: 'text/plain' });

    } catch (error: any) {
      console.error('Erreur création fichier job:', error);
      throw new Error('Impossible de préparer la description de poste');
    }
  }

  /**
   * Formate la description de l'offre d'emploi pour l'analyse
   */
  private static formatJobDescription(jobPosting: JobPosting): string {
    // Formater le salaire
    let salaryInfo = 'Non spécifié';
    if (jobPosting.salary_range_min && jobPosting.salary_range_max) {
      salaryInfo = `${jobPosting.salary_range_min} - ${jobPosting.salary_range_max} ${jobPosting.salary_currency}`;
    } else if (jobPosting.salary_range_min) {
      salaryInfo = `À partir de ${jobPosting.salary_range_min} ${jobPosting.salary_currency}`;
    } else if (jobPosting.salary_range_max) {
      salaryInfo = `Jusqu'à ${jobPosting.salary_range_max} ${jobPosting.salary_currency}`;
    }

    return `
TITRE: ${jobPosting.title}

ORGANISATION: ${jobPosting.organization_name}

LOCALISATION: ${jobPosting.location || 'Non spécifiée'}

TYPE D'EMPLOI: ${jobPosting.employment_type || 'Non spécifié'}

POLITIQUE DE TÉLÉTRAVAIL: ${jobPosting.remote_policy || 'Non spécifiée'}

DESCRIPTION:
${jobPosting.description}

EXIGENCES:
${jobPosting.requirements || 'Non spécifiées'}

RESPONSABILITÉS:
${jobPosting.responsibilities || 'Non spécifiées'}

SALAIRE: ${salaryInfo}

STATUT: ${jobPosting.status}
${jobPosting.closes_at ? `FERMETURE: ${new Date(jobPosting.closes_at).toLocaleDateString('fr-FR')}` : ''}
    `.trim();
  }

  /**
   * Génère une recommandation basée sur le score de match
   */
  private static generateRecommendation(matchScore: number): string {
    if (matchScore >= 80) {
      return "🌟 Candidat hautement recommandé - Profil parfaitement adapté au poste";
    } else if (matchScore >= 65) {
      return "👍 Bon candidat - Profil très intéressant, quelques points à approfondir";
    } else if (matchScore >= 50) {
      return "👌 Candidat potentiel - Nécessite un examen plus approfondi";
    } else if (matchScore >= 35) {
      return "⚠️ Candidat à considérer avec réserves - Écarts significatifs";
    } else {
      return "❌ Profil peu adapté - Écarts importants avec les exigences du poste";
    }
  }
}