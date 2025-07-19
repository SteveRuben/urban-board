import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Code, Database, Plus, X, PenTool, Calculator, FileText } from 'lucide-react';
import { ExtendedCodingPlatformService } from '@/services/extended-coding-platform-service';
import { 
  ChallengeDifficulty, 
  ExerciseFormData, 
  ProgrammingLanguage, 
  ExerciseCategory 
} from '@/types/coding-plateform';
import CodingPlatformService from '@/services/coding-platform-service';

interface ExtendedExerciseFormPageProps {
  exerciseId?: string;
}

export default function ExerciseFormPage({ exerciseId }: ExtendedExerciseFormPageProps) {
  const router = useRouter();
  const isEditing = !!exerciseId;
  
  const [formData, setFormData] = useState<ExerciseFormData>({
    title: '',
    description: '',
    category: 'developer', // 🆕 Nouveau champ
    language: 'python',
    difficulty: 'beginner',
    order_index: 1,
    required_skills: [], // 🆕 Nouveau champ
    estimated_duration_minutes: 60, // 🆕 Nouveau champ
    business_domain: ''
  });
  
  const [newSkill, setNewSkill] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les données de l'exercice si édition
  useEffect(() => {
    if (isEditing && exerciseId) {
      loadExercise();
    }
  }, [exerciseId, isEditing]);

  const loadExercise = async () => {
    try {
      setInitialLoading(true);
      // Utiliser le service original pour la compatibilité
      const { CodingPlatformService } = await import('@/services/coding-platform-service');
      const exercise = await CodingPlatformService.getExercise(exerciseId!);
      
      setFormData({
        title: exercise.title,
        description: exercise.description,
        category: exercise.category || 'developer',
        language: exercise.language,
        difficulty: exercise.difficulty,
        order_index: exercise.order_index,
        required_skills: exercise.required_skills || [],
        estimated_duration_minutes: exercise.estimated_duration_minutes || 60
      });
    } catch (err) {
      console.error('Erreur lors du chargement de l\'exercice:', err);
      setError('Impossible de charger l\'exercice. Veuillez réessayer.');
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Le titre doit contenir au moins 3 caractères';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'La description est requise';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La description doit contenir au moins 10 caractères';
    }

    if (!formData.category) {
      newErrors.category = 'La catégorie est requise';
    }

    if (formData.category === 'business_analyst' && !formData.business_domain?.trim()) {
      newErrors.business_domain = 'Le domaine business est requis pour les exercices business analyst';
    }
    // 🆕 Le langage est requis seulement pour les développeurs
    if (formData.category === 'developer' && !formData.language) {
      newErrors.language = 'Le langage est requis pour les exercices développeur';
    }

    // 🆕 Les compétences sont requises pour les data analysts
    if (formData.category === 'data_analyst' && (!formData.required_skills || formData.required_skills.length === 0)) {
      newErrors.required_skills = 'Au moins une compétence est requise pour les exercices data analyst';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'La difficulté est requise';
    }

    if (formData.order_index !== undefined && formData.order_index < 1) {
      newErrors.order_index = 'L\'ordre doit être supérieur à 0';
    }

    if (formData.estimated_duration_minutes !== undefined && formData.estimated_duration_minutes <= 0) {
      newErrors.estimated_duration_minutes = 'La durée estimée doit être supérieure à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Préparer les données selon la catégorie
      const submitData = {
        ...formData,
        // 🆕 Ne pas envoyer le language si data_analyst
        ...(formData.category === 'data_analyst' && { language: undefined })
      };

      if (isEditing && exerciseId) {
        // Utiliser le service original pour l'édition
        const { CodingPlatformService } = await import('@/services/coding-platform-service');
        await CodingPlatformService.updateExercise(exerciseId, submitData);
      } else {
        // 🆕 Utiliser le service étendu pour la création
        await ExtendedCodingPlatformService.createExerciseExtended(submitData);
      }

      router.push('/coding-admin/exercises');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(isEditing ? 'Erreur lors de la mise à jour de l\'exercice' : 'Erreur lors de la création de l\'exercice');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof ExerciseFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // 🆕 Gestion des compétences
  const addSkill = () => {
    if (newSkill.trim() && !formData.required_skills?.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...(prev.required_skills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills?.filter(skill => skill !== skillToRemove) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  // 🆕 Gestion du changement de catégorie
  const handleCategoryChange = (category: ExerciseCategory) => {
    setFormData(prev => ({
      ...prev,
      category,
      // Réinitialiser les champs selon la catégorie
      ...(category === 'developer' && {
        language: prev.language || 'python',
        required_skills: []
      }),
      ...(category === 'data_analyst' && {
        language: undefined,
        required_skills: prev.required_skills || []
      }),
      ...(category === 'business_analyst' && {
        language: undefined,
        required_skills: [],
        business_domain: prev.business_domain || ''
      }),
      ...(category === 'secretary' && {
        language: undefined,
        required_skills: [],
        business_domain: undefined
      }),
      ...(category === 'accountant' && {
        language: undefined,
        required_skills: [],
        business_domain: undefined
      })
    }));
  };

  if (initialLoading) {
    return (
      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Chargement de l'exercice...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{isEditing ? 'Modifier l\'exercice' : 'Nouvel exercice'} - Administration</title>
        <meta name="description" content={isEditing ? 'Modifier un exercice existant' : 'Créer un nouvel exercice'} />
      </Head>

      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* En-tête */}
            <div className="flex items-center mb-8">
              <Link
                href="/coding-admin/exercises"
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour aux exercices
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {isEditing ? 'Modifier l\'exercice' : 'Nouvel exercice'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditing ? 'Modifiez les informations de l\'exercice' : 'Créez un exercice pour développeurs ou data analysts'}
                </p>
              </div>
            </div>

            {/* Message d'erreur global */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Formulaire */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center">
                {formData.category === 'developer' ? (
                  <Code className="h-6 w-6 text-blue-600 mr-3" />
                ) : formData.category === 'data_analyst' ? (
                  <Database className="h-6 w-6 text-emerald-600 mr-3" />
                ) : (
                  <PenTool className="h-6 w-6 text-purple-600 mr-3" />
                )}
                <h2 className="text-lg font-medium text-gray-800">Informations de l'exercice</h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* 🆕 Catégorie d'exercice */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie d'exercice *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => handleCategoryChange('developer')}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.category === 'developer'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <Code className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <h3 className="font-medium text-gray-900">Développeur</h3>
                            <p className="text-sm text-gray-500">Algorithmique, programmation</p>
                          </div>
                        </div>
                      </div>
                      <div
                        onClick={() => handleCategoryChange('data_analyst')}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.category === 'data_analyst'
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <Database className="h-5 w-5 text-emerald-600 mr-2" />
                          <div>
                            <h3 className="font-medium text-gray-900">Data Analyst</h3>
                            <p className="text-sm text-gray-500">SQL, analyse, visualisation</p>
                          </div>
                        </div>
                      </div>
                      <div
                      onClick={() => handleCategoryChange('business_analyst')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.category === 'business_analyst'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <PenTool className="h-5 w-5 text-purple-600 mr-2" />
                        <div>
                          <h3 className="font-medium text-gray-900">Business Analyst</h3>
                          <p className="text-sm text-gray-500">UML, BPMN, maquettes</p>
                        </div>
                      </div>
                    </div>
                    <div
                      onClick={() => handleCategoryChange('secretary')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.category === 'secretary'
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-pink-600 mr-2" />
                        <div>
                          <h3 className="font-medium text-gray-900">Secrétaire</h3>
                          <p className="text-sm text-gray-500">Rédaction, correspondance</p>
                        </div>
                      </div>
                    </div>

                    {/* NOUVELLE option Comptable */}
                    <div
                      onClick={() => handleCategoryChange('accountant')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.category === 'accountant'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <Calculator className="h-5 w-5 text-orange-600 mr-2" />
                        <div>
                          <h3 className="font-medium text-gray-900">Comptable</h3>
                          <p className="text-sm text-gray-500">Calculs, analyse financière</p>
                        </div>
                      </div>
                  </div>
                    </div>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                    )}
                  </div>

                  {/* Titre */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Titre de l'exercice *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={
                        formData.category === 'developer' 
                          ? "Ex: Algorithmes de tri" 
                          : "Ex: Analyse des ventes e-commerce"
                      }
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Décrivez l'objectif et le contenu de cet exercice..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>
                  {formData.category === 'business_analyst' && (
                    <div>
                      <label htmlFor="business_domain" className="block text-sm font-medium text-gray-700 mb-2">
                        Domaine business *
                      </label>
                      <select
                        id="business_domain"
                        value={formData.business_domain || ''}
                        onChange={(e) => handleInputChange('business_domain', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.business_domain ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Sélectionner un domaine</option>
                        <option value="e-commerce">E-commerce</option>
                        <option value="finance">Finance & Banque</option>
                        <option value="healthcare">Santé</option>
                        <option value="education">Éducation</option>
                        <option value="logistics">Logistique</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="retail">Commerce de détail</option>
                        <option value="telecommunications">Télécommunications</option>
                        <option value="government">Secteur public</option>
                        <option value="insurance">Assurance</option>
                      </select>
                      {errors.business_domain && (
                        <p className="mt-1 text-sm text-red-600">{errors.business_domain}</p>
                      )}
                    </div>
                  )}
                  {/* 🆕 Champs conditionnels selon la catégorie */}
                  {formData.category === 'developer' && (
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                        Langage de programmation *
                      </label>
                      <select
                        id="language"
                        value={formData.language || ''}
                        onChange={(e) => handleInputChange('language', e.target.value as ProgrammingLanguage)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.language ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                      </select>
                      {errors.language && (
                        <p className="mt-1 text-sm text-red-600">{errors.language}</p>
                      )}
                    </div>
                  )}

                  {formData.category === 'data_analyst' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compétences requises *
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.required_skills?.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-md"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-1 text-emerald-600 hover:text-emerald-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: sql, python, data-analysis..."
                        />
                        <button
                          type="button"
                          onClick={addSkill}
                          className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {errors.required_skills && (
                        <p className="mt-1 text-sm text-red-600">{errors.required_skills}</p>
                      )}
                    </div>
                  )}

                  {/* Difficulté et Durée */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                        Niveau de difficulté *
                      </label>
                      <select
                        id="difficulty"
                        value={formData.difficulty}
                        onChange={(e) => handleInputChange('difficulty', e.target.value as ChallengeDifficulty)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.difficulty ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="beginner">Débutant</option>
                        <option value="intermediate">Intermédiaire</option>
                        <option value="advanced">Avancé</option>
                        <option value="expert">Expert</option>
                      </select>
                      {errors.difficulty && (
                        <p className="mt-1 text-sm text-red-600">{errors.difficulty}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="estimated_duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                        Durée estimée (minutes) *
                      </label>
                      <input
                        type="number"
                        id="estimated_duration_minutes"
                        min="1"
                        value={formData.estimated_duration_minutes || ''}
                        onChange={(e) => handleInputChange('estimated_duration_minutes', parseInt(e.target.value) || 60)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.estimated_duration_minutes ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="60"
                      />
                      {errors.estimated_duration_minutes && (
                        <p className="mt-1 text-sm text-red-600">{errors.estimated_duration_minutes}</p>
                      )}
                    </div>
                  </div>

                  {/* Ordre */}
                  <div>
                    <label htmlFor="order_index" className="block text-sm font-medium text-gray-700 mb-2">
                      Ordre d'affichage
                    </label>
                    <input
                      type="number"
                      id="order_index"
                      min="1"
                      value={formData.order_index || ''}
                      onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 1)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.order_index ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="1"
                    />
                    {errors.order_index && (
                      <p className="mt-1 text-sm text-red-600">{errors.order_index}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Détermine l'ordre d'affichage dans la liste des exercices
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <Link
                    href="/coding-admin/exercises"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isEditing ? 'Mise à jour...' : 'Création...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isEditing ? 'Mettre à jour' : 'Créer l\'exercice'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 🆕 Info spécialisée selon la catégorie */}
            {!isEditing && (
              <div className={`mt-6 rounded-md p-4 ${
                formData.category === 'developer' 
                  ? 'bg-blue-50 border border-blue-200' 
                  : formData.category === 'data_analyst'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-purple-50 border border-purple-200'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {formData.category === 'developer' ? (
                      <Code className="h-5 w-5 text-blue-400" />
                    ) : formData.category === 'data_analyst' ? (
                      <Database className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <PenTool className="h-5 w-5 text-purple-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      formData.category === 'developer' 
                      ? 'text-blue-800' 
                      : formData.category === 'data_analyst'
                      ? 'text-emerald-800'
                      : 'text-purple-800'
                    }`}>
                      Prochaines étapes - {CodingPlatformService.getExerciseCategoryLabel(formData.category)}
                    </h3>
                    <div className={`mt-2 text-sm ${
                      formData.category === 'developer' 
                      ? 'text-blue-700'
                      : formData.category === 'data_analyst'
                      ? 'text-emerald-700'
                      : 'text-purple-700' 
                    }`}>
                      <p>Après avoir créé cet exercice, vous pourrez :</p>
                      {formData.category === 'secretary' ? (
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Créer des modèles de documents</li>
                          <li>Définir des critères de qualité rédactionnelle</li>
                          <li>Configurer la validation orthographique</li>
                          <li>Tester avec l'éditeur de texte intégré</li>
                        </ul>
                      ) : formData.category === 'accountant' ? (
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Configurer des modèles financiers</li>
                          <li>Définir des règles de validation comptable</li>
                          <li>Créer des tests de calculs complexes</li>
                          <li>Tester avec l'éditeur de tableur intégré</li>
                        </ul>
                      ) :formData.category === 'developer' ? (
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Ajouter des challenges algorithmiques</li>
                          <li>Créer des étapes avec code de démarrage</li>
                          <li>Définir des cas de test d'entrée/sortie</li>
                          <li>Tester avec l'éditeur de code intégré</li>
                        </ul>
                       ) : formData.category === 'data_analyst' ? (
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Ajouter des datasets CSV, SQL, Excel</li>
                          <li>Créer des challenges SQL et Python</li>
                          <li>Définir des tests de visualisation</li>
                          <li>Tester avec notebooks Jupyter</li>
                        </ul>
                      ) : (
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Créer des templates de diagrammes UML/BPMN</li>
                          <li>Définir des critères d'évaluation manuels</li>
                          <li>Paramétrer l'éditeur de diagrammes</li>
                          <li>Tester avec différents formats (StarUML, Draw.io)</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}