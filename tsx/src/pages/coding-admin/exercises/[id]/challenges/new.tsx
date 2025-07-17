import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Target, Plus, X, Database, Code, BarChart3, FileText, PenTool, Calculator } from 'lucide-react';
import { ExtendedCodingPlatformService } from '@/services/extended-coding-platform-service';
import { 
  ChallengeFormData, 
  ChallengeStatus, 
  Exercise,
  ExecutionEnvironment,
  ExerciseCategory 
} from '@/types/coding-plateform';
import CodingPlatformService from '@/services/coding-platform-service';

export default function ChallengeFormPage() {
  const router = useRouter();
  const { id } = router.query;
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
    estimated_time_minutes: 30,
    execution_environment: 'code_executor', // 🆕 Nouveau champ
    environment_config: {} // 🆕 Nouveau champ
  });
  
  const [newTag, setNewTag] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les données nécessaires
  useEffect(() => {
    if (isCreatingFromExercise) {
      loadExercise();
    }
  }, [isCreatingFromExercise]);

  const loadExercise = async () => {
    try {
      const { CodingPlatformService } = await import('@/services/coding-platform-service');
      const exerciseData = await CodingPlatformService.getExercise(id?.toString() || '');
      setExercise(exerciseData);
      
      // 🆕 Définir l'environnement d'exécution par défaut selon la catégorie
      const defaultEnvironment = CodingPlatformService.getDefaultExecutionEnvironment(
        exerciseData.category || 'developer'
      );
      
      setFormData(prev => ({
        ...prev,
        order_index: (exerciseData.challenge_count || 0) + 1,
        execution_environment: defaultEnvironment
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

    if (!formData.exercise_id) {
      newErrors.exercise_id = 'L\'exercice est requis';
    }

    if (!formData.execution_environment) {
      newErrors.execution_environment = 'L\'environnement d\'exécution est requis';
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

      // 🆕 Utiliser le service étendu pour supporter les nouveaux environnements
      const newChallenge = await CodingPlatformService.createChallenge(formData);
      router.push(`/coding-admin/challenges/${newChallenge.id}`);
      
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la création du challenge');
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

  // 🆕 Gestion du changement d'environnement d'exécution
  const handleEnvironmentChange = (environment: ExecutionEnvironment) => {
    setFormData(prev => ({
      ...prev,
      execution_environment: environment,
      environment_config: getDefaultEnvironmentConfig(environment)
    }));
  };

  // 🆕 Configuration par défaut selon l'environnement
  const getDefaultEnvironmentConfig = (environment: ExecutionEnvironment): Record<string, any> => {
    const defaults = {
      'code_executor': {},
      'sql_database': {
        database_type: 'sqlite',
        query_timeout: 30
      },
      'jupyter_notebook': {
        allowed_libraries: ['pandas', 'numpy', 'matplotlib', 'seaborn'],
        execution_timeout: 300
      },
      'data_visualization': {
        supported_types: ['bar_chart', 'line_chart', 'scatter_plot'],
        max_data_points: 1000
      },
      'file_analysis': {
        numerical_tolerance: 0.001,
        max_file_size_mb: 10
      },
      'diagram_editor': { // NOUVEAU
      supported_formats: ['json', 'staruml', 'drawio', 'svg'],
      max_elements: 50,
      validation_mode: 'manual'
    },
    'text_editor': {
      supported_formats: ['plain_text', 'html', 'markdown'],
      max_document_length: 10000,
      spell_check_enabled: true,
      grammar_check_enabled: true
    },
    'spreadsheet_editor': {
      supported_formats: ['json', 'csv'],
      max_calculations: 100,
      numerical_precision: 2,
      validation_rules: ['balance_equations', 'positive_amounts']
    }
  
    };
    return defaults[environment] || {};
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

  // 🆕 Obtenir les environnements compatibles
  const getCompatibleEnvironments = (): ExecutionEnvironment[] => {
    if (!exercise) return ['code_executor'];
    return CodingPlatformService.getCompatibleEnvironments(exercise.category || 'developer');
  };

  // 🆕 Rendu des options d'environnement
  const renderEnvironmentOptions = () => {
    const compatibleEnvironments = getCompatibleEnvironments();
    
    const environmentIcons = {
      'code_executor': Code,
      'sql_database': Database,
      'jupyter_notebook': FileText,
      'data_visualization': BarChart3,
      'file_analysis': FileText,
      'diagram_editor': PenTool,
      'text_editor': FileText,
      'spreadsheet_editor': Calculator
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {compatibleEnvironments.map((env) => {
          const Icon = environmentIcons[env];
          const isSelected = formData.execution_environment === env;
          
          return (
            <div
              key={env}
              onClick={() => handleEnvironmentChange(env)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Icon className={`h-5 w-5 mr-2 ${
                  isSelected ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {CodingPlatformService.getExecutionEnvironmentLabel(env)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getEnvironmentDescription(env)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 🆕 Description des environnements
  const getEnvironmentDescription = (env: ExecutionEnvironment): string => {
    const descriptions = {
      'code_executor': 'Tests d\'algorithmes classiques',
      'sql_database': 'Requêtes SQL sur datasets',
      'jupyter_notebook': 'Notebooks Python interactifs',
      'data_visualization': 'Création de graphiques',
      'file_analysis': 'Analyse statistique de données',
      'diagram_editor': 'Création de diagrammes UML/BPMN',
      'text_editor': 'Rédaction et mise en forme de texte',
      'spreadsheet_editor': 'Calculs et analyses financières'
    };
    return descriptions[env] || '';
  };

  const backUrl = exercise 
    ? `/coding-admin/exercises/${exercise.id}` 
    : '/coding-admin/exercises';

  return (
    <>
      <Head>
        <title>Nouveau challenge - Administration</title>
        <meta name="description" content="Créer un nouveau challenge" />
      </Head>

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
                  <div className="flex items-center mt-1">
                    <span className="text-gray-600">Exercice: {exercise.title}</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      exercise.category === 'developer' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {CodingPlatformService.getExerciseCategoryLabel(exercise.category || 'developer')}
                    </span>
                  </div>
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
                      placeholder={
                        exercise?.category === 'developer' 
                          ? "Ex: Tri par fusion" 
                          : "Ex: Analyse des ventes par région"
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

                  {/* 🆕 Environnement d'exécution */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Environnement d'exécution *
                    </label>
                    {renderEnvironmentOptions()}
                    {errors.execution_environment && (
                      <p className="mt-1 text-sm text-red-600">{errors.execution_environment}</p>
                    )}
                  </div>
                  {formData.execution_environment === 'text_editor' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Configuration Éditeur de Texte</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Format principal</label>
                        <select
                          value={formData.environment_config?.primary_format || 'plain_text'}
                          onChange={(e) => handleInputChange('environment_config', {
                            ...formData.environment_config,
                            primary_format: e.target.value
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="plain_text">Texte brut</option>
                          <option value="html">HTML</option>
                          <option value="markdown">Markdown</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Longueur max (mots)</label>
                        <input
                          type="number"
                          value={formData.environment_config?.max_words || 1000}
                          onChange={(e) => handleInputChange('environment_config', {
                            ...formData.environment_config,
                            max_words: parseInt(e.target.value) || 1000
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min="100"
                          max="10000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.execution_environment === 'spreadsheet_editor' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Configuration Tableur</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Précision décimale</label>
                        <input
                          type="number"
                          value={formData.environment_config?.numerical_precision || 2}
                          onChange={(e) => handleInputChange('environment_config', {
                            ...formData.environment_config,
                            numerical_precision: parseInt(e.target.value) || 2
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min="0"
                          max="10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Calculs max</label>
                        <input
                          type="number"
                          value={formData.environment_config?.max_calculations || 100}
                          onChange={(e) => handleInputChange('environment_config', {
                            ...formData.environment_config,
                            max_calculations: parseInt(e.target.value) || 100
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min="10"
                          max="500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                  {formData.execution_environment === 'diagram_editor' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Configuration Diagrammes</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Format principal</label>
                          <select
                            value={formData.environment_config?.primary_format || 'json'}
                            onChange={(e) => handleInputChange('environment_config', {
                              ...formData.environment_config,
                              primary_format: e.target.value
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="json">JSON</option>
                            <option value="staruml">StarUML</option>
                            <option value="drawio">Draw.io</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Éléments max</label>
                          <input
                            type="number"
                            value={formData.environment_config?.max_elements || 50}
                            onChange={(e) => handleInputChange('environment_config', {
                              ...formData.environment_config,
                              max_elements: parseInt(e.target.value) || 50
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            min="10"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 🆕 Configuration d'environnement */}
                  {formData.execution_environment === 'sql_database' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Configuration SQL</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Type de base</label>
                          <select
                            value={formData.environment_config?.database_type || 'sqlite'}
                            onChange={(e) => handleInputChange('environment_config', {
                              ...formData.environment_config,
                              database_type: e.target.value
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="sqlite">SQLite</option>
                            <option value="postgresql">PostgreSQL</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Timeout (secondes)</label>
                          <input
                            type="number"
                            value={formData.environment_config?.query_timeout || 30}
                            onChange={(e) => handleInputChange('environment_config', {
                              ...formData.environment_config,
                              query_timeout: parseInt(e.target.value) || 30
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            min="5"
                            max="300"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.execution_environment === 'jupyter_notebook' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Configuration Notebook</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Bibliothèques autorisées</label>
                          <input
                            type="text"
                            value={formData.environment_config?.allowed_libraries?.join(', ') || 'pandas, numpy, matplotlib, seaborn'}
                            onChange={(e) => handleInputChange('environment_config', {
                              ...formData.environment_config,
                              allowed_libraries: e.target.value.split(',').map(lib => lib.trim())
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="pandas, numpy, matplotlib, seaborn"
                          />
                        </div>
                      </div>
                    </div>
                  )}

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
                      placeholder={
                        exercise?.category === 'developer'
                          ? "Ex: Complexité temporelle O(n log n), espace O(n)..."
                          : "Ex: Utilisez uniquement des requêtes SELECT, pas de sous-requêtes..."
                      }
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
                        placeholder={
                          exercise?.category === 'developer'
                            ? "Ex: tri, algorithme, récursion..."
                            : "Ex: sql, jointure, aggregation..."
                        }
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

            {/* 🆕 Info sur les prochaines étapes selon l'environnement */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Prochaines étapes - {ExtendedCodingPlatformService.getExecutionEnvironmentLabel(formData.execution_environment!)}
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Après avoir créé ce challenge, vous pourrez :</p>
                    {formData.execution_environment === 'diagram_editor' ? (
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Créer des templates de diagrammes</li>
                        <li>Définir des critères d'évaluation</li>
                        <li>Paramétrer l'éditeur de diagrammes</li>
                        <li>Tester avec différents formats</li>
                      </ul>
                    ):formData.execution_environment === 'sql_database' ? (
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Ajouter des datasets CSV ou SQLite</li>
                        <li>Créer des étapes avec requêtes SQL</li>
                        <li>Définir des tests avec résultats attendus</li>
                        <li>Tester avec l'éditeur SQL intégré</li>
                      </ul>
                    ) : formData.execution_environment === 'jupyter_notebook' ? (
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Créer des templates de notebooks</li>
                        <li>Définir des cellules de code attendues</li>
                        <li>Valider les visualisations produites</li>
                        <li>Tester l'exécution des notebooks</li>
                      </ul>
                    ) : (
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Ajouter des étapes progressives</li>
                        <li>Définir du code de démarrage</li>
                        <li>Créer des cas de test appropriés</li>
                        <li>Tester avec l'environnement dédié</li>
                      </ul>
                    )}
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