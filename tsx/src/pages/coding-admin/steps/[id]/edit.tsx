import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Layers, Plus, X, TestTube, Code, Upload } from 'lucide-react';
import { CodingPlatformService} from '@/services/coding-platform-service';
import { Challenge, ChallengeStep, ChallengeStepFormData, Exercise, TestCaseFormData } from '@/types/coding-plateform';



export default function StepFormPage() {
  const router = useRouter();
  const {id} = router.query;
  const stepId = id?.toString();  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState<ChallengeStepFormData>({
    title: '',
    instructions: '',
    hint: '',
    starter_code: '',
    solution_code: '',
    order_index: 1,
    is_final_step: false
  });
  
  const [testCases, setTestCases] = useState<TestCaseFormData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'code' | 'tests'>('details');
  
  const loadStep = useCallback( async () => {
    try {
      
      // CORRECTION: Utiliser la méthode getStep
      const step = await CodingPlatformService.getStep(stepId!);
      
      setFormData({
        title: step.title,
        instructions: step.instructions,
        hint: step.hint || '',
        starter_code: step.starter_code || '',
        solution_code: step.solution_code || '',
        order_index: step.order_index,
        is_final_step: step.is_final_step
      });
      
      if (step.testcases) {
        setTestCases(step.testcases.map(tc => ({
          input_data: tc.input_data,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden,
          is_example: tc.is_example,
          timeout_seconds: tc.timeout_seconds,
          memory_limit_mb: tc.memory_limit_mb,
          order_index: tc.order_index
        })));
      }
      
      // Charger aussi les infos du challenge
      const challengeData = await CodingPlatformService.getChallenge(step.challenge_id);
      
      setChallenge(challengeData);
      const exerciseData = await CodingPlatformService.getExercise(challengeData.exercise_id)
      setExercise(exerciseData)
      
    } catch (err) {
      console.error('Erreur lors du chargement de l\'étape:', err);
      setError('Impossible de charger l\'étape. Veuillez réessayer.');
    } finally {
      
    }
  },[])
  // Charger les données nécessaires
  useEffect(() => {
      loadStep();
  },[loadStep]);

  


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Le titre doit contenir au moins 3 caractères';
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Les instructions sont requises';
    } else if (formData.instructions.length < 10) {
      newErrors.instructions = 'Les instructions doivent contenir au moins 10 caractères';
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

      let resultStepId: string;

        // CORRECTION: Utiliser updateStep
        const updatedStep = await CodingPlatformService.updateStep(stepId!, formData);
        resultStepId = updatedStep.id;
   
      // Créer/mettre à jour les cas de test
      if (testCases.length > 0) {
        await CodingPlatformService.bulkImportTestCases(resultStepId, { testcases: testCases });
      }

      router.push(`/coding-admin/challenges/${challenge?.id}`);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError( 'Erreur lors de la mise à jour de l\'étape');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ChallengeStepFormData, value: any) => {
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

  const addTestCase = () => {
    setTestCases(prev => [...prev, {
      input_data: '',
      expected_output: '',
      is_hidden: false,
      is_example: true,
      timeout_seconds: 1,
      memory_limit_mb: 128,
      order_index: prev.length + 1
    }]);
  };

  const updateTestCase = (index: number, field: keyof TestCaseFormData, value: any) => {
    setTestCases(prev => prev.map((tc, i) => 
      i === index ? { ...tc, [field]: value } : tc
    ));
  };

  const removeTestCase = (index: number) => {
    setTestCases(prev => prev.filter((_, i) => i !== index));
  };

  const getDefaultStarterCode = () => {
    if (!challenge) return '';
    
    switch (exercise!.language) {
      case 'python':
        return 'def solution():\n    # Votre code ici\n    pass\n\n# Test\nprint(solution())';
      case 'javascript':
        return 'function solution() {\n    // Votre code ici\n    return null;\n}\n\n// Test\nconsole.log(solution());';
      case 'java':
        return 'public class Solution {\n    public static void main(String[] args) {\n        // Votre code ici\n    }\n}';
      case 'cpp':
        return '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Votre code ici\n    return 0;\n}';
      case 'c':
        return '#include <stdio.h>\n\nint main() {\n    // Votre code ici\n    return 0;\n}';
      default:
        return '';
    }
  };


  const backUrl = `/coding-admin/challenges/${challenge?.id}` 
   

  return (
    <>
     

      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
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
                  { 'Modifier l\'étape'}
                </h1>
                {challenge && (
                  <p className="text-gray-600 mt-1">
                    Challenge: {challenge.title}
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

            {/* Onglets */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-3 px-6 text-sm font-medium border-b-2 ${
                      activeTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Layers className="h-4 w-4 inline mr-2" />
                    Détails
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`py-3 px-6 text-sm font-medium border-b-2 ${
                      activeTab === 'code'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Code className="h-4 w-4 inline mr-2" />
                    Code
                  </button>
                  <button
                    onClick={() => setActiveTab('tests')}
                    className={`py-3 px-6 text-sm font-medium border-b-2 ${
                      activeTab === 'tests'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <TestTube className="h-4 w-4 inline mr-2" />
                    Cas de test ({testCases.length})
                  </button>
                </nav>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Onglet Détails */}
                {activeTab === 'details' && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-6">
                      {/* Titre */}
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                          Titre de l'étape *
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.title ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Ex: Implémenter la fonction de tri"
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                      </div>

                      {/* Instructions */}
                      <div>
                        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions *
                        </label>
                        <textarea
                          id="instructions"
                          rows={8}
                          value={formData.instructions}
                          onChange={(e) => handleInputChange('instructions', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.instructions ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Décrivez précisément ce que l'utilisateur doit faire dans cette étape..."
                        />
                        {errors.instructions && (
                          <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>
                        )}
                      </div>

                      {/* Indice */}
                      <div>
                        <label htmlFor="hint" className="block text-sm font-medium text-gray-700 mb-2">
                          Indice (optionnel)
                        </label>
                        <textarea
                          id="hint"
                          rows={3}
                          value={formData.hint}
                          onChange={(e) => handleInputChange('hint', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Donnez un indice pour aider l'utilisateur si il est bloqué..."
                        />
                      </div>

                      {/* Ordre et Étape finale */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        <div className="flex items-center mt-6">
                          <input
                            type="checkbox"
                            id="is_final_step"
                            checked={formData.is_final_step}
                            onChange={(e) => handleInputChange('is_final_step', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="is_final_step" className="ml-2 block text-sm text-gray-700">
                            Il s'agit de l'étape finale du challenge
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglet Code */}
                {activeTab === 'code' && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-6">
                      {/* Code de démarrage */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="starter_code" className="block text-sm font-medium text-gray-700">
                            Code de démarrage
                          </label>
                          <button
                            type="button"
                            onClick={() => handleInputChange('starter_code', getDefaultStarterCode())}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Utiliser le template par défaut
                          </button>
                        </div>
                        <textarea
                          id="starter_code"
                          rows={12}
                          value={formData.starter_code}
                          onChange={(e) => handleInputChange('starter_code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          placeholder={`Code de base pour ${exercise?.language || 'le langage choisi'}...`}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Ce code sera affiché dans l'éditeur au début de l'étape
                        </p>
                      </div>

                      {/* Code solution */}
                      <div>
                        <label htmlFor="solution_code" className="block text-sm font-medium text-gray-700 mb-2">
                          Code solution (pour référence admin)
                        </label>
                        <textarea
                          id="solution_code"
                          rows={12}
                          value={formData.solution_code}
                          onChange={(e) => handleInputChange('solution_code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          placeholder="Solution complète de l'étape (non visible par les utilisateurs)..."
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Cette solution n'est visible que par les administrateurs pour référence
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglet Cas de test */}
                {activeTab === 'tests' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-medium text-gray-800">Cas de test</h3>
                      <button
                        type="button"
                        onClick={addTestCase}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un cas de test
                      </button>
                    </div>

                    {testCases.length === 0 ? (
                      <div className="text-center py-8">
                        <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Aucun cas de test défini.</p>
                        <button
                          type="button"
                          onClick={addTestCase}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Créer le premier cas de test
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {testCases.map((testCase, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium text-gray-800">
                                Cas de test {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeTestCase(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Données d'entrée *
                                </label>
                                <textarea
                                  rows={3}
                                  value={testCase.input_data}
                                  onChange={(e) => updateTestCase(index, 'input_data', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                  placeholder="Entrée du test..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Sortie attendue *
                                </label>
                                <textarea
                                  rows={3}
                                  value={testCase.expected_output}
                                  onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                  placeholder="Sortie attendue..."
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`example_${index}`}
                                  checked={testCase.is_example}
                                  onChange={(e) => updateTestCase(index, 'is_example', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`example_${index}`} className="ml-2 block text-sm text-gray-700">
                                  Cas d'exemple
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`hidden_${index}`}
                                  checked={testCase.is_hidden}
                                  onChange={(e) => updateTestCase(index, 'is_hidden', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`hidden_${index}`} className="ml-2 block text-sm text-gray-700">
                                  Cas caché
                                </label>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Timeout (s)</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="60"
                                  value={testCase.timeout_seconds}
                                  onChange={(e) => updateTestCase(index, 'timeout_seconds', parseInt(e.target.value) || 1)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Mémoire (MB)</label>
                                <input
                                  type="number"
                                  min="64"
                                  max="1024"
                                  value={testCase.memory_limit_mb}
                                  onChange={(e) => updateTestCase(index, 'memory_limit_mb', parseInt(e.target.value) || 128)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
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
                        { 'Mise à jour...' }
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        { 'Mettre à jour'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Info supplémentaire */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Layers className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Conseils pour une bonne étape</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Fournissez des instructions claires et détaillées</li>
                      <li>Incluez au moins un cas de test d'exemple visible</li>
                      <li>Ajoutez des cas de test cachés pour validation complète</li>
                      <li>Le code de démarrage devrait guider l'utilisateur</li>
                      <li>Testez votre solution avant de publier</li>
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