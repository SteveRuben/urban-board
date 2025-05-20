// frontend/pages/job-postings/new.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Save, XCircle } from 'lucide-react';
import { JobPostingFormData } from '@/types/job-posting';
import { jobPostingService } from '@/services/job-posting-service';


export default function NewJobPostingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    employment_type: '',
    remote_policy: '',
    salary_range_min: '',
    salary_range_max: '',
    salary_currency: 'EUR',
    status: 'draft',
    closes_at: ''
  });

  // Options pour les champs select
  const employmentTypes = [
    { value: '', label: 'Sélectionner...' },
    { value: 'full-time', label: 'Temps plein' },
    { value: 'part-time', label: 'Temps partiel' },
    { value: 'contract', label: 'Contrat' },
    { value: 'internship', label: 'Stage' },
    { value: 'temporary', label: 'Temporaire' }
  ];

  const remotePolicies = [
    { value: '', label: 'Sélectionner...' },
    { value: 'remote', label: 'Télétravail' },
    { value: 'hybrid', label: 'Hybride' },
    { value: 'on-site', label: 'Sur site' }
  ];

  const currencies = [
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD ($)' },
    { value: 'XAF', label: 'XAF (FCFA)' }
  ];

  // Handler pour les changements de formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Le titre de l\'offre est obligatoire');
      return false;
    }
    if (!formData.description.trim()) {
      setError('La description est obligatoire');
      return false;
    }
    
    // Validation des salaires si fournis
    if (formData.salary_range_min && formData.salary_range_max) {
      const min = parseInt(formData.salary_range_min);
      const max = parseInt(formData.salary_range_max);
      if (min > max) {
        setError('Le salaire minimum ne peut pas être supérieur au salaire maximum');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent, publishImmediately: boolean = false) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
      
  try {
    setLoading(true);
    setError(null);
    
    // Préparer les données
    const dataToSubmit: JobPostingFormData = {
      ...formData,
      status: publishImmediately ? 'published' : 'draft',
      salary_range_min: formData.salary_range_min ? parseInt(formData.salary_range_min) : null,
      salary_range_max: formData.salary_range_max ? parseInt(formData.salary_range_max) : null,
    };
    
    // Envoyer la requête via le service
    await jobPostingService.createJobPosting(dataToSubmit);

      // Redirection vers la liste des offres avec un message de succès
      router.push({
        pathname: '/job-postings',
        query: { success: 'created' }
      });
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'offre:', err);
      setError(
        err.response?.data?.error || 
        'Impossible de créer l\'offre d\'emploi. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Créer une nouvelle offre d'emploi</title>
        <meta name="description" content="Créez une nouvelle offre d'emploi pour votre organisation" />
      </Head>

      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête de la page */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Link href="/job-postings" className="text-gray-500 hover:text-gray-700 mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Nouvelle offre d'emploi</h1>
              </div>
              <p className="text-gray-600">
                Créez une nouvelle offre d'emploi pour votre organisation. Les offres enregistrées comme brouillon 
                peuvent être modifiées avant publication.
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={(e) => handleSubmit(e, false)} className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Informations du poste</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Titre */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du poste <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: Développeur Full-stack React/Node.js"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description du poste <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Description détaillée du poste, de l'entreprise et du contexte..."
                  ></textarea>
                </div>

                {/* Pré-requis */}
                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
                    Prérequis / Qualifications
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Expérience, diplômes, compétences techniques requises..."
                  ></textarea>
                </div>

                {/* Responsabilités */}
                <div>
                  <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700 mb-1">
                    Responsabilités
                  </label>
                  <textarea
                    id="responsibilities"
                    name="responsibilities"
                    value={formData.responsibilities}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Responsabilités principales et tâches quotidiennes..."
                  ></textarea>
                </div>

                {/* Lieu */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu de travail
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: Paris, France"
                  />
                </div>

                {/* Type d'emploi et politique de télétravail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700 mb-1">
                      Type d'emploi
                    </label>
                    <select
                      id="employment_type"
                      name="employment_type"
                      value={formData.employment_type}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {employmentTypes.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="remote_policy" className="block text-sm font-medium text-gray-700 mb-1">
                      Politique de télétravail
                    </label>
                    <select
                      id="remote_policy"
                      name="remote_policy"
                      value={formData.remote_policy}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {remotePolicies.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Salaire */}
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-3">Fourchette de salaire (optionnel)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="salary_range_min" className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum
                      </label>
                      <input
                        type="number"
                        id="salary_range_min"
                        name="salary_range_min"
                        value={formData.salary_range_min}
                        onChange={handleChange}
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ex: 40000"
                      />
                    </div>
                    <div>
                      <label htmlFor="salary_range_max" className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum
                      </label>
                      <input
                        type="number"
                        id="salary_range_max"
                        name="salary_range_max"
                        value={formData.salary_range_max}
                        onChange={handleChange}
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ex: 60000"
                      />
                    </div>
                    <div>
                      <label htmlFor="salary_currency" className="block text-sm font-medium text-gray-700 mb-1">
                        Devise
                      </label>
                      <select
                        id="salary_currency"
                        name="salary_currency"
                        value={formData.salary_currency}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {currencies.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Date de clôture */}
                <div>
                  <label htmlFor="closes_at" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de clôture (optionnel)
                  </label>
                  <input
                    type="date"
                    id="closes_at"
                    name="closes_at"
                    value={formData.closes_at}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Si non spécifié, la date par défaut sera de 30 jours après la publication.
                  </p>
                </div>
              </div>

              {/* Actions du formulaire */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                  type="button"
                  onClick={() => router.push('/job-postings')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 flex items-center"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Annuler
                </button>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center"
                    disabled={loading}
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Enregistrer comme brouillon
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="px-6 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700 flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></span>
                        Traitement...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Publier
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}