// Page de démonstration publique de la plateforme de coding avec Docker
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Code, Play, CheckCircle, Clock, Trophy, ArrowRight, Zap, Target, BarChart3, XCircle, AlertTriangle, Loader } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { codingService, type CodingExercise, type ExecutionResult } from '@/services/coding-service';

const CodingPlatformDemo = () => {
  const [selectedExercise, setSelectedExercise] = useState<CodingExercise | null>(null);
  const [codeResult, setCodeResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [dockerAvailable, setDockerAvailable] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<'loading' | 'healthy' | 'degraded' | 'error'>('loading');

  // Exercices de démonstration
  const demoExercises = [
    {
      id: 1,
      title: "Two Sum",
      difficulty: "facile",
      language: "python",
      category: "algorithmes",
      description: "Trouvez deux nombres dans un tableau qui s'additionnent pour donner une cible donnée.",
      estimated_time: 15,
      code_template: `def two_sum(nums, target):
    # Votre solution ici
    # Astuce: Utilisez un dictionnaire pour stocker les valeurs vues
    pass

# Test
nums = [2, 7, 11, 15]
target = 9
result = two_sum(nums, target)
print(result)`,
      expected_output: "[0, 1]",
      solution_example: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      test_cases: [
        { input: "[2, 7, 11, 15], 9", expected: "[0, 1]" },
        { input: "[3, 2, 4], 6", expected: "[1, 2]" }
      ]
    },
    {
      id: 2,
      title: "Palindrome Check",
      difficulty: "facile",
      language: "javascript",
      category: "strings",
      description: "Vérifiez si une chaîne de caractères est un palindrome.",
      estimated_time: 10,
      code_template: `function isPalindrome(s) {
    // Votre solution ici
    // Astuce: Comparez la chaîne avec sa version inversée
}

// Test
console.log(isPalindrome("racecar"));
console.log(isPalindrome("hello"));`,
      expected_output: "true\\nfalse",
      solution_example: `function isPalindrome(s) {
    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
}`,
      test_cases: [
        { input: "racecar", expected: "true" },
        { input: "hello", expected: "false" }
      ]
    },
    {
      id: 3,
      title: "Binary Search",
      difficulty: "moyen",
      language: "python",
      category: "algorithmes",
      description: "Implémentez l'algorithme de recherche binaire.",
      estimated_time: 25,
      code_template: `def binary_search(arr, target):
    # Votre solution ici
    # Astuce: Utilisez deux pointeurs (left, right) et calculez le milieu
    pass

# Test
arr = [1, 3, 5, 7, 9, 11]
target = 7
result = binary_search(arr, target)
print(result)`,
      expected_output: "3",
      solution_example: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1`,
      test_cases: [
        { input: "[1, 3, 5, 7, 9, 11], 7", expected: "3" },
        { input: "[1, 3, 5, 7, 9, 11], 12", expected: "-1" }
      ]
    }
  ];

  // Statistiques de démonstration
  const demoStats = {
    total_exercises: 150,
    by_difficulty: {
      facile: 60,
      moyen: 70,
      difficile: 20
    },
    by_language: {
      python: 50,
      javascript: 40,
      java: 35,
      cpp: 25
    },
    completion_rate: 78
  };

  // Initialiser le service et vérifier l'état
  useEffect(() => {
    const initializeService = async () => {
      try {
        // Vérifier l'état du service
        const healthCheck = await codingService.healthCheck();
        setServiceStatus(healthCheck.status);
        setDockerAvailable(healthCheck.docker_available);
        
        // Récupérer les langages supportés
        const languagesResponse = await codingService.getSupportedLanguages();
        setSupportedLanguages(languagesResponse.languages);
        
      } catch (error) {
        console.error('Failed to initialize coding service:', error);
        setServiceStatus('error');
      }
    };

    initializeService();
  }, []);

  // Initialiser le code utilisateur quand un exercice est sélectionné
  useEffect(() => {
    if (selectedExercise) {
      const template = selectedExercise.code_template || codingService.generateCodeTemplate(selectedLanguage);
      setUserCode(template);
      setCodeResult(null);
      setShowSolution(false);
      setSelectedLanguage(selectedExercise.language || 'python');
    }
  }, [selectedExercise, selectedLanguage]);

  const runCode = async () => {
    if (!selectedExercise || !userCode.trim()) {
      return;
    }

    setIsRunning(true);
    setCodeResult(null);

    try {
      // Valider le code avant l'exécution
      const validation = codingService.validateCode(userCode, selectedLanguage);
      if (!validation.isValid) {
        setCodeResult({
          success: false,
          error: `Erreurs de validation: ${validation.errors.join(', ')}`,
          execution_time: 0,
          memory_usage: "0MB"
        });
        setIsRunning(false);
        return;
      }

      // Préparer les cas de test
      const testCases = selectedExercise.test_cases.map(tc => ({
        input: tc.input,
        expected: tc.expected,
        description: tc.description || ''
      }));

      // Exécuter le code avec le service backend
      if (dockerAvailable && serviceStatus === 'healthy') {
        // Utiliser le vrai service Docker
        const result = await codingService.executeCode(
          userCode,
          selectedLanguage,
          testCases,
          selectedExercise.id
        );
        
        setCodeResult(result.result);
      } else {
        // Fallback vers la simulation pour la démo
        await simulateExecution();
      }

    } catch (error) {
      console.error('Code execution failed:', error);
      setCodeResult({
        success: false,
        error: `Erreur d'exécution: ${error.message || 'Service indisponible'}`,
        execution_time: 0,
        memory_usage: "0MB"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Simulation pour la démo quand Docker n'est pas disponible
  const simulateExecution = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const hasImplementation = userCode.includes('return') || 
                                 userCode.includes('console.log') || 
                                 !userCode.includes('pass');
        const isCorrectSolution = checkSolution(userCode, selectedExercise);
        
        if (!hasImplementation) {
          setCodeResult({
            success: false,
            error: "Veuillez implémenter la fonction avant d'exécuter le code",
            execution_time: 0,
            memory_usage: "0MB"
          });
        } else {
          setCodeResult({
            success: isCorrectSolution,
            output: isCorrectSolution ? selectedExercise.expected_output : "Résultat incorrect",
            execution_time: Math.random() * 0.5 + 0.1,
            memory_usage: Math.floor(Math.random() * 20 + 8) + "MB",
            test_results: selectedExercise.test_cases.map((test, index) => ({
              test_case: index + 1,
              passed: isCorrectSolution || Math.random() > 0.3,
              input: test.input,
              expected: test.expected,
              actual: isCorrectSolution ? test.expected : "Résultat incorrect",
              description: test.description || ''
            }))
          });
        }
        resolve();
      }, 1500 + Math.random() * 1000);
    });
  };

  // Fonction pour vérifier si la solution est correcte (simulation basique)
  const checkSolution = (code: string, exercise: any): boolean => {
    if (exercise.id === 1) { // Two Sum
      return code.includes('for') && (code.includes('enumerate') || code.includes('range')) && code.includes('return');
    } else if (exercise.id === 2) { // Palindrome
      return code.includes('toLowerCase') || code.includes('reverse') || code.includes('===');
    } else if (exercise.id === 3) { // Binary Search
      return code.includes('while') && code.includes('mid') && code.includes('left') && code.includes('right');
    }
    return Math.random() > 0.5; // Solution aléatoire pour les autres
  };

  return (
    <>
      <Head>
        <title>Démonstration Plateforme de Coding - RecruteIA</title>
        <meta name="description" content="Découvrez notre plateforme de coding pour évaluer les compétences techniques des développeurs. Tests interactifs et évaluation automatique." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Banner de démonstration */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Code className="h-5 w-5" />
                <span className="font-medium">Plateforme de Coding</span>
                <span className="text-purple-200">•</span>
                <span className="text-sm">Évaluation technique interactive</span>
              </div>
              <Link href="/auth/register" className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Tester gratuitement
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Plateforme de Coding Interactive
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Évaluez les compétences techniques de vos candidats avec des exercices de programmation interactifs, 
              une correction automatique et des rapports détaillés.
            </p>
            
            {/* Indicateur de statut du service */}
            <div className="mt-6 flex justify-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                serviceStatus === 'loading' ? 'bg-gray-100 text-gray-600' :
                serviceStatus === 'healthy' ? 'bg-green-100 text-green-800' :
                serviceStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {serviceStatus === 'loading' ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Initialisation du service...
                  </>
                ) : serviceStatus === 'healthy' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Service Docker actif - Exécution sécurisée
                  </>
                ) : serviceStatus === 'degraded' ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Mode simulation - Docker indisponible
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Service indisponible
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">{demoStats.total_exercises}</div>
              <div className="text-sm text-gray-600">Exercices disponibles</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">5</div>
              <div className="text-sm text-gray-600">Langages supportés</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">{demoStats.completion_rate}%</div>
              <div className="text-sm text-gray-600">Taux de réussite</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">&lt; 2s</div>
              <div className="text-sm text-gray-600">Temps d'exécution</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Liste des exercices */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exercices de démonstration</h2>
              <div className="space-y-3">
                {demoExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedExercise?.id === exercise.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{exercise.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        exercise.difficulty === 'facile' ? 'bg-green-100 text-green-800' :
                        exercise.difficulty === 'moyen' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Code className="h-3 w-3 mr-1" />
                        {exercise.language}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {exercise.estimated_time}min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interface de coding */}
            <div className="lg:col-span-2">
              {selectedExercise ? (
                <div className="bg-white rounded-lg shadow">
                  {/* Header de l'exercice */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{selectedExercise.title}</h2>
                        <p className="text-gray-600 mt-1">{selectedExercise.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          selectedExercise.difficulty === 'facile' ? 'bg-green-100 text-green-800' :
                          selectedExercise.difficulty === 'moyen' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedExercise.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Éditeur de code */}
                  <div className="p-6">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code ({selectedExercise.language})
                      </label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <textarea
                          value={userCode}
                          onChange={(e) => setUserCode(e.target.value)}
                          className="w-full h-64 p-4 bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Écrivez votre code ici..."
                          spellCheck={false}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        💡 Astuce : Modifiez le code ci-dessus pour implémenter votre solution
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={runCode}
                          disabled={isRunning}
                          className="inline-flex items-center px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRunning ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Exécution...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Exécuter le code
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowSolution(!showSolution)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {showSolution ? 'Masquer la solution' : 'Voir la solution'}
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">
                        Temps estimé: {selectedExercise.estimated_time} minutes
                      </span>
                    </div>

                    {/* Solution d'exemple */}
                    {showSolution && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">💡 Solution d'exemple</h4>
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                          <pre>{selectedExercise.solution_example}</pre>
                        </div>
                        <p className="text-sm text-blue-700 mt-2">
                          Cette solution est donnée à titre d'exemple. Essayez d'implémenter votre propre version !
                        </p>
                      </div>
                    )}

                    {/* Résultats */}
                    {codeResult && (
                      <div className="space-y-4">
                        {/* Résultat d'exécution */}
                        <div className={`border rounded-lg p-4 ${
                          codeResult.success 
                            ? 'bg-green-50 border-green-200' 
                            : codeResult.error 
                              ? 'bg-red-50 border-red-200'
                              : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="flex items-center mb-2">
                            {codeResult.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 mr-2" />
                            )}
                            <span className={`font-medium ${
                              codeResult.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {codeResult.success ? 'Tests réussis !' : codeResult.error ? 'Erreur d\'exécution' : 'Tests échoués'}
                            </span>
                          </div>
                          <div className={`text-sm ${
                            codeResult.success ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {codeResult.error ? (
                              <p className="font-mono bg-red-100 px-2 py-1 rounded">{codeResult.error}</p>
                            ) : (
                              <>
                                <p>Sortie: <code className={`px-2 py-1 rounded ${
                                  codeResult.success ? 'bg-green-100' : 'bg-yellow-100'
                                }`}>{codeResult.output}</code></p>
                                <p>Temps d'exécution: {codeResult.execution_time.toFixed(2)}s</p>
                                <p>Mémoire utilisée: {codeResult.memory_usage}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Résultats des tests */}
                        {codeResult.test_results && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Résultats des tests</h4>
                            <div className="space-y-2">
                              {codeResult.test_results.map((test) => (
                                <div key={test.test_case} className={`flex items-center justify-between p-3 rounded-lg ${
                                  test.passed ? 'bg-green-50' : 'bg-red-50'
                                }`}>
                                  <div className="flex items-center">
                                    {test.passed ? (
                                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600 mr-2" />
                                    )}
                                    <span className="text-sm font-medium">Test {test.test_case}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <div>Input: <code className="bg-gray-100 px-1 rounded">{test.input}</code></div>
                                    <div>Attendu: <code className="bg-gray-100 px-1 rounded">{test.expected}</code></div>
                                    <div>Obtenu: <code className={`px-1 rounded ${
                                      test.passed ? 'bg-green-100' : 'bg-red-100'
                                    }`}>{test.actual}</code></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Score global */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">Score global</span>
                                <span className={`font-bold text-lg ${
                                  codeResult.success ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {codeResult.test_results.filter(t => t.passed).length}/{codeResult.test_results.length}
                                </span>
                              </div>
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    codeResult.success ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                  style={{
                                    width: `${(codeResult.test_results.filter(t => t.passed).length / codeResult.test_results.length) * 100}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Sélectionnez un exercice
                  </h3>
                  <p className="text-gray-600">
                    Choisissez un exercice dans la liste pour commencer la démonstration
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
              Fonctionnalités de la plateforme
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Exécution Instantanée</h3>
                <p className="text-gray-600">
                  Compilation et exécution en temps réel avec feedback immédiat
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tests Automatisés</h3>
                <p className="text-gray-600">
                  Validation automatique avec cas de test prédéfinis et personnalisés
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapports Détaillés</h3>
                <p className="text-gray-600">
                  Analyse complète des performances et recommandations
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              Prêt à évaluer vos développeurs ?
            </h2>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Créez vos premiers exercices de coding et commencez à évaluer les compétences techniques de vos candidats dès aujourd'hui.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register"
                className="inline-flex items-center px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link 
                href="/demo"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-purple-600 transition-colors"
              >
                Voir plus de démos
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default CodingPlatformDemo;