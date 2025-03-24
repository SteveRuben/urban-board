// frontend/components/resume/ResumeUpload.jsx
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const ResumeUpload = ({ onAnalysisComplete, jobRole }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  // Fonction pour gérer le dépôt de fichier
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  }, []);

  // Configuration de react-dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // Réinitialiser les états en cas de changement de jobRole
  useEffect(() => {
    setFile(null);
    setFileName('');
    setError(null);
    setUploadProgress(0);
  }, [jobRole]);

  // Fonction pour télécharger et analyser le CV
  const uploadAndAnalyzeResume = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    
    if (jobRole) {
      formData.append('job_role', jobRole);
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulation d'un chargement progressif pour une meilleure UX
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // En environnement de développement, simuler l'analyse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 2500));
        clearInterval(uploadInterval);
        setUploadProgress(100);
        setIsUploading(false);
        
        // Simuler l'analyse
        setIsAnalyzing(true);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Générer une analyse fictive pour le développement
        const mockAnalysis = generateMockAnalysis(jobRole || 'Développeur');
        setIsAnalyzing(false);
        
        if (onAnalysisComplete) {
          onAnalysisComplete(mockAnalysis);
        }
      } else {
        // Appel API réel
        const response = await axios.post('/api/resumes/analyze', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            clearInterval(uploadInterval);
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
            
            if (percentCompleted === 100) {
              setIsUploading(false);
              setIsAnalyzing(true);
            }
          }
        });
        
        setIsAnalyzing(false);
        
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data);
        }
      }
    } catch (err) {
      setError('Erreur lors de l\'analyse du CV. Veuillez réessayer.');
      console.error('Erreur d\'analyse du CV:', err);
      setIsUploading(false);
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  // Générer une analyse fictive pour le développement
  const generateMockAnalysis = (jobTitle) => {
    const isDevRole = jobTitle.toLowerCase().includes('dev') || 
                      jobTitle.toLowerCase().includes('engineer') || 
                      jobTitle.toLowerCase().includes('program');
    
    return {
      resume_summary: `Professionnel expérimenté avec plus de 5 ans d'expérience en ${isDevRole ? 'développement logiciel' : 'gestion de projet'} et une solide expertise en ${isDevRole ? 'JavaScript, React et Node.js' : 'méthodologies agiles et outils de gestion'}.`,
      technical_skills: isDevRole 
        ? ["JavaScript", "TypeScript", "React", "Node.js", "AWS", "Docker", "MongoDB", "Express", "Git"] 
        : ["Jira", "MS Project", "Confluence", "Tableau", "SQL", "Excel avancé", "Power BI"],
      soft_skills: ["Communication", "Travail d'équipe", "Résolution de problèmes", "Gestion du temps", "Adaptabilité"],
      relevant_experience: [
        {
          position: isDevRole ? "Développeur Full Stack Senior" : "Chef de Projet IT",
          company: "TechSolutions SA",
          duration: "2019 - 2023",
          highlights: [
            isDevRole ? "Développement d'applications web avec React et Node.js" : "Gestion de projets IT avec budgets de plus de 500K€",
            isDevRole ? "Amélioration de la performance avec réduction de 40% du temps de chargement" : "Réduction de 15% des délais de livraison grâce à l'optimisation des processus",
            isDevRole ? "Mise en place de CI/CD avec GitHub Actions" : "Implémentation réussie de méthodologies agiles dans une équipe de 12 personnes"
          ]
        },
        {
          position: isDevRole ? "Développeur Web" : "Analyste Fonctionnel",
          company: "Digital Innovations",
          duration: "2016 - 2019",
          highlights: [
            isDevRole ? "Développement de fonctionnalités front-end avec JavaScript et React" : "Analyse des besoins utilisateurs et rédaction de spécifications fonctionnelles",
            isDevRole ? "Intégration d'API REST pour la communication avec le backend" : "Coordination entre les équipes techniques et métiers",
            isDevRole ? "Participation à la migration d'une application legacy vers React" : "Accompagnement des utilisateurs dans la prise en main des nouvelles fonctionnalités"
          ]
        }
      ],
      education: [
        {
          degree: isDevRole ? "Master en Informatique" : "Master en Management de Projets",
          institution: "Université de Paris",
          year: "2016",
          relevance: "haute"
        },
        {
          degree: isDevRole ? "Licence en Informatique" : "Licence en Gestion",
          institution: "Université de Lyon",
          year: "2014",
          relevance: "moyenne"
        }
      ],
      fit_score: 8.5,
      fit_justification: `Le candidat possède une solide expérience en ${isDevRole ? 'développement avec les technologies requises' : 'gestion de projets similaires'} et démontre les compétences techniques et soft skills nécessaires pour réussir dans ce rôle.`,
      strengths: [
        isDevRole ? "Expertise approfondie en JavaScript et React" : "Forte expérience en gestion de projets agiles",
        isDevRole ? "Expérience significative en développement full stack" : "Excellentes compétences en communication et coordination d'équipe",
        isDevRole ? "Bonne compréhension des principes DevOps" : "Capacité démontrée à respecter les délais et les budgets"
      ],
      gaps: [
        isDevRole ? "Expérience limitée avec les technologies cloud avancées" : "Expérience internationale limitée",
        isDevRole ? "Pourrait bénéficier d'une expérience en mobile" : "Peu d'expérience dans le secteur spécifique de l'entreprise"
      ],
      recommended_questions: [
        {
          question: isDevRole 
            ? "Pouvez-vous décrire un projet complexe où vous avez utilisé React et comment vous avez résolu les problèmes rencontrés?" 
            : "Pouvez-vous décrire un projet difficile que vous avez géré et comment vous avez surmonté les obstacles?",
          rationale: "Évaluer sa capacité à résoudre des problèmes complexes"
        },
        {
          question: isDevRole 
            ? "Comment avez-vous optimisé les performances des applications que vous avez développées?" 
            : "Comment assurez-vous que les projets respectent les délais et le budget?",
          rationale: "Comprendre son approche technique et son souci de la qualité"
        },
        {
          question: isDevRole 
            ? "Quelle est votre expérience avec AWS et comment l'avez-vous utilisé dans vos projets?" 
            : "Comment gérez-vous les conflits au sein d'une équipe de projet?",
          rationale: "Explorer un domaine où le candidat pourrait développer ses compétences"
        }
      ],
      contact_info: {
        email: "candidat@exemple.com",
        phone: "06 12 34 56 78",
        linkedin: "linkedin.com/in/candidat-exemple"
      },
      metadata: {
        filename: fileName,
        analysis_timestamp: new Date().toISOString(),
        job_role: jobRole || "Non spécifié"
      }
    };
  };

  return (
    <div className="resume-upload space-y-4">
      {/* Zone de dépôt */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : isDragReject
            ? 'border-red-500 bg-red-50'
            : file
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Icône de document */}
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${file ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          
          {/* Message d'instruction */}
          {file ? (
            <p className="text-green-600 font-medium">Fichier sélectionné: {fileName}</p>
          ) : isDragActive ? (
            <p className="text-primary-600 font-medium">Déposez le fichier ici...</p>
          ) : isDragReject ? (
            <p className="text-red-600 font-medium">Type de fichier non supporté.</p>
          ) : (
            <div>
              <p className="text-gray-700 font-medium">
                Glissez-déposez votre CV ici, ou cliquez pour sélectionner un fichier
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Formats acceptés: PDF, DOCX, DOC, TXT (Max: 5Mo)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Progression de téléchargement */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Téléchargement en cours...</span>
            <span className="text-gray-700 font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Indication d'analyse */}
      {isAnalyzing && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700 flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Analyse du CV en cours... Cela peut prendre quelques instants.</p>
        </div>
      )}

      {/* Bouton d'analyse */}
      <div className="flex justify-end">
        <button
          onClick={uploadAndAnalyzeResume}
          disabled={!file || isUploading || isAnalyzing}
          className={`px-6 py-2 rounded-md flex items-center ${
            !file || isUploading || isAnalyzing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isUploading || isAnalyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isUploading ? 'Téléchargement...' : 'Analyse en cours...'}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Analyser le CV
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ResumeUpload;