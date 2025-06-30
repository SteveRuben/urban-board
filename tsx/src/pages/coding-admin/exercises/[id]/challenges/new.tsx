import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Target, Plus, X } from 'lucide-react';
import { CodingPlatformService } from '@/services/coding-platform-service';
import { ChallengeFormData, ChallengeStatus, Exercise } from '@/types/coding-plateform';



export default function ChallengeFormPage() {
  const router = useRouter();
  const {id} = router.query
  const isCreatingFromExercise = !!id;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState<ChallengeFormData>({
    exercise_id: id?.toString() || '',
    title: '',
    description: '',
    constraints: '',
    tags: [],
    status: 'draft',
    order_index: 1,
    estimated_time_minutes: 30
  });
  
  const [newTag, setNewTag] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les données nécessaires
  useEffect(() => {
    
      loadExercise();
    
  }, [isCreatingFromExercise]);

  

  const loadExercise = async () => {
    try {
      const exerciseData = await CodingPlatformService.getExercise(id?.toString() || '');
      setExercise(exerciseData);
      
      // Définir le prochain ordre basé sur le nombre de challenges existants
      setFormData(prev => ({
        ...prev,
        order_index: (exerciseData.challenge_count || 0) + 1
      }));
    } catch (err) {
      console.error('Erreur lors du chargement de l\'exercice:', err);
      setError('Impossible de charger l\'exercice. Veuillez réessayer.');
    } 
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Le titre doit contenir au moins 3 caractères';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La description doit contenir au moins 10 caractères';
    }

    if (!formData.exercise_id ) {
      newErrors.exercise_id = 'L\'exercice est requis';
    }

    if (formData.estimated_time_minutes !== undefined && formData.estimated_time_minutes <= 0) {
      newErrors.estimated_time_minutes = 'Le temps estimé doit être supérieur à 0';
    }

    if (formData.order_index !== undefined && formData.order_index < 1) {
      newErrors.order_index = 'L\'ordre doit être supérieur à 0';
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

      
        const newChallenge = await CodingPlatformService.createChallenge(formData);
        router.push(`/coding-admin/challenges/${newChallenge.id}`);
      
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError( 'Erreur lors de la création du challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ChallengeFormData, value: any) => {
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

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  

  const backUrl = exercise 
      ? `/coding-admin/exercises/${exercise.id}` 
      : '/coding-admin/exercises';

  return (
    <>
     

      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="flex items-center mb-8">
              <Link
                href={backUrl}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                   Nouveau challenge
                </h1>
                {exercise && (
                  <p className="text-gray-600 mt-1">
                    Exercice: {exercise.title}
                  </p>
                )}
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
                <Target className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-lg font-medium text-gray-800">Informations du challenge</h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Titre */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Titre du challenge *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ex: Tri par fusion"
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
                      rows={6}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Décrivez en détail ce que l'utilisateur doit accomplir..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>

                  {/* Contraintes */}
                  <div>
                    <label htmlFor="constraints" className="block text-sm font-medium text-gray-700 mb-2">
                      Contraintes techniques
                    </label>
                    <textarea
                      id="constraints"
                      rows={3}
                      value={formData.constraints}
                      onChange={(e) => handleInputChange('constraints', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Complexité temporelle O(n log n), espace O(n)..."
                    />
                  </div>

                  {/* Temps estimé, Statut et Ordre */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="estimated_time_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                        Temps estimé (minutes) *
                      </label>
                      <input
                        type="number"
                        id="estimated_time_minutes"
                        min="1"
                        value={formData.estimated_time_minutes || ''}
                        onChange={(e) => handleInputChange('estimated_time_minutes', parseInt(e.target.value) || 30)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.estimated_time_minutes ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="30"
                      />
                      {errors.estimated_time_minutes && (
                        <p className="mt-1 text-sm text-red-600">{errors.estimated_time_minutes}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        Statut
                      </label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value as ChallengeStatus)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="draft">Brouillon</option>
                        <option value="published">Publié</option>
                        <option value="archived">Archivé</option>
                      </select>
                    </div>

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
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags/Mots-clés
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ajouter un tag..."
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <Link
                    href={backUrl}
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
                        Création...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                       Créer le challenge
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Target className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Prochaines étapes</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Après avoir créé ce challenge, vous pourrez :</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Ajouter des étapes progressives au challenge</li>
                        <li>Définir du code de démarrage pour chaque étape</li>
                        <li>Créer des cas de test pour valider les solutions</li>
                        <li>Tester le challenge avec l'éditeur intégré</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
}