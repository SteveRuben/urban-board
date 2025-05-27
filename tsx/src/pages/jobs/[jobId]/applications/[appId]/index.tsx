import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  Phone, 
  Calendar, 
  User,
  MapPin,
  Briefcase,
  Edit,
  Save,
  X,
  MessageSquare,
  ExternalLink,
  Clock,
  Award,
  Brain
} from 'lucide-react';
import { JobService } from '@/services/jobs-service';
import { ApplicationCVAnalysisService } from '@/services/application-cv-analysis-service';
import { SimpleCVScore } from '@/components/resume/SimpleCVScore';
import { JobApplicationDetails, ApplicationStatus } from '@/types/jobs';

export default function ApplicationDetailPage() {
  const router = useRouter();
  const { jobId, appId } = router.query;
  
  const [application, setApplication] = useState<JobApplicationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [editingNotes, setEditingNotes] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('new');
  const [analysis, setAnalysis] = useState<any>(null);

  const fetchApplicationDetails = async () => {
    if (!appId || typeof appId !== 'string') return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await JobService.getApplicationDetails(appId);
      setApplication(response);
      setNotes(response.notes || '');
      setNewStatus(response.status);

      // Vérifier s'il y a déjà une analyse
      const existingAnalysis = ApplicationCVAnalysisService.getApplicationAnalysis(appId);
      if (existingAnalysis) {
        setAnalysis(existingAnalysis);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des détails:', err);
      setError('Impossible de charger les détails de la candidature. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [appId]);

  const handleStatusUpdate = async () => {
    if (!application) return;
    
    try {
      setUpdatingStatus(true);
      await JobService.updateApplicationStatus(application.id, newStatus, notes);
      
      // Mettre à jour les données locales
      setApplication(prev => prev ? {
        ...prev,
        status: newStatus,
        notes: notes,
        updated_at: new Date().toISOString()
      } : prev);
      
      setEditingNotes(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError('Impossible de mettre à jour le statut. Veuillez réessayer.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelEdit = () => {
    if (application) {
      setNotes(application.notes || '');
      setNewStatus(application.status);
    }
    setEditingNotes(false);
  };

  const handleDownloadResume = async () => {
    if (!application) return;
    try {
      await JobService.downloadApplicationResume(application.id, `CV_${application.candidate_name}.pdf`);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      setError('Impossible de télécharger le CV. Veuillez réessayer.');
    }
  };

  const handlePreviewResume = async () => {
    if (!application) return;
    try {
      await JobService.previewApplicationResume(application.id);
    } catch (err) {
      console.error('Erreur lors de la prévisualisation:', err);
      setError('Impossible de prévisualiser le CV. Veuillez réessayer.');
    }
  };

  // Helper pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper pour obtenir la classe de badge en fonction du statut
  const getStatusBadgeClass = (status: ApplicationStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hired':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500">Chargement des détails de la candidature...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 mb-4">Candidature non trouvée.</p>
              <Link
                href="/jobs"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700"
              >
                Retour aux offres d'emploi
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Candidature - {application.candidate_name}</title>
        <meta name="description" content={`Détails de la candidature de ${application.candidate_name}`} />
      </Head>

      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Navigation */}
            <div className="mb-8">
              <Link
                href={`/jobs/${jobId}/applications`}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour aux candidatures
              </Link>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations principales */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profil du candidat */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-primary-100 rounded-full p-3 mr-4">
                        <User className="h-8 w-8 text-primary-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">{application.candidate_name}</h1>
                        <p className="text-gray-600">Candidat pour {application.job_posting.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* Score CV */}
                      <SimpleCVScore
                        applicationId={application.id}
                        hasResume={!!application.resume_url}
                        compact={false}
                      />
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(application.status)}`}>
                        {JobService.getApplicationStatusLabel(application.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-gray-700">
                      <Mail className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a
                          href={`mailto:${application.candidate_email}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {application.candidate_email}
                        </a>
                      </div>
                    </div>

                    {application.candidate_phone && (
                      <div className="flex items-center text-gray-700">
                        <Phone className="h-5 w-5 mr-3 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Téléphone</p>
                          <a
                            href={`tel:${application.candidate_phone}`}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {application.candidate_phone}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Date de candidature</p>
                        <p className="font-medium">{formatDate(application.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-700">
                      <Clock className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Dernière mise à jour</p>
                        <p className="font-medium">{formatDate(application.updated_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Source de candidature */}
                  {application.source && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        Source de candidature : <span className="font-medium">{application.source}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Analyse CV détaillée (si disponible) */}
                {analysis && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Analyse de compatibilité CV
                    </h2>
                    
                    {/* Recommandation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-blue-800 font-medium">{analysis.recommendation}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Points forts */}
                      {analysis.resume_analysis.strengths && analysis.resume_analysis.strengths.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-green-700 mb-2">✅ Points forts</h3>
                          <ul className="space-y-1">
                            {analysis.resume_analysis.strengths.slice(0, 3).map((strength: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Points d'amélioration */}
                      {analysis.resume_analysis.gaps && analysis.resume_analysis.gaps.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-red-700 mb-2">⚠️ Points d'attention</h3>
                          <ul className="space-y-1">
                            {analysis.resume_analysis.gaps.slice(0, 3).map((gap: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Compétences */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid md:grid-cols-2 gap-4">
                        {analysis.job_match.matching_skills && analysis.job_match.matching_skills.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-green-700 mb-2">Compétences correspondantes</h4>
                            <div className="flex flex-wrap gap-1">
                              {analysis.job_match.matching_skills.slice(0, 5).map((skill: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.job_match.missing_skills && analysis.job_match.missing_skills.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-red-700 mb-2">Compétences manquantes</h4>
                            <div className="flex flex-wrap gap-1">
                              {analysis.job_match.missing_skills.slice(0, 5).map((skill: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                      Analysé le {formatDate(analysis.analyzed_at)}
                    </div>
                  </div>
                )}

                {/* Détails de l'offre */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails de l'offre</h2>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <Briefcase className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <p className="font-medium">{application.job_posting.title}</p>
                        <p className="text-sm text-gray-500">{application.job_posting.organization_name}</p>
                      </div>
                    </div>

                    {application.job_posting.location && (
                      <div className="flex items-center text-gray-700">
                        <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                        <p>{application.job_posting.location}</p>
                      </div>
                    )}

                    {application.job_posting.employment_type && (
                      <div className="flex items-center text-gray-700">
                        <Clock className="h-5 w-5 mr-3 text-gray-400" />
                        <p>{application.job_posting.employment_type}</p>
                      </div>
                    )}

                    {(application.job_posting.salary_range_min || application.job_posting.salary_range_max) && (
                      <div className="text-gray-700">
                        <p className="text-sm text-gray-500">Salaire</p>
                        <p className="font-medium">
                          {application.job_posting.salary_range_min && application.job_posting.salary_range_max
                            ? `${application.job_posting.salary_range_min} - ${application.job_posting.salary_range_max} ${application.job_posting.salary_currency}`
                            : application.job_posting.salary_range_min
                            ? `À partir de ${application.job_posting.salary_range_min} ${application.job_posting.salary_currency}`
                            : `Jusqu'à ${application.job_posting.salary_range_max} ${application.job_posting.salary_currency}`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lettre de motivation */}
                {application.cover_letter && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Lettre de motivation</h2>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{application.cover_letter}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions et notes */}
              <div className="space-y-6">
                {/* Actions rapides */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                  <div className="space-y-3">
                    {application.resume_url && (
                      <>
                        <button
                          onClick={() => handleDownloadResume()}
                          className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger le CV
                        </button>
                        <button
                          onClick={() => handlePreviewResume()}
                          className="flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Prévisualiser le CV
                        </button>
                      </>
                    )}

                    <Link
                      href={`/jobs/${application.job_posting.id}`}
                      className="flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir l'offre
                    </Link>
                  </div>
                </div>

                {/* Gestion du statut */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Statut et notes</h2>
                    {!editingNotes && (
                      <button
                        onClick={() => setEditingNotes(true)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {editingNotes ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Statut
                        </label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="new">Nouveau</option>
                          <option value="reviewed">Examiné</option>
                          <option value="interview_scheduled">Entretien planifié</option>
                          <option value="hired">Embauché</option>
                          <option value="rejected">Rejeté</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes internes
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Ajouter des notes sur cette candidature..."
                        />
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={handleStatusUpdate}
                          disabled={updatingStatus}
                          className="flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {updatingStatus ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Sauvegarder
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={updatingStatus}
                          className="flex items-center px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Statut actuel</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(application.status)}`}>
                          {JobService.getApplicationStatusLabel(application.status)}
                        </span>
                      </div>

                      {application.notes && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Notes internes</p>
                          <div className="bg-gray-50 rounded-md p-3">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.notes}</p>
                          </div>
                        </div>
                      )}

                      {!application.notes && (
                        <p className="text-sm text-gray-500 italic">Aucune note ajoutée</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}