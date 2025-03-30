// pages/interviews/edit/[id].jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  VideoCameraIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import AIAssistantSelector from '../../../components/interview/AIAssistantSelector';
import interviewService from '../../../services/interviewService';
import aiAssistantService from '../../../services/aiAssistantService';

const EditInterview = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [formData, setFormData] = useState({
    title: '',
    candidateName: '',
    candidateEmail: '',
    position: '',
    date: '',
    time: '',
    duration: 30,
    notes: '',
    interviewMode: 'collaborative',
    aiAssistant: null
  });
  
  const [originalData, setOriginalData] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Charger les données de l'entretien
  useEffect(() => {
    const fetchInterviewData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const interviewData = await interviewService.getInterviewById(id);
        setOriginalData(interviewData);
        
        // Récupérer l'assistant associé
        if (interviewData.aiAssistantId) {
          const assistant = await aiAssistantService.getAssistantById(interviewData.aiAssistantId);
          
          // Extraire la date et l'heure
          const scheduledDate = new Date(interviewData.scheduledAt);
          const date = scheduledDate.toISOString().split('T')[0];
          const time = scheduledDate.toTimeString().substring(0, 5);
          
          setFormData({
            title: interviewData.title || '',
            candidateName: interviewData.candidateName || '',
            candidateEmail: interviewData.candidateEmail || '',
            position: interviewData.position || '',
            date,
            time,
            duration: interviewData.duration || 30,
            notes: interviewData.notes || '',
            interviewMode: interviewData.interviewMode || 'collaborative',
            aiAssistant: assistant
          });
        }
      } catch (err) {
        setSubmitError('Erreur lors du chargement des données de l\'entretien: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterviewData();
  }, [id]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ s'il y en a une
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // Réinitialiser le message de succès
    if (submitSuccess) {
      setSubmitSuccess(false);
    }
  };
  
  const handleSelectAssistant = (assistant) => {
    setFormData(prev => ({
      ...prev,
      aiAssistant: assistant,
      // Si l'assistant est en mode autonome, définir le mode d'entretien sur autonome
      interviewMode: assistant?.interviewMode || prev.interviewMode
    }));
    
    // Effacer l'erreur pour ce champ s'il y en a une
    if (errors.aiAssistant) {
      setErrors(prev => ({
        ...prev,
        aiAssistant: null
      }));
    }
    
    // Réinitialiser le message de succès
    if (submitSuccess) {
      setSubmitSuccess(false);
    }
  };
  
  const handleModeChange = (e) => {
    const mode = e.target.value;
    setFormData(prev => ({
      ...prev,
      interviewMode: mode
    }));
    
    // Si l'assistant actuel ne supporte pas ce mode, afficher un avertissement
    if (formData.aiAssistant && formData.aiAssistant.interviewMode !== 'hybrid' && formData.aiAssistant.interviewMode !== mode) {
      setErrors(prev => ({
        ...prev,
        interviewMode: `L'assistant actuel est optimisé pour le mode ${formData.aiAssistant.interviewMode === 'autonomous' ? 'autonome' : 'collaboratif'}. Vous pouvez changer d'assistant ou modifier votre choix.`
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        interviewMode: null
      }));
    }
    
    // Réinitialiser le message de succès
    if (submitSuccess) {
      setSubmitSuccess(false);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    
    if (!formData.candidateName.trim()) {
      newErrors.candidateName = 'Le nom du candidat est requis';
    }
    
    if (!formData.candidateEmail.trim()) {
      newErrors.candidateEmail = 'L\'email du candidat est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.candidateEmail)) {
      newErrors.candidateEmail = 'L\'email n\'est pas valide';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = 'Le poste est requis';
    }
    
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }
    
    if (!formData.time) {
      newErrors.time = 'L\'heure est requise';
    }
    
    if (!formData.aiAssistant) {
      newErrors.aiAssistant = 'Un assistant IA est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Faire défiler jusqu'à la première erreur
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      // Préparer les données pour l'API
      const interviewData = {
        title: formData.title,
        candidateName: formData.candidateName,
        candidateEmail: formData.candidateEmail,
        position: formData.position,
        scheduledAt: `${formData.date}T${formData.time}:00`,
        duration: formData.duration,
        notes: formData.notes,
        interviewMode: formData.interviewMode,
        aiAssistantId: formData.aiAssistant.id
      };
      
      // Appeler l'API pour mettre à jour l'entretien
      await interviewService.updateInterview(id, interviewData);
      
      // Afficher le message de succès
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err.message || 'Une erreur est survenue lors de la mise à jour de l\'entretien.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Si l'entretien est déjà terminé, afficher un message d'erreur
  const isInterviewCompleted = originalData && originalData.status === 'completed';
  
  return (
    <DashboardLayout title="Modifier l'entretien">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/interviews/${id}`} legacyBehavior>
          <a className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5 mr-1 text-gray-400" aria-hidden="true" />
            Retour aux détails de l'entretien
          </a>
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center py-20 bg-white shadow-sm rounded-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement des données de l'entretien...</p>
        </div>
      ) : isInterviewCompleted ? (
        <div className="bg-yellow-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Modification impossible
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Cet entretien est déjà terminé et ne peut plus être modifié.</p>
              </div>
              <div className="mt-4">
                <Link href={`/interviews/${id}`} legacyBehavior>
                  <a className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Retour aux détails de l'entretien
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Modifier l'entretien
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Modifiez les détails de l'entretien ou changez l'assistant IA utilisé.
            </p>
          </div>
          
          {submitError && (
            <div className="px-4 py-5 sm:px-6">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Erreur lors de la mise à jour de l'entretien
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{submitError}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {submitSuccess && (
            <div className="px-4 py-5 sm:px-6">
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Entretien mis à jour avec succès
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Les modifications ont été enregistrées.</p>
                    </div>
                    <div className="mt-4">
                      <Link href={`/interviews/${id}`} legacyBehavior>
                        <a className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                          Voir les détails de l'entretien
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Titre de l'entretien <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`block w-full rounded-md sm:text-sm ${errors.title ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                      placeholder="Ex: Entretien technique développeur React"
                    />
                    {errors.title && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700">
                    Nom du candidat <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      id="candidateName"
                      name="candidateName"
                      value={formData.candidateName}
                      onChange={handleChange}
                      className={`block w-full pl-10 rounded-md sm:text-sm ${errors.candidateName ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                      placeholder="Prénom Nom"
                    />
                    {errors.candidateName && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  {errors.candidateName && (
                    <p className="mt-2 text-sm text-red-600">{errors.candidateName}</p>
                  )}
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="candidateEmail" className="block text-sm font-medium text-gray-700">
                    Email du candidat <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="email"
                      id="candidateEmail"
                      name="candidateEmail"
                      value={formData.candidateEmail}
                      onChange={handleChange}
                      className={`block w-full rounded-md sm:text-sm ${errors.candidateEmail ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                      placeholder="exemple@email.com"
                    />
                    {errors.candidateEmail && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  {errors.candidateEmail && (
                    <p className="mt-2 text-sm text-red-600">{errors.candidateEmail}</p>
                  )}
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Poste <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BriefcaseIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className={`block w-full pl-10 rounded-md sm:text-sm ${errors.position ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                      placeholder="Ex: Développeur React Senior"
                    />
                    {errors.position && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  {errors.position && (
                    <p className="mt-2 text-sm text-red-600">{errors.position}</p>
                  )}
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="interviewMode" className="block text-sm font-medium text-gray-700">
                    Mode d'entretien <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="interviewMode"
                      name="interviewMode"
                      value={formData.interviewMode}
                      onChange={handleModeChange}
                      className={`block w-full rounded-md sm:text-sm ${errors.interviewMode ? 'border-red-300 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                    >
                      <option value="collaborative">Collaboratif (Vous menez l'entretien avec assistance IA)</option>
                      <option value="autonomous">Autonome (L'IA mène l'entretien)</option>
                      <option value="hybrid">Hybride (Combinaison des deux modes)</option>
                    </select>
                  </div>
                  {errors.interviewMode && (
                    <p className="mt-2 text-sm text-red-600">{errors.interviewMode}</p>
                  )}
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className={`block w-full pl-10 rounded-md sm:text-sm ${errors.date ? 'border-red-300 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.date && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  {errors.date && (
                    <p className="mt-2 text-sm text-red-600">{errors.date}</p>
                  )}
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                    Heure <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className={`block w-full pl-10 rounded-md sm:text-sm ${errors.time ? 'border-red-300 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                    />
                    {errors.time && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  {errors.time && (
                    <p className="mt-2 text-sm text-red-600">{errors.time}</p>
                  )}
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                    Durée (minutes)
                  </label>
                  <div className="mt-1">
                    <select
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 heure</option>
                      <option value="90">1 heure 30</option>
                      <option value="120">2 heures</option>
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes / Instructions
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Notes ou instructions spécifiques pour cet entretien..."
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Ajoutez des notes ou des instructions spécifiques pour cet entretien.
                  </p>
                </div>
                
                <div className="sm:col-span-6" id="aiAssistant">
                  <div className="bg-yellow-50 p-4 rounded-md mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <InformationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Changement d'assistant IA
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Changer l'assistant IA peut modifier l'expérience de l'entretien. 
                            Assurez-vous que le nouvel assistant correspond au poste et au niveau d'expérience du candidat.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <AIAssistantSelector
                    value={formData.aiAssistant}
                    onChange={handleSelectAssistant}
                    required={true}
                    label="Assistant IA pour cet entretien"
                  />
                  {errors.aiAssistant && (
                    <p className="mt-2 text-sm text-red-600">{errors.aiAssistant}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Mise à jour en cours...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
              <Link href={`/interviews/${id}`} legacyBehavior>
                <a className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  Annuler
                </a>
              </Link>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EditInterview;