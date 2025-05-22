// frontend/pages/jobs/[id]/edit.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { JobService } from '@/services/jobs-service';
import { JobPosting } from '@/types/jobs';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  location: string;
  employment_type: string;
  remote_policy: string;
  salary_range_min: number | null;
  salary_range_max: number | null;
  salary_currency: string;
  closes_at: string;
  is_featured: boolean;
}

export default function EditJobPostingPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    employment_type: '',
    remote_policy: '',
    salary_range_min: null,
    salary_range_max: null,
    salary_currency: 'EUR',
    closes_at: '',
    is_featured: false,
  });

  // Charger les détails de l'offre
  useEffect(() => {
    if (!id) return;

    const fetchJobPosting = async () => {
      try {
        setLoading(true);
        const data = await JobService.getJobPosting(id as string);
        
        // Vérifier que l'offre est bien en brouillon
        if (data.status !== 'draft') {
          setError('Seules les offres en brouillon peuvent être modifiées.');
          return;
        }
        
        setJobPosting(data);
        
        // Pré-remplir le formulaire
        setFormData({
          title: data.title || '',
          description: data.description || '',
          requirements: data.requirements || '',
          responsibilities: data.responsibilities || '',
          location: data.location || '',
          employment_type: data.employment_type || '',
          remote_policy: data.remote_policy || '',
          salary_range_min: data.salary_range_min,
          salary_range_max: data.salary_range_max,
          salary_currency: data.salary_currency || 'EUR',
          closes_at: data.closes_at ? data.closes_at.split('T')[0] : '',
          is_featured: data.is_featured || false,
        });
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'offre:', err);
        setError('Impossible de charger les détails de l\'offre.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobPosting();
  }, [id]);

  // Gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      const numValue = value === '' ? null : Number(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Validation du formulaire
  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return 'Le titre est obligatoire.';
    }
    if (!formData.description.trim()) {
      return 'La description est obligatoire.';
    }
    if (formData.salary_range_min && formData.salary_range_max && formData.salary_range_min >= formData.salary_range_max) {
      return 'Le salaire minimum doit être inférieur au salaire maximum.';
    }
    return null;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent, shouldPublish = false) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!jobPosting) return;

    try {
      setSaving(true);
      setError(null);
      
      // Sauvegarder les modifications
      const updatedJob = await JobService.updateJobPosting(jobPosting.id, formData);
      
      // Si demandé, publier immédiatement après la sauvegarde
      if (shouldPublish) {
        const publishedJob = await JobService.publishJobPosting(updatedJob.id);
        // Rediriger vers la page de détail
        router.push(`/jobs/${publishedJob.id}`);
      } else {
        // Rediriger vers la page de détail
        router.push(`/jobs/${updatedJob.id}`);
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Impossible de sauvegarder les modifications. Veuillez réessayer.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Gérer la sauvegarde simple
  const handleSave = (e: React.FormEvent) => {
    handleSubmit(e, false);
  };

  // Gérer la sauvegarde et publication
  const handleSaveAndPublish = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm('Êtes-vous sûr de vouloir sauvegarder et publier cette offre ? Une fois publiée, vous ne pourrez plus la modifier.')) {
      return;
    }
    
    handleSubmit(e, true);
  };

  // Annuler les modifications
  const handleCancel = () => {
    if (jobPosting) {
      router.push(`/jobs/${jobPosting.id}`);
    } else {
      router.push('/jobs');
    }
  };

  return (
    <>
      <Head>
        <title>
          {loading
            ? 'Chargement...'
            : jobPosting
            ? `Modifier - ${jobPosting.title}`
            : 'Modifier l\'offre d\'emploi'}
        </title>
        <meta name="description" content="Modifier l'offre d'emploi" />
      </Head>

      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Bouton de retour */}
            <div className="mb-6">
              <Link 
                href={jobPosting ? `/jobs/${jobPosting.id}` : '/jobs'} 
                className="inline-flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour aux détails
              </Link>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-500">Chargement de l'offre...</p>
              </div>
            ) : !jobPosting ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500 mb-4">Offre d'emploi non trouvée ou impossible à modifier.</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Retour aux offres
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-900">Modifier l'offre d'emploi</h1>
                  <p className="text-gray-600 mt-1">Modifiez les détails de votre offre d'emploi en brouillon</p>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-6">
                  {/* Informations de base */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Titre du poste *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ex: Développeur Full Stack Senior"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                        Localisation
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ex: Paris, France"
                      />
                    </div>

                    <div>
                      <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700 mb-2">
                        Type d'emploi
                      </label>
                      <select
                        id="employment_type"
                        name="employment_type"
                        value={formData.employment_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="full-time">Temps plein</option>
                        <option value="part-time">Temps partiel</option>
                        <option value="contract">Contrat</option>
                        <option value="internship">Stage</option>
                        <option value="temporary">Temporaire</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="remote_policy" className="block text-sm font-medium text-gray-700 mb-2">
                        Politique de télétravail
                      </label>
                      <select
                        id="remote_policy"
                        name="remote_policy"
                        value={formData.remote_policy}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="remote">Télétravail complet</option>
                        <option value="hybrid">Hybride</option>
                        <option value="on-site">Sur site</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="closes_at" className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fermeture
                      </label>
                      <input
                        type="date"
                        id="closes_at"
                        name="closes_at"
                        value={formData.closes_at}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Salaire */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="salary_range_min" className="block text-sm font-medium text-gray-700 mb-2">
                        Salaire minimum
                      </label>
                      <input
                        type="number"
                        id="salary_range_min"
                        name="salary_range_min"
                        value={formData.salary_range_min || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="35000"
                      />
                    </div>

                    <div>
                      <label htmlFor="salary_range_max" className="block text-sm font-medium text-gray-700 mb-2">
                        Salaire maximum
                      </label>
                      <input
                        type="number"
                        id="salary_range_max"
                        name="salary_range_max"
                        value={formData.salary_range_max || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="55000"
                      />
                    </div>

                    <div>
                      <label htmlFor="salary_currency" className="block text-sm font-medium text-gray-700 mb-2">
                        Devise
                      </label>
                      <select
                        id="salary_currency"
                        name="salary_currency"
                        value={formData.salary_currency}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="CAD">CAD</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description du poste *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={6}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Décrivez le poste, les missions principales, l'environnement de travail..."
                      required
                    />
                  </div>

                  {/* Responsabilités */}
                  <div>
                    <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700 mb-2">
                      Responsabilités principales
                    </label>
                    <textarea
                      id="responsibilities"
                      name="responsibilities"
                      rows={4}
                      value={formData.responsibilities}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Listez les principales responsabilités du poste..."
                    />
                  </div>

                  {/* Prérequis */}
                  <div>
                    <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                      Prérequis et qualifications
                    </label>
                    <textarea
                      id="requirements"
                      name="requirements"
                      rows={4}
                      value={formData.requirements}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Décrivez les compétences, expériences et qualifications requises..."
                    />
                  </div>

                  {/* Options avancées */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_featured"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                      Mettre cette offre en avant
                    </label>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndPublish}
                      disabled={saving}
                      className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sauvegarde et publication...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder et publier
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}