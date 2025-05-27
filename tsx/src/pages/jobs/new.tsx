import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle, 
  Save, 
  XCircle, 
  FileText, 
  Edit, 
  Upload, 
  Eye,
  Download,
  AlertCircle
} from 'lucide-react';
import { JobPostingFormData } from '@/types/jobs';
import { JobService } from '@/services/jobs-service';

export default function NewJobPostingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  
  // États pour la création manuelle
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

  // États pour l'upload de fichier
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    requirements: '',
    responsibilities: '',
    location: '',
    employment_type: '',
    remote_policy: '',
    salary_range_min: '',
    salary_range_max: '',
    salary_currency: 'EUR'
  });
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

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

  // Handler pour les changements de formulaire manuel
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler pour les changements de formulaire upload
  const handleUploadDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUploadData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler pour l'upload de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation basique du fichier
      const maxSize = 16 * 1024 * 1024; // 16MB
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (file.size > maxSize) {
        setError('Le fichier ne peut pas dépasser 16MB');
        e.target.value = '';
        return;
      }
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('Seuls les fichiers PDF, DOC, DOCX, TXT et RTF sont acceptés');
        e.target.value = '';
        return;
      }
      
      setUploadFile(file);
      setError(null);
      // Réinitialiser les états d'upload précédents
      setFileUrl(null);
      setFilePreview(null);
    }
  };

  // Upload du fichier
  const handleFileUpload = async () => {
    if (!uploadFile) return;

    try {
      setUploading(true);
      setError(null);
      
      const result = await JobService.uploadJobPostingFile(uploadFile);
      setFileUrl(result.file_url);
      setFilePreview(result.filename);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  const validateManualForm = (): boolean => {
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

  const validateUploadForm = (): boolean => {
    if (!uploadData.title.trim()) {
      setError('Le titre de l\'offre est obligatoire');
      return false;
    }
    if (!uploadFile && !fileUrl) {
      setError('Vous devez sélectionner un fichier à uploader');
      return false;
    }
    
    // Validation des salaires si fournis
    if (uploadData.salary_range_min && uploadData.salary_range_max) {
      const min = parseInt(uploadData.salary_range_min);
      const max = parseInt(uploadData.salary_range_max);
      if (min > max) {
        setError('Le salaire minimum ne peut pas être supérieur au salaire maximum');
        return false;
      }
    }
    
    return true;
  };

  const handleManualSubmit = async (e: React.FormEvent, publishImmediately: boolean = false) => {
    e.preventDefault();
    
    if (!validateManualForm()) {
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
      await JobService.createJobPosting(dataToSubmit);

      // Redirection vers la liste des offres avec un message de succès
      router.push({
        pathname: '/jobs',
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

  const handleUploadSubmit = async (e: React.FormEvent, publishImmediately: boolean = false) => {
    e.preventDefault();
    
    if (!validateUploadForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      let finalFileUrl = fileUrl;
      
      // Si le fichier n'a pas encore été uploadé, l'uploader maintenant
      if (uploadFile && !fileUrl) {
        setUploading(true);
        try {
          const result = await JobService.uploadJobPostingFile(uploadFile);
          finalFileUrl = result.file_url;
          setFileUrl(result.file_url);
          setFilePreview(result.filename);
        } catch (uploadErr: any) {
          setError(uploadErr.message || 'Erreur lors de l\'upload du fichier');
          return;
        } finally {
          setUploading(false);
        }
      }
      
      // Préparer les données pour la création depuis fichier
      const dataToSubmit = {
        title: uploadData.title,
        file_url: finalFileUrl!,
        requirements: uploadData.requirements || undefined,
        responsibilities: uploadData.responsibilities || undefined,
        location: uploadData.location || undefined,
        employment_type: uploadData.employment_type || undefined,
        remote_policy: uploadData.remote_policy || undefined,
        salary_range_min: uploadData.salary_range_min ? parseInt(uploadData.salary_range_min) : undefined,
        salary_range_max: uploadData.salary_range_max ? parseInt(uploadData.salary_range_max) : undefined,
        salary_currency: uploadData.salary_currency
      };
      
      // Créer l'offre depuis le fichier
      const result = await JobService.createJobPostingFromFile(dataToSubmit);
      
      // Si on veut publier immédiatement
      if (publishImmediately) {
        await JobService.publishJobPosting(result.job_posting.id);
      }

      // Redirection vers la liste des offres avec un message de succès
      router.push({
        pathname: '/jobs',
        query: { success: 'created' }
      });
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'offre depuis fichier:', err);
      setError(
        err.response?.data?.error || 
        'Impossible de créer l\'offre d\'emploi depuis le fichier. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
      setUploading(false);
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
                <Link href="/jobs" className="text-gray-500 hover:text-gray-700 mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Nouvelle offre d'emploi</h1>
              </div>
              <p className="text-gray-600">
                Créez une nouvelle offre d'emploi soit en saisissant les informations manuellement, 
                soit en uploadant un fichier existant.
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Onglets */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('manual')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'manual'
                        ? 'border-primary-500 text-primary-600 bg-primary-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Edit className="h-5 w-5 inline mr-2" />
                    Création manuelle
                  </button>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'upload'
                        ? 'border-primary-500 text-primary-600 bg-primary-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="h-5 w-5 inline mr-2" />
                    Upload de fichier
                  </button>
                </nav>
              </div>

              {/* Contenu de l'onglet création manuelle */}
              {activeTab === 'manual' && (
                <form onSubmit={(e) => handleManualSubmit(e, false)}>
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
                      onClick={() => router.push('/jobs')}
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
                        onClick={(e) => handleManualSubmit(e, true)}
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
              )}

              {/* Contenu de l'onglet upload de fichier */}
              {activeTab === 'upload' && (
                <form onSubmit={(e) => handleUploadSubmit(e, false)}>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Upload de fichier d'offre</h2>
                    <p className="text-gray-600 mt-1">
                      Uploadez un fichier contenant votre offre d'emploi (PDF, DOC, DOCX, TXT, RTF)
                    </p>
                    <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
                      <p className="text-blue-800 text-sm">
                        💡 <strong>Astuce :</strong> Sélectionnez votre fichier et remplissez le titre. L'upload se fera automatiquement lors de la création de l'offre.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Upload de fichier */}
                    <div>
                      <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                        Fichier d'offre d'emploi <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          id="file-upload"
                          accept=".pdf,.doc,.docx,.txt,.rtf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="file-upload"
                          className={`flex items-center justify-center w-full border-2 border-dashed rounded-lg px-4 py-6 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                            uploadFile
                              ? "border-green-300 bg-green-50"
                              : "border-gray-300"
                          }`}
                        >
                          <div className="text-center">
                            {uploadFile ? (
                              <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                  <FileText className="h-8 w-8 text-green-600" />
                                </div>
                                <p className="text-green-600 font-medium">{uploadFile.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • <span className="text-primary-600 underline">Changer</span>
                                </p>
                                <p className="text-xs text-green-600 mt-2 font-medium">
                                  ✓ Fichier prêt à être uploadé
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <Upload className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600 font-medium">
                                  Glissez-déposez votre fichier ici ou <span className="text-primary-600">parcourez</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, TXT, RTF (max 16MB)</p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>

                      {fileUrl && filePreview && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                              <span className="text-green-800 font-medium">Fichier uploadé: {filePreview}</span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => {/* Logique de prévisualisation */}}
                                className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Prévisualiser
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {uploadFile && !fileUrl && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center">
                            <div className="flex items-center">
                              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mr-2"></div>
                              <span className="text-blue-800 text-sm">
                                Le fichier sera uploadé automatiquement lors de la création de l'offre
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Titre obligatoire */}
                    <div>
                      <label htmlFor="upload-title" className="block text-sm font-medium text-gray-700 mb-1">
                        Titre du poste <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="upload-title"
                        name="title"
                        value={uploadData.title}
                        onChange={handleUploadDataChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ex: Développeur Full-stack React/Node.js"
                      />
                    </div>

                    {/* Informations supplémentaires optionnelles */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Informations supplémentaires (optionnel)</h3>
                      
                      {/* Lieu */}
                      <div className="mb-4">
                        <label htmlFor="upload-location" className="block text-sm font-medium text-gray-700 mb-1">
                          Lieu de travail
                        </label>
                        <input
                          type="text"
                          id="upload-location"
                          name="location"
                          value={uploadData.location}
                          onChange={handleUploadDataChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Ex: Paris, France"
                        />
                      </div>

                      {/* Type d'emploi et politique de télétravail */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <label htmlFor="upload-employment_type" className="block text-sm font-medium text-gray-700 mb-1">
                            Type d'emploi
                          </label>
                          <select
                            id="upload-employment_type"
                            name="employment_type"
                            value={uploadData.employment_type}
                            onChange={handleUploadDataChange}
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
                          <label htmlFor="upload-remote_policy" className="block text-sm font-medium text-gray-700 mb-1">
                            Politique de télétravail
                          </label>
                          <select
                            id="upload-remote_policy"
                            name="remote_policy"
                            value={uploadData.remote_policy}
                            onChange={handleUploadDataChange}
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
                        <h4 className="text-md font-medium text-gray-700 mb-3">Fourchette de salaire</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="upload-salary_range_min" className="block text-sm font-medium text-gray-700 mb-1">
                              Minimum
                            </label>
                            <input
                              type="number"
                              id="upload-salary_range_min"
                              name="salary_range_min"
                              value={uploadData.salary_range_min}
                              onChange={handleUploadDataChange}
                              min="0"
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Ex: 40000"
                            />
                          </div>
                          <div>
                            <label htmlFor="upload-salary_range_max" className="block text-sm font-medium text-gray-700 mb-1">
                              Maximum
                            </label>
                            <input
                              type="number"
                              id="upload-salary_range_max"
                              name="salary_range_max"
                              value={uploadData.salary_range_max}
                              onChange={handleUploadDataChange}
                              min="0"
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Ex: 60000"
                            />
                          </div>
                          <div>
                            <label htmlFor="upload-salary_currency" className="block text-sm font-medium text-gray-700 mb-1">
                              Devise
                            </label>
                            <select
                              id="upload-salary_currency"
                              name="salary_currency"
                              value={uploadData.salary_currency}
                              onChange={handleUploadDataChange}
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
                    </div>
                  </div>

                  {/* Actions du formulaire upload */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                    <button
                      type="button"
                      onClick={() => router.push('/jobs')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 flex items-center"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Annuler
                    </button>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center"
                        disabled={loading || uploading}
                      >
                        <Save className="h-5 w-5 mr-2" />
                        Enregistrer comme brouillon
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleUploadSubmit(e, true)}
                        className="px-6 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700 flex items-center"
                        disabled={loading || uploading}
                      >
                        {loading || uploading ? (
                          <>
                            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></span>
                            {uploading ? "Upload en cours..." : "Traitement..."}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}