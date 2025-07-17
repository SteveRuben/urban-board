// Pages/admin/challenges/[id]/steps/new.tsx - VERSION MISE À JOUR

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Layers, Plus, X, TestTube, Code, Upload, Database, BarChart3, FileText } from 'lucide-react';


import { 
  Challenge, 
  ChallengeStep, 
  ChallengeStepFormData, 
  TestCaseFormData, 
  Exercise,
  ExecutionEnvironment,
  TestcaseType,
  ExerciseDataset,
  DiagramType, 
  DiagramFormat,
  DocumentFormat,
  FinancialDocumentType
} from '@/types/coding-plateform';
import CodingPlatformService from '@/services/coding-platform-service';

interface StepFormPageProps {
  challengeId?: string;
  stepId?: string;
}

export default function StepFormPage({ challengeId, stepId }: StepFormPageProps) {
  const router = useRouter();
  const isEditing = !!stepId;
  const isCreatingFromChallenge = !!challengeId;
  
  // Si on vient de l'URL, récupérer les paramètres
  const urlChallengeId = router.query.id?.toString();
  const urlStepId = router.query.stepId?.toString();
  
  const finalChallengeId = challengeId || urlChallengeId;
  const finalStepId = stepId || urlStepId;
  const finalIsEditing = !!finalStepId;
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [datasets, setDatasets] = useState<ExerciseDataset[]>([]);
  const [formData, setFormData] = useState<ChallengeStepFormData>({
    title: '',
    instructions: '',
    hint: '',
    starter_code: '',
    solution_code: '',
    notebook_template: '',
    sql_schema: {},
    expected_output_type: '',

     // Business Analyst 
     diagram_template: '',
     diagram_type: 'uml_use_case',
     diagram_format: 'json',
     business_requirements: {},

    evaluation_criteria: {},
    order_index: 1,
    is_final_step: false
  });
  
  const [testCases, setTestCases] = useState<TestCaseFormData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(finalIsEditing || !!finalChallengeId);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'code' | 'tests'>('details');

  // Charger les données nécessaires
  useEffect(() => {
    if (finalIsEditing && finalStepId) {
      loadStep();
    } else if (finalChallengeId) {
      loadChallenge();
    }
  }, [finalStepId, finalChallengeId, finalIsEditing]);

  const loadStep = async () => {
    try {
      setInitialLoading(true);
      
      const step = await CodingPlatformService.getStep(finalStepId!);
      
      setFormData({
        title: step.title,
        instructions: step.instructions,
        hint: step.hint || '',
        starter_code: step.starter_code || '',
        solution_code: step.solution_code || '',
        notebook_template: step.notebook_template || '',
        sql_schema: step.sql_schema || {},
        expected_output_type: step.expected_output_type || '',
        evaluation_criteria: step.evaluation_criteria || {},
        order_index: step.order_index,
        is_final_step: step.is_final_step
      });
      
      if (step.testcases) {
        setTestCases(step.testcases.map(tc => ({
          testcase_type: tc.testcase_type || 'unit_test',
          input_data: tc.input_data,
          expected_output: tc.expected_output,
          dataset_reference: tc.dataset_reference,
          sql_query_expected: tc.sql_query_expected,
          expected_visualization: tc.expected_visualization,
          statistical_assertions: tc.statistical_assertions,
          numerical_tolerance: tc.numerical_tolerance,
          is_hidden: tc.is_hidden,
          is_example: tc.is_example,
          timeout_seconds: tc.timeout_seconds,
          memory_limit_mb: tc.memory_limit_mb,
          order_index: tc.order_index
        })));
      }
      
      const challengeData = await CodingPlatformService.getChallenge(step.challenge_id);
      setChallenge(challengeData);
      
      const exerciseData = await CodingPlatformService.getExercise(challengeData.exercise_id);
      setExercise(exerciseData);
      
      // Charger les datasets si c'est un exercice data analyst
      if (exerciseData.category === 'data_analyst') {
        await loadDatasets(challengeData.exercise_id);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'étape:', err);
      setError('Impossible de charger l\'étape. Veuillez réessayer.');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadChallenge = async () => {
    try {
      setInitialLoading(true);
      const challengeData = await CodingPlatformService.getChallenge(finalChallengeId!);
      setChallenge(challengeData);
      
      const exerciseData = await CodingPlatformService.getExercise(challengeData.exercise_id);
      setExercise(exerciseData);
      
      // Charger les datasets si c'est un exercice data analyst
      if (exerciseData.category === 'data_analyst') {
        await loadDatasets(challengeData.exercise_id);
      }
      
      setFormData(prev => ({
        ...prev,
        order_index: (challengeData.step_count || 0) + 1
      }));
    } catch (err) {
      console.error('Erreur lors du chargement du challenge:', err);
      setError('Impossible de charger le challenge. Veuillez réessayer.');
    } finally {
      setInitialLoading(false);
    }
  };

  // Charger les datasets de l'exercice
  const loadDatasets = async (exerciseId: string) => {
    try {
      const datasetsData = await CodingPlatformService.getExerciseDatasets(exerciseId);
      setDatasets(datasetsData);
    } catch (err) {
      console.error('Erreur lors du chargement des datasets:', err);
    }
  };

  const loadDiagramTemplates = async () => {
    try {
      const templates = await CodingPlatformService.getDiagramTemplates();
      return templates;
    } catch (err) {
      console.error('Erreur lors du chargement des templates:', err);
      return {};
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let firstErrorTab: 'details' | 'code' | 'tests' = 'details';
  
    // Validation onglet "Détails"
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
      firstErrorTab = 'details';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Le titre doit contenir au moins 3 caractères';
      firstErrorTab = 'details';
    }
  
    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Les instructions sont requises';
      if (!newErrors.title) firstErrorTab = 'details';
    } else if (formData.instructions.length < 10) {
      newErrors.instructions = 'Les instructions doivent contenir au moins 10 caractères';
      if (!newErrors.title) firstErrorTab = 'details';
    }
  
    if (formData.order_index !== undefined && formData.order_index < 1) {
      newErrors.order_index = 'L\'ordre doit être supérieur à 0';
      if (!newErrors.title && !newErrors.instructions) firstErrorTab = 'details';
    }
  
    // Validation selon l'environnement d'exécution
    const environment = challenge?.execution_environment;
    
    if (environment === 'code_executor' && !formData.starter_code?.trim()) {
      newErrors.starter_code = 'Le code de démarrage est requis';
      if (Object.keys(newErrors).length === 1) firstErrorTab = 'code';
    }
    
    if (environment === 'jupyter_notebook' && !formData.notebook_template?.trim()) {
      newErrors.notebook_template = 'Le template de notebook est requis';
      if (Object.keys(newErrors).length === 1) firstErrorTab = 'code';
    }
    
    if (environment === 'diagram_editor') {
      if (!formData.diagram_type) {
        newErrors.diagram_type = 'Le type de diagramme est requis';
        if (Object.keys(newErrors).length === 1) firstErrorTab = 'code';
      }
      if (!formData.diagram_template?.trim()) {
        newErrors.diagram_template = 'Le template de diagramme est requis';
        if (Object.keys(newErrors).length === 1) firstErrorTab = 'code';
      }
    }


    // Validation onglet "Tests"
    if (testCases.length === 0) {
      newErrors.testCases = 'Au moins un cas de test est requis';
      if (Object.keys(newErrors).length === 1) firstErrorTab = 'tests';
    } else {
      // Valider chaque cas de test selon son type
      let hasTestError = false;
      testCases.forEach((testCase, index) => {
        if (testCase.testcase_type === 'sql_query_test') {
          if (!testCase.sql_query_expected?.trim()) {
            newErrors[`testCase_${index}_sql`] = `La requête SQL attendue du cas ${index + 1} est requise`;
            hasTestError = true;
          }
        } else if (testCase.testcase_type === 'unit_test') {
          if (!testCase.input_data?.trim()) {
            newErrors[`testCase_${index}_input`] = `Les données d'entrée du cas ${index + 1} sont requises`;
            hasTestError = true;
          }
          if (!testCase.expected_output?.trim()) {
            newErrors[`testCase_${index}_output`] = `La sortie attendue du cas ${index + 1} est requise`;
            hasTestError = true;
          }
        } else if (testCase.testcase_type === 'notebook_cell_test') {
          const notebookOutput = testCase.notebook_cell_output_raw || testCase.notebook_cell_output;
          if (!notebookOutput?.trim()) {
            newErrors[`testCase_${index}_notebook`] = `La sortie de cellule du cas ${index + 1} est requise`;
          } else if (typeof notebookOutput === 'string') {
            // 🆕 Valider que c'est un JSON valide
            try {
              JSON.parse(notebookOutput);
            } catch (err) {
              newErrors[`testCase_${index}_notebook`] = `Format JSON invalide pour le cas ${index + 1}`;
            }
          }
        } 
      });
      
      if (hasTestError && Object.keys(newErrors).filter(key => !key.startsWith('testCase_')).length === 0) {
        firstErrorTab = 'tests';
      }
    }
  
    setErrors(newErrors);
  
    if (Object.keys(newErrors).length > 0) {
      setActiveTab(firstErrorTab);
      return false;
    }
  
    return true;
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

      if (finalIsEditing && finalStepId) {
        const updatedStep = await CodingPlatformService.updateStep(finalStepId, formData);
        resultStepId = updatedStep.id;
      } else {
        // 🆕 Utiliser le service unifié
        console.log('llslslk...',formData)
        const newStep = await CodingPlatformService.createChallengeStep(finalChallengeId!, formData);
        resultStepId = newStep.id;
      }

      // 🆕 Créer/mettre à jour les cas de test avec le service unifié
      if (testCases.length > 0) {
        try {
          const result = await CodingPlatformService.bulkImportTestCases(resultStepId, { testcases: testCases });
          
          // Afficher les erreurs s'il y en a
          if (result.errors && result.errors.length > 0) {
            console.warn('Erreurs lors de la création des cas de test:', result.errors);
            // Optionnel : afficher un message d'avertissement à l'utilisateur
          }
        } catch (testError) {
          console.error('Erreur lors de la création des cas de test:', testError);
          // Continuer malgré l'erreur des cas de test
        }
      }

      router.push(`/coding-admin/challenges/${challenge?.id}`);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(finalIsEditing ? 'Erreur lors de la mise à jour de l\'étape' : 'Erreur lors de la création de l\'étape');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ChallengeStepFormData, value: any) => {
    console.log('lslslls',value)
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Ajouter un cas de test selon l'environnement
  const addTestCase = () => {
    const environment = challenge?.execution_environment || 'code_executor';
    const compatibleTypes = CodingPlatformService.getCompatibleTestcaseTypes(environment);
    const defaultType = compatibleTypes[0] || 'unit_test';
    
    const baseTestCase: TestCaseFormData = {
      testcase_type: defaultType,
      is_hidden: false,
      is_example: true,
      timeout_seconds: 1,
      memory_limit_mb: 128,
      order_index: testCases.length + 1
    };

    // Ajouter les champs spécifiques selon le type
    if (['text_formatting_test', 'spelling_grammar_test', 'document_structure_test', 
      'correspondence_test', 'proofreading_test'].includes(defaultType)) {
   // Secrétaire
      Object.assign(baseTestCase, {
        expected_document_structure: {
          min_words: 100,
          required_elements: ['greeting', 'body', 'closing']
        },
        text_quality_criteria: {
          max_spelling_errors: 0,
          grammar_check: true
        }
      });
    } else if (['accounting_calculation_test', 'financial_analysis_test', 'budget_validation_test',
                'balance_sheet_test', 'tax_calculation_test', 'audit_trail_test'].includes(defaultType)) {
      // Comptable
      Object.assign(baseTestCase, {
        expected_financial_result: {
          total: 0,
          balance: true
        },
        accounting_validation_rules: {
          balance_equation: true,
          positive_amounts: true
        }
      });
    }
    else if (defaultType === 'sql_query_test') {
      Object.assign(baseTestCase, {
        sql_query_expected: '',
        dataset_reference: datasets[0]?.name || ''
      });
    } else if (['process_diagram', 'use_case_diagram', 'sequence_diagram', 'class_diagram', 
      'activity_diagram', 'flowchart', 'wireframe'].includes(defaultType)) {
      // Business Analyst - NOUVEAU
      Object.assign(baseTestCase, {
      diagram_requirements: {
      elements_required: [],
      relationships_required: [],
      style_requirements: {}
      },
      evaluation_rubric: {
      completeness: 0.4,
      accuracy: 0.4,
      clarity: 0.2
      }
    });
    } else if (defaultType === 'visualization_test') {
      Object.assign(baseTestCase, {
        expected_visualization: {
          type: 'bar_chart',
          data_points: 0
        }
      });
    } else if (defaultType === 'statistical_test') {
      Object.assign(baseTestCase, {
        statistical_assertions: {
          mean: null,
          std: null,
          count: null
        },
        numerical_tolerance: 0.001
      });
    } else  if (defaultType === 'notebook_cell_test') {
      // 🆕 Utiliser directement une string JSON
      Object.assign(baseTestCase, {
        notebook_cell_output: JSON.stringify({
          output_type: 'execute_result',
          data: {
            'text/plain': '42'
          },
          metadata: {}
        }, null, 2),
        cell_type: 'code'
      });
    } else {
      Object.assign(baseTestCase, {
        input_data: '',
        expected_output: ''
      });
    }

    setTestCases(prev => [...prev, baseTestCase]);
  };

  const updateTestCase = (index: number, field: keyof TestCaseFormData, value: any) => {
    setTestCases(prev => prev.map((tc, i) => 
      i === index ? { ...tc, [field]: value } : tc
    ));
  };

  const removeTestCase = (index: number) => {
    setTestCases(prev => prev.filter((_, i) => i !== index));
  };

  // Templates selon l'environnement et le langage
  const getDefaultStarterCode = () => {
    if (!exercise || !challenge) return '';
    
    const environment = challenge.execution_environment;
    
    if (environment === 'diagram_editor') {
      const diagramType = formData.diagram_type || 'uml_use_case';
      return getDefaultDiagramTemplate(diagramType);
    }

    if (environment === 'jupyter_notebook') {
      return JSON.stringify({
        cells: [
          {
            cell_type: 'code',
            source: ['# Importez les bibliothèques nécessaires\nimport pandas as pd\nimport numpy as np\n'],
            outputs: []
          },
          {
            cell_type: 'code',
            source: ['# Votre code ici\n'],
            outputs: []
          }
        ]
      }, null, 2);
    }
    
    if (environment === 'sql_database') {
      return '-- Votre requête SQL ici\nSELECT * FROM table_name\nWHERE condition = \'value\';';
    }
    
    // Code traditionnel selon le langage
    switch (exercise.language) {
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

  const getDefaultDiagramTemplate = (diagramType: DiagramType): string => {
    const templates = {
      'uml_use_case': JSON.stringify({
        type: 'use_case_diagram',
        actors: [{ name: 'Utilisateur', id: 'user1' }],
        use_cases: [{ name: 'Action principale', id: 'uc1' }],
        relationships: [{ from: 'user1', to: 'uc1', type: 'association' }]
      }, null, 2),
      
      'uml_sequence': JSON.stringify({
        type: 'sequence_diagram',
        participants: [{ name: 'Client', id: 'client' }, { name: 'Serveur', id: 'server' }],
        messages: [{ from: 'client', to: 'server', message: 'requête', type: 'sync' }]
      }, null, 2),
      
      'flowchart': JSON.stringify({
        type: 'flowchart',
        nodes: [
          { id: 'start', label: 'Début', type: 'start' },
          { id: 'process1', label: 'Processus', type: 'process' },
          { id: 'end', label: 'Fin', type: 'end' }
        ],
        connections: [
          { from: 'start', to: 'process1' },
          { from: 'process1', to: 'end' }
        ]
      }, null, 2),
      
      'wireframe': JSON.stringify({
        type: 'wireframe',
        components: [
          { type: 'header', content: 'En-tête', position: { x: 0, y: 0, width: 100, height: 10 } },
          { type: 'button', content: 'Bouton', position: { x: 20, y: 20, width: 20, height: 5 } }
        ]
      }, null, 2)
    };
    
    return templates[diagramType] || templates['flowchart'];
  };
  const getDefaultDocumentTemplate = (): string => {
    const documentType = formData.document_format || 'plain_text';
    
    const templates = {
      'plain_text': "Date: [DATE]\n\nDestinaire: [RECIPIENT]\n\nObjet: [SUBJECT]\n\n[GREETING],\n\n[BODY]\n\n[CLOSING],\n[SIGNATURE]",
      'html': "<html><body><h1>[TITLE]</h1><p>[CONTENT]</p></body></html>",
      'markdown': "# [TITLE]\n\n## Introduction\n\n[CONTENT]\n\n## Conclusion\n\n[CONCLUSION]"
    };
    
    return templates[documentType] || templates['plain_text'];
  };

  const getDefaultFinancialTemplate = (): string => {
    const docType = formData.financial_document_type || 'balance_sheet';
    
    const templates = {
      'balance_sheet': JSON.stringify({
        assets: { current_assets: 0, fixed_assets: 0 },
        liabilities: { current_liabilities: 0, long_term_liabilities: 0 },
        equity: { capital: 0, retained_earnings: 0 }
      }, null, 2),
      'budget': JSON.stringify({
        revenues: { sales: 0, other_income: 0 },
        expenses: { salaries: 0, rent: 0, utilities: 0 },
        total: 0
      }, null, 2)
    };
    
    return templates[docType] || templates['balance_sheet'];
  };

  // Rendu des champs spécifiques selon le type de test
  const renderTestCaseFields = (testCase: TestCaseFormData, index: number) => {
    const testType = testCase.testcase_type || 'unit_test';
    if (['text_formatting_test', 'spelling_grammar_test', 'document_structure_test', 
      'correspondence_test', 'proofreading_test'].includes(testType)) {
      return (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Structure de document attendue
            </label>
            <textarea
              rows={4}
              value={JSON.stringify(testCase.expected_document_structure || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateTestCase(index, 'expected_document_structure', parsed);
                } catch (err) {
                  // Ignore invalid JSON
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder='{"min_words": 100, "required_elements": ["greeting", "closing"]}'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Critères de qualité
            </label>
            <textarea
              rows={3}
              value={JSON.stringify(testCase.text_quality_criteria || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateTestCase(index, 'text_quality_criteria', parsed);
                } catch (err) {
                  // Ignore invalid JSON
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder='{"max_spelling_errors": 0, "grammar_check": true}'
            />
          </div>
        </div>
      );
    }

    // Tests comptables (Comptable)
    if (['accounting_calculation_test', 'financial_analysis_test', 'budget_validation_test',
          'balance_sheet_test', 'tax_calculation_test', 'audit_trail_test'].includes(testType)) {
      return (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Résultat financier attendu
            </label>
            <textarea
              rows={4}
              value={JSON.stringify(testCase.expected_financial_result || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateTestCase(index, 'expected_financial_result', parsed);
                } catch (err) {
                  // Ignore invalid JSON
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder='{"total": 1000, "balance": true, "tax_amount": 200}'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Règles de validation
            </label>
            <textarea
              rows={3}
              value={JSON.stringify(testCase.accounting_validation_rules || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateTestCase(index, 'accounting_validation_rules', parsed);
                } catch (err) {
                  // Ignore invalid JSON
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder='{"balance_equation": true, "positive_amounts": true}'
            />
          </div>
        </div>
      );
    }
    else if (['process_diagram', 'use_case_diagram', 'sequence_diagram', 'class_diagram', 
      'activity_diagram', 'flowchart', 'wireframe'].includes(testType)) {
      return (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exigences du diagramme
            </label>
            <textarea
              rows={4}
              value={JSON.stringify(testCase.diagram_requirements || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateTestCase(index, 'diagram_requirements', parsed);
                } catch (err) {
                  // Ignore invalid JSON
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder='{"elements_required": ["Actor1", "UseCase1"], "relationships_required": ["association"]}'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grille d'évaluation
            </label>
            <textarea
              rows={3}
              value={JSON.stringify(testCase.evaluation_rubric || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateTestCase(index, 'evaluation_rubric', parsed);
                } catch (err) {
                  // Ignore invalid JSON
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder='{"completeness": 0.4, "accuracy": 0.4, "clarity": 0.2}'
            />
          </div>
        </div>
      );
    }
    switch (testType) {
      case 'notebook_cell_test':
      return (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sortie de cellule attendue *
            </label>
            <textarea
              rows={6}
              // 🆕 Utiliser directement la valeur string, avec fallback vers l'objet
              value={
                testCase.notebook_cell_output_raw ?? 
                (typeof testCase.notebook_cell_output === 'string' 
                  ? testCase.notebook_cell_output 
                  : JSON.stringify(testCase.notebook_cell_output || {}, null, 2))
              }
              onChange={(e) => {
                const newValue = e.target.value;
                
                // 🆕 Stocker toujours la version string pour l'édition
                updateTestCase(index, 'notebook_cell_output_raw', newValue);
                
                // 🆕 Stocker aussi comme string pour l'envoi au backend
                updateTestCase(index, 'notebook_cell_output', newValue);
              }}
              onBlur={() => {
                // 🆕 Optionnel: valider et formater le JSON à la sortie du champ
                const rawValue = testCase.notebook_cell_output_raw || testCase.notebook_cell_output;
                if (typeof rawValue === 'string') {
                  try {
                    const parsed = JSON.parse(rawValue);
                    const formatted = JSON.stringify(parsed, null, 2);
                    updateTestCase(index, 'notebook_cell_output_raw', formatted);
                    updateTestCase(index, 'notebook_cell_output', formatted);
                    
                    // Supprimer l'erreur si elle existe
                    if (errors[`testCase_${index}_notebook`]) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[`testCase_${index}_notebook`];
                        return newErrors;
                      });
                    }
                  } catch (err) {
                    // Garder la valeur invalide mais marquer l'erreur
                    setErrors(prev => ({
                      ...prev,
                      [`testCase_${index}_notebook`]: 'Format JSON invalide'
                    }));
                  }
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                errors[`testCase_${index}_notebook`] ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='{"output_type": "execute_result", "data": {"text/plain": "42"}, "metadata": {}}'
            />
            {errors[`testCase_${index}_notebook`] && (
              <p className="mt-1 text-sm text-red-600">{errors[`testCase_${index}_notebook`]}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Format JSON requis. La validation se fait automatiquement.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de cellule
            </label>
            <select
              value={testCase.cell_type || 'code'}
              onChange={(e) => updateTestCase(index, 'cell_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="code">Code</option>
              <option value="markdown">Markdown</option>
              <option value="raw">Raw</option>
            </select>
          </div>
        </div>
      );

      case 'sql_query_test':
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requête SQL attendue *
              </label>
              <textarea
                rows={4}
                value={testCase.sql_query_expected || ''}
                onChange={(e) => updateTestCase(index, 'sql_query_expected', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                  errors[`testCase_${index}_sql`] ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="SELECT column FROM table WHERE condition..."
              />
              {errors[`testCase_${index}_sql`] && (
                <p className="mt-1 text-sm text-red-600">{errors[`testCase_${index}_sql`]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dataset de référence
              </label>
              <select
                value={testCase.dataset_reference || ''}
                onChange={(e) => updateTestCase(index, 'dataset_reference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un dataset</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.name}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      
      case 'visualization_test':
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuration de visualisation attendue
              </label>
              <textarea
                rows={4}
                value={JSON.stringify(testCase.expected_visualization || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    updateTestCase(index, 'expected_visualization', parsed);
                  } catch (err) {
                    // Ignore invalid JSON
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder='{"type": "bar_chart", "data_points": 10}'
              />
            </div>
          </div>
        );
      
      case 'statistical_test':
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assertions statistiques
              </label>
              <textarea
                rows={4}
                value={JSON.stringify(testCase.statistical_assertions || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    updateTestCase(index, 'statistical_assertions', parsed);
                  } catch (err) {
                    // Ignore invalid JSON
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder='{"mean": 10.5, "std": 2.1, "count": 100}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tolérance numérique
              </label>
              <input
                type="number"
                step="0.001"
                value={testCase.numerical_tolerance || 0.001}
                onChange={(e) => updateTestCase(index, 'numerical_tolerance', parseFloat(e.target.value) || 0.001)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      
      default: // unit_test
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Données d'entrée *
              </label>
              <textarea
                rows={3}
                value={testCase.input_data || ''}
                onChange={(e) => updateTestCase(index, 'input_data', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                  errors[`testCase_${index}_input`] ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Entrée du test..."
              />
              {errors[`testCase_${index}_input`] && (
                <p className="mt-1 text-sm text-red-600">{errors[`testCase_${index}_input`]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sortie attendue *
              </label>
              <textarea
                rows={3}
                value={testCase.expected_output || ''}
                onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                  errors[`testCase_${index}_output`] ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Sortie attendue..."
              />
              {errors[`testCase_${index}_output`] && (
                <p className="mt-1 text-sm text-red-600">{errors[`testCase_${index}_output`]}</p>
              )}
            </div>
          </div>
        );
    }
  };

  // Obtenir l'icône selon l'environnement
  const getEnvironmentIcon = () => {
    const environment = challenge?.execution_environment || 'code_executor';
    return CodingPlatformService.getEnvironmentIcon(environment);
  };
  
  if (initialLoading) {
    return (
      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const backUrl = finalIsEditing 
    ? `/coding-admin/challenges/${challenge?.id}` 
    : challenge 
      ? `/coding-admin/challenges/${challenge.id}` 
      : '/coding-admin/exercises';

  return (
    <>
      <Head>
        <title>{finalIsEditing ? 'Modifier l\'étape' : 'Nouvelle étape'} - Administration</title>
        <meta name="description" content={finalIsEditing ? 'Modifier une étape existante' : 'Créer une nouvelle étape'} />
      </Head>

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
                  {finalIsEditing ? 'Modifier l\'étape' : 'Nouvelle étape'}
                </h1>
                {challenge && (
                  <div className="flex items-center mt-1">
                    <span className="text-gray-600">Challenge: {challenge.title}</span>
                    <span className="ml-2 text-lg">{getEnvironmentIcon()}</span>
                    <span className="ml-1 text-sm text-gray-500">
                      {CodingPlatformService.getExecutionEnvironmentLabel(challenge.execution_environment!)}
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

            {/* Onglets */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-3 px-6 text-sm font-medium border-b-2 relative ${
                      activeTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Layers className="h-4 w-4 inline mr-2" />
                    Détails
                    {(errors.title || errors.instructions || errors.order_index) && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`py-3 px-6 text-sm font-medium border-b-2 relative ${
                      activeTab === 'code'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {challenge?.execution_environment === 'jupyter_notebook' ? (
                      <FileText className="h-4 w-4 inline mr-2" />
                    ) : challenge?.execution_environment === 'sql_database' ? (
                      <Database className="h-4 w-4 inline mr-2" />
                    ) : (
                      <Code className="h-4 w-4 inline mr-2" />
                    )}
                    {challenge?.execution_environment === 'jupyter_notebook' ? 'Notebook' : 
                     challenge?.execution_environment === 'sql_database' ? 'SQL' : 'Code'}
                    {(errors.starter_code || errors.notebook_template) && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('tests')}
                    className={`py-3 px-6 text-sm font-medium border-b-2 relative ${
                      activeTab === 'tests'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <TestTube className="h-4 w-4 inline mr-2" />
                    Cas de test ({testCases.length})
                    {(errors.testCases || Object.keys(errors).some(key => key.startsWith('testCase_'))) && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
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
                          placeholder={
                            challenge?.execution_environment === 'sql_database'
                              ? "Ex: Analyser les ventes par région"
                              : challenge?.execution_environment === 'jupyter_notebook'
                              ? "Ex: Visualiser la distribution des données"
                              : "Ex: Implémenter la fonction de tri"
                          }
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
                           
                      {/* {challenge?.execution_environment !== 'text_editor' && (
                        <div>
                          <label htmlFor="document_format" className="block text-sm font-medium text-gray-700 mb-2">
                            Type de sortie attendue
                          </label>
                          <select
                            id="document_format"
                            value={formData.document_format}
                            onChange={(e) => handleInputChange('document_format', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Sélectionner le type</option>
                              <>
                                <option value="word">WORD</option>
                                <option value="pdf">PDF</option>
                                <option value="plain_text">PLAIN_TEXT</option>
                                <option value="html">HTML</option>
                                <option value="markdown">MRKDOWN</option>
                                <option value="rtf">RTF</option>
                              </>
                            
                            
                          </select>
                        </div>
                      )} */}
                      {/* 🆕 Type de sortie attendue */}
                      {challenge?.execution_environment !== 'code_executor' && challenge?.execution_environment !== 'text_editor' && challenge?.execution_environment !== 'diagram_editor' && challenge?.execution_environment !== 'spreadsheet_editor' && (
                        <div>
                          <label htmlFor="expected_output_type" className="block text-sm font-medium text-gray-700 mb-2">
                            Type de sortie attendue
                          </label>
                          <select
                            id="expected_output_type"
                            value={formData.expected_output_type}
                            onChange={(e) => handleInputChange('expected_output_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Sélectionner le type</option>
                            {challenge?.execution_environment === 'sql_database' && (
                              <>
                                <option value="table">Résultat de table</option>
                                <option value="scalar">Valeur unique</option>
                                <option value="aggregation">Agrégation</option>
                              </>
                            )}
                            {challenge?.execution_environment === 'data_visualization' && (
                              <>
                                <option value="bar_chart">Graphique en barres</option>
                                <option value="line_chart">Graphique linéaire</option>
                                <option value="scatter_plot">Nuage de points</option>
                                <option value="histogram">Histogramme</option>
                              </>
                            )}
                            {challenge?.execution_environment === 'jupyter_notebook' && (
                              <>
                                <option value="analysis">Analyse complète</option>
                                <option value="visualization">Visualisation</option>
                                <option value="calculation">Calcul</option>
                              </>
                            )}
                          </select>
                        </div>
                      )}

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

                {/* Onglet Code/Template */}
                {activeTab === 'code' && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-6">
                      {/* Code selon l'environnement */}
                      {challenge?.execution_environment === 'text_editor' ? (
                        <>
                          <div>
                            <label htmlFor="document_format" className="block text-sm font-medium text-gray-700 mb-2">
                              Format de document *
                            </label>
                            <select
                              id="document_format"
                              value={formData.document_format}
                              onChange={(e) => handleInputChange('document_format', e.target.value as DocumentFormat)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="plain_text">Texte brut</option>
                              <option value="html">HTML</option>
                              <option value="markdown">Markdown</option>
                              <option value="word">Word</option>
                              <option value="pdf">PDF</option>
                            </select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label htmlFor="document_template" className="block text-sm font-medium text-gray-700">
                                Modèle de document *
                              </label>
                              <button
                                type="button"
                                onClick={() => handleInputChange('document_template', getDefaultDocumentTemplate())}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Utiliser le modèle par défaut
                              </button>
                            </div>
                            <textarea
                              id="document_template"
                              rows={8}
                              value={formData.document_template}
                              onChange={(e) => handleInputChange('document_template', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                              placeholder="Modèle de document avec placeholders..."
                            />
                          </div>

                          <div>
                            <label htmlFor="text_requirements" className="block text-sm font-medium text-gray-700 mb-2">
                              Exigences de rédaction (optionnel)
                            </label>
                            <textarea
                              id="text_requirements"
                              rows={4}
                              value={JSON.stringify(formData.text_requirements || {}, null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  handleInputChange('text_requirements', parsed);
                                } catch (err) {
                                  // Ignore invalid JSON during typing
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                              placeholder='{"min_words": 200, "required_elements": ["greeting", "closing"]}'
                            />
                          </div>
                        </>
                      ) : challenge?.execution_environment === 'spreadsheet_editor' ? (
                        <>
                          <div>
                            <label htmlFor="financial_document_type" className="block text-sm font-medium text-gray-700 mb-2">
                              Type de document financier *
                            </label>
                            <select
                              id="financial_document_type"
                              value={formData.financial_document_type}
                              onChange={(e) => handleInputChange('financial_document_type', e.target.value as FinancialDocumentType)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="balance_sheet">Bilan comptable</option>
                              <option value="income_statement">Compte de résultat</option>
                              <option value="cash_flow">Flux de trésorerie</option>
                              <option value="budget">Budget</option>
                              <option value="invoice">Facture</option>
                              <option value="expense_report">Note de frais</option>
                              <option value="tax_return">Déclaration fiscale</option>
                            </select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label htmlFor="financial_template" className="block text-sm font-medium text-gray-700">
                                Modèle financier *
                              </label>
                              <button
                                type="button"
                                onClick={() => handleInputChange('financial_template', getDefaultFinancialTemplate())}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Utiliser le modèle par défaut
                              </button>
                            </div>
                            <textarea
                              id="financial_template"
                              rows={10}
                              value={formData.financial_template}
                              onChange={(e) => handleInputChange('financial_template', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                              placeholder="Modèle de document financier (JSON)..."
                            />
                          </div>

                          <div>
                            <label htmlFor="accounting_rules" className="block text-sm font-medium text-gray-700 mb-2">
                              Règles comptables (optionnel)
                            </label>
                            <textarea
                              id="accounting_rules"
                              rows={4}
                              value={JSON.stringify(formData.accounting_rules || {}, null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  handleInputChange('accounting_rules', parsed);
                                } catch (err) {
                                  // Ignore invalid JSON during typing
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                              placeholder='{"balance_equation": true, "positive_amounts": true}'
                            />
                          </div>
                        </>
                      ) :challenge?.execution_environment === 'diagram_editor' ? (
                          <>
                            <div>
                              <label htmlFor="diagram_type" className="block text-sm font-medium text-gray-700 mb-2">
                                Type de diagramme *
                              </label>
                              <select
                                id="diagram_type"
                                value={formData.diagram_type}
                                onChange={(e) => handleInputChange('diagram_type', e.target.value as DiagramType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="uml_use_case">Diagramme de cas d'usage</option>
                                <option value="uml_sequence">Diagramme de séquence</option>
                                <option value="uml_class">Diagramme de classes</option>
                                <option value="uml_activity">Diagramme d'activité</option>
                                <option value="bpmn_process">Processus BPMN</option>
                                <option value="flowchart">Organigramme</option>
                                <option value="wireframe">Maquette fonctionnelle</option>
                                <option value="entity_relationship">Diagramme entité-relation</option>
                              </select>
                            </div>

                            <div>
                              <label htmlFor="diagram_format" className="block text-sm font-medium text-gray-700 mb-2">
                                Format de diagramme
                              </label>
                              <select
                                id="diagram_format"
                                value={formData.diagram_format}
                                onChange={(e) => handleInputChange('diagram_format', e.target.value as DiagramFormat)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="json">JSON (universel)</option>
                                <option value="staruml">StarUML (.mdj)</option>
                                <option value="drawio">Draw.io</option>
                                <option value="svg">SVG</option>
                              </select>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label htmlFor="diagram_template" className="block text-sm font-medium text-gray-700">
                                  Template de diagramme *
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleInputChange('diagram_template', getDefaultStarterCode())}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  Utiliser le template par défaut
                                </button>
                              </div>
                              <textarea
                                id="diagram_template"
                                rows={12}
                                value={formData.diagram_template}
                                onChange={(e) => handleInputChange('diagram_template', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                                  errors.diagram_template ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Template de diagramme (JSON, StarUML, etc.)..."
                              />
                              {errors.diagram_template && (
                                <p className="mt-1 text-sm text-red-600">{errors.diagram_template}</p>
                              )}
                            </div>

                            <div>
                              <label htmlFor="business_requirements" className="block text-sm font-medium text-gray-700 mb-2">
                                Exigences business (optionnel)
                              </label>
                              <textarea
                                id="business_requirements"
                                rows={4}
                                value={JSON.stringify(formData.business_requirements || {}, null, 2)}
                                onChange={(e) => {
                                  try {
                                    const parsed = JSON.parse(e.target.value);
                                    handleInputChange('business_requirements', parsed);
                                  } catch (err) {
                                    // Ignore invalid JSON during typing
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder='{"stakeholders": ["Users", "Admins"], "constraints": ["Security", "Performance"]}'
                              />
                            </div>
                          </>
                        ): challenge?.execution_environment === 'jupyter_notebook' ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label htmlFor="notebook_template" className="block text-sm font-medium text-gray-700">
                              Template de notebook *
                            </label>
                            <button
                              type="button"
                              onClick={() => handleInputChange('notebook_template', getDefaultStarterCode())}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Utiliser le template par défaut
                            </button>
                          </div>
                          <textarea
                            id="notebook_template"
                            rows={12}
                            value={formData.notebook_template}
                            onChange={(e) => handleInputChange('notebook_template', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                              errors.notebook_template ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Template de notebook Jupyter (JSON)..."
                          />
                          {errors.notebook_template && (
                            <p className="mt-1 text-sm text-red-600">{errors.notebook_template}</p>
                          )}
                        </div>
                      ) : challenge?.execution_environment === 'sql_database' ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label htmlFor="starter_code" className="block text-sm font-medium text-gray-700">
                              Requête SQL de démarrage
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
                            rows={8}
                            value={formData.starter_code}
                            onChange={(e) => handleInputChange('starter_code', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="Requête SQL de base..."
                          />
                          {datasets.length > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                              <h4 className="font-medium text-blue-900 mb-2">Datasets disponibles :</h4>
                              <div className="space-y-1">
                                {datasets.map((dataset) => (
                                  <div key={dataset.id} className="text-sm text-blue-700">
                                    <code className="bg-blue-100 px-1 rounded">{dataset.name}</code> - {dataset.description}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label htmlFor="starter_code" className="block text-sm font-medium text-gray-700">
                              Code de démarrage *
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
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                              errors.starter_code ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder={`Code de base pour ${exercise?.language || 'le langage choisi'}...`}
                          />
                          {errors.starter_code && (
                            <p className="mt-1 text-sm text-red-600">{errors.starter_code}</p>
                          )}
                        </div>
                      )}

                      {/* Code solution */}
                      <div>
                        <label htmlFor="solution_code" className="block text-sm font-medium text-gray-700 mb-2">
                          Solution de référence (pour admin)
                        </label>
                        <textarea
                          id="solution_code"
                          rows={12}
                          value={formData.solution_code}
                          onChange={(e) => handleInputChange('solution_code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          placeholder={
                            challenge?.execution_environment === 'diagram_editor' 
                              ? "Diagramme solution complète (non visible par les utilisateurs)..."
                              : "Solution complète de l'étape (non visible par les utilisateurs)..."
                          }
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
                      <h3 className="text-lg font-medium text-gray-800">
                        Cas de test - {CodingPlatformService.getExecutionEnvironmentLabel(challenge?.execution_environment || 'code_executor')}
                      </h3>
                      <button
                        type="button"
                        onClick={addTestCase}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un cas de test
                      </button>
                    </div>

                    {/* Message d'erreur global pour les tests */}
                    {errors.testCases && (
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {errors.testCases}
                      </div>
                    )}

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
                              <h4 className="text-sm font-medium text-gray-800 flex items-center">
                                Cas de test {index + 1}
                                <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  {CodingPlatformService.getTestcaseTypeLabel(testCase.testcase_type || 'unit_test')}
                                </span>
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeTestCase(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            {/* 🆕 Sélecteur de type de test */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type de test
                              </label>
                              <select
                                value={testCase.testcase_type || 'unit_test'}
                                onChange={(e) => updateTestCase(index, 'testcase_type', e.target.value as TestcaseType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              >
                                {CodingPlatformService.getCompatibleTestcaseTypes(challenge?.execution_environment || 'code_executor').map((type) => (
                                  <option key={type} value={type}>
                                    {CodingPlatformService.getTestcaseTypeLabel(type)}
                                  </option>
                                ))}
                              </select>
                            </div>
                        
                            {/* Champs spécifiques selon le type */}
                            <div className="mb-4">
                              {renderTestCaseFields(testCase, index)}
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
                        {finalIsEditing ? 'Mise à jour...' : 'Création...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {finalIsEditing ? 'Mettre à jour' : 'Créer l\'étape'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 🆕 Info supplémentaire selon l'environnement */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Layers className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Conseils pour {CodingPlatformService.getExecutionEnvironmentLabel(challenge?.execution_environment || 'code_executor')}
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    {challenge?.execution_environment === 'diagram_editor' ? (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Définissez clairement les éléments attendus</li>
                        <li>Spécifiez les relations entre les composants</li>
                        <li>Pas de validation automatique - évaluation manuelle</li>
                        <li>Créez des grilles d'évaluation détaillées</li>
                        <li>Testez la compatibilité du format choisi</li>
                      </ul>
                    ) :challenge?.execution_environment === 'sql_database' ? (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Utilisez les datasets configurés dans l'exercice</li>
                        <li>Testez vos requêtes avec des données réelles</li>
                        <li>Incluez des cas de test avec différents résultats</li>
                        <li>Vérifiez la performance des requêtes complexes</li>
                      </ul>
                    ) : challenge?.execution_environment === 'jupyter_notebook' ? (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Structurez le notebook avec des cellules logiques</li>
                        <li>Incluez des commentaires explicatifs</li>
                        <li>Testez l'exécution séquentielle des cellules</li>
                        <li>Validez les visualisations produites</li>
                      </ul>
                    ) : challenge?.execution_environment === 'data_visualization' ? (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Définissez clairement le type de graphique attendu</li>
                        <li>Spécifiez les axes et les données à utiliser</li>
                        <li>Testez avec différents jeux de données</li>
                        <li>Validez l'interprétation des résultats</li>
                      </ul>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Fournissez des instructions claires et détaillées</li>
                        <li>Incluez au moins un cas de test d'exemple visible</li>
                        <li>Ajoutez des cas de test cachés pour validation complète</li>
                        <li>Le code de démarrage devrait guider l'utilisateur</li>
                        <li>Testez votre solution avant de publier</li>
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