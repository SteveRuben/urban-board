import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Code } from 'lucide-react';
import { CodingPlatformService } from '@/services/coding-platform-service';
import { ChallengeDifficulty, ExerciseFormData, ProgrammingLanguage } from '@/types/coding-plateform';

interface ExerciseFormPageProps {
  exerciseId?: string; // undefined pour création, défini pour édition
}

export default function ExerciseFormPage({ exerciseId }: ExerciseFormPageProps) {
  const router = useRouter();
  const isEditing = !!exerciseId;
  
  const [formData, setFormData] = useState<ExerciseFormData>({
    title: '',
    description: '',
    language: 'python',
    difficulty: 'beginner',
    order_index: 1
  });
  
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
      const exercise = await CodingPlatformService.getExercise(exerciseId!);
      setFormData({
        title: exercise.title,
        description: exercise.description,
        language: exercise.language,
        difficulty: exercise.difficulty,
        order_index: exercise.order_index
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

    if (!formData.language) {
      newErrors.language = 'Le langage est requis';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'La difficulté est requise';
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

      if (isEditing && exerciseId) {
        await CodingPlatformService.updateExercise(exerciseId, formData);
      } else {
        await CodingPlatformService.createExercise(formData);
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
        <meta name="description" content={isEditing ? 'Modifier un exercice existant' : 'Créer un nouvel exercice de codage'} />
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
                  {isEditing ? 'Modifiez les informations de l\'exercice' : 'Créez un nouvel exercice de codage'}
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
                <Code className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-lg font-medium text-gray-800">Informations de l'exercice</h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 gap-6">
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
                      placeholder="Ex: Algorithmes de tri"
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

                  {/* Langage et Difficulté */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                        Langage de programmation *
                      </label>
                      <select
                        id="language"
                        value={formData.language}
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

            {/* Info supplémentaire pour création */}
            {!isEditing && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Code className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Prochaines étapes</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Après avoir créé cet exercice, vous pourrez :</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Ajouter des challenges à l'exercice</li>
                        <li>Créer des étapes pour chaque challenge</li>
                        <li>Définir des cas de test pour valider les solutions</li>
                      </ul>
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

// Fonction pour récupérer les props côté serveur (pour l'édition)
export async function getServerSideProps(context: any) {
  const { id } = context.query;
  
  if (id && id !== 'new') {
    return {
      props: {
        exerciseId: parseInt(id)
      }
    };
  }
  
  return {
    props: {}
  };
}