// components/ai-assistants/AIAssistantConfigurator.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Tab } from '@headlessui/react';
import { 
  PencilIcon, 
  ArrowPathIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon,
  LightBulbIcon,
  ClipboardDocumentCheckIcon,
  CpuChipIcon,
  UserCircleIcon,
  AcademicCapIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import aiAssistantService from '../../services/aiAssistantService';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AIAssistantConfigurator = ({ 
  assistantId = null,
  initialData = null,
  isEditMode = false,
  onSuccess = null,
  onError = null
}) => {
  const router = useRouter();
  const editMode = isEditMode || !!assistantId;
  
  const [assistant, setAssistant] = useState({
    name: '',
    description: '',
    avatar: '/images/ai-assistant-default.png',
    model: 'claude-3-7-sonnet',
    industry: 'technology',
    jobRole: 'software-engineer',
    seniority: 'mid-level',
    interviewMode: 'collaborative',
    personality: {
      friendliness: 3,
      formality: 3,
      technicalDepth: 3,
      followUpIntensity: 3
    },
    baseKnowledge: {
      technicalSkills: true,
      softSkills: true,
      companyValues: false,
      industryTrends: false
    },
    capabilities: {
      generateQuestions: true,
      evaluateResponses: true,
      provideFeedback: true,
      suggestFollowUps: true,
      realTimeCoaching: false,
      biometricIntegration: false
    },
    customPrompt: '',
    questionBank: []
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [testQuestion, setTestQuestion] = useState('');
  const [testResponse, setTestResponse] = useState('');
  
  useEffect(() => {
    // Si nous avons des données initiales, les utiliser
    if (initialData) {
      setAssistant(prevState => ({
        ...prevState,
        ...initialData,
        // S'assurer que les objets complexes sont correctement initialisés
        personality: {
          ...prevState.personality,
          ...(initialData.personality || {})
        },
        baseKnowledge: {
          ...prevState.baseKnowledge,
          ...(initialData.baseKnowledge || {})
        },
        capabilities: {
          ...prevState.capabilities,
          ...(initialData.capabilities || {})
        },
        questionBank: initialData.questionBank || []
      }));
      return;
    }
    
    // Si nous sommes en mode édition mais sans données initiales, charger l'assistant
    if (editMode && assistantId) {
      const fetchAssistant = async () => {
        try {
          const data = await aiAssistantService.getAssistantById(assistantId);
          setAssistant(prevState => ({
            ...prevState,
            ...data,
            // S'assurer que les objets complexes sont correctement initialisés
            personality: {
              ...prevState.personality,
              ...(data.personality || {})
            },
            baseKnowledge: {
              ...prevState.baseKnowledge,
              ...(data.baseKnowledge || {})
            },
            capabilities: {
              ...prevState.capabilities,
              ...(data.capabilities || {})
            },
            questionBank: data.questionBank || []
          }));
        } catch (err) {
          const errorMessage = 'Erreur lors du chargement de l\'assistant: ' + err.message;
          setError(errorMessage);
          if (onError) onError(errorMessage);
        }
      };
      
      fetchAssistant();
    }
  }, [assistantId, editMode, initialData, onError]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAssistant((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePersonalityChange = (trait, value) => {
    setAssistant((prev) => ({
      ...prev,
      personality: {
        ...prev.personality,
        [trait]: value
      }
    }));
  };
  
  const handleBaseKnowledgeToggle = (knowledge) => {
    setAssistant((prev) => ({
      ...prev,
      baseKnowledge: {
        ...prev.baseKnowledge,
        [knowledge]: !prev.baseKnowledge[knowledge]
      }
    }));
  };
  
  const handleCapabilityToggle = (capability) => {
    setAssistant((prev) => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [capability]: !prev.capabilities[capability]
      }
    }));
  };
  
  const handleAddQuestion = () => {
    if (!assistant.questionBank) {
      setAssistant(prev => ({
        ...prev,
        questionBank: []
      }));
    }
    
    setAssistant(prev => ({
      ...prev,
      questionBank: [
        ...prev.questionBank,
        { question: '', category: 'technical', difficulty: 'medium' }
      ]
    }));
  };
  
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...assistant.questionBank];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    
    setAssistant(prev => ({
      ...prev,
      questionBank: updatedQuestions
    }));
  };
  
  const handleRemoveQuestion = (index) => {
    setAssistant(prev => ({
      ...prev,
      questionBank: prev.questionBank.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      if (editMode) {
        await aiAssistantService.updateAssistant(assistantId, assistant);
        if (onSuccess) {
          onSuccess(assistantId);
        } else {
          router.push(`/ai-assistants/${assistantId}`);
        }
      } else {
        const newAssistant = await aiAssistantService.createAssistant(assistant);
        if (onSuccess) {
          onSuccess(newAssistant.id);
        } else {
          router.push(`/ai-assistants/${newAssistant.id}`);
        }
      }
    } catch (err) {
      const errorMessage = 'Erreur lors de l\'enregistrement: ' + err.message;
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setSaving(false);
    }
  };
  
  const handleTestAssistant = async () => {
    try {
      setTestResponse('');
      const response = await aiAssistantService.testAssistant(
        assistantId || 'preview', 
        { question: testQuestion, assistant }
      );
      setTestResponse(response.content);
    } catch (err) {
      setTestResponse('Erreur lors du test: ' + err.message);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {editMode ? 'Modifier l\'assistant IA' : 'Créer un nouvel assistant IA'}
      </h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'flex items-center justify-center',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <PencilIcon className="w-5 h-5 mr-2" />
            Informations de base
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'flex items-center justify-center',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <UserCircleIcon className="w-5 h-5 mr-2" />
            Personnalité
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'flex items-center justify-center',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <AcademicCapIcon className="w-5 h-5 mr-2" />
            Connaissances
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'flex items-center justify-center',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <CpuChipIcon className="w-5 h-5 mr-2" />
            Capacités
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'flex items-center justify-center',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Banque de questions
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'flex items-center justify-center',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            Tester l'assistant
          </Tab>
        </Tab.List>
        
        <Tab.Panels>
          {/* Informations de base */}
          <Tab.Panel className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom de l'assistant <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={assistant.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Ex: Assistant technique senior"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Modèle d'IA
                </label>
                <select
                  id="model"
                  name="model"
                  value={assistant.model}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={assistant.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Décrivez le rôle et les caractéristiques de cet assistant..."
                />
              </div>
              
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Secteur d'activité
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={assistant.industry}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="technology">Technologie</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Santé</option>
                  <option value="education">Éducation</option>
                  <option value="retail">Commerce de détail</option>
                  <option value="manufacturing">Industrie</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="jobRole" className="block text-sm font-medium text-gray-700">
                  Poste cible
                </label>
                <select
                  id="jobRole"
                  name="jobRole"
                  value={assistant.jobRole}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="software-engineer">Ingénieur logiciel</option>
                  <option value="data-scientist">Data Scientist</option>
                  <option value="product-manager">Chef de produit</option>
                  <option value="designer">Designer</option>
                  <option value="marketing">Marketing</option>
                  <option value="sales">Ventes</option>
                  <option value="customer-support">Support client</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="seniority" className="block text-sm font-medium text-gray-700">
                  Niveau d'expérience
                </label>
                <select
                  id="seniority"
                  name="seniority"
                  value={assistant.seniority}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="entry-level">Débutant</option>
                  <option value="mid-level">Intermédiaire</option>
                  <option value="senior">Senior</option>
                  <option value="management">Management</option>
                  <option value="executive">Exécutif</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="interviewMode" className="block text-sm font-medium text-gray-700">
                  Mode d'entretien
                </label>
                <select
                  id="interviewMode"
                  name="interviewMode"
                  value={assistant.interviewMode}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="autonomous">Autonome (L'IA mène l'entretien)</option>
                  <option value="collaborative">Collaboratif (Assistance au recruteur)</option>
                  <option value="hybrid">Hybride (Combinaison des deux modes)</option>
                </select>
              </div>
            </div>
          </Tab.Panel>
          
          {/* Personnalité */}
          <Tab.Panel className="space-y-6">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  Configurez la personnalité de votre assistant IA en ajustant les curseurs ci-dessous. Ces paramètres influenceront le ton, le style et l'approche de l'assistant lors des entretiens.
                </p>
              </div>
              
              {Object.entries({
                'friendliness': {
                  label: 'Convivialité',
                  min: 'Formel et direct',
                  max: 'Chaleureux et détendu'
                },
                'formality': {
                  label: 'Formalité',
                  min: 'Conversationnel',
                  max: 'Très formel'
                },
                'technicalDepth': {
                  label: 'Profondeur technique',
                  min: 'Conceptuel',
                  max: 'Très détaillé'
                },
                'followUpIntensity': {
                  label: 'Intensité des questions de suivi',
                  min: 'Basique',
                  max: 'Approfondies'
                }
              }).map(([key, config]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor={key} className="text-sm font-medium text-gray-700">
                      {config.label}
                    </label>
                    <span className="text-xs text-gray-500">
                      {assistant.personality[key]}/5
                    </span>
                  </div>
                  <input
                    type="range"
                    id={key}
                    name={key}
                    min="1"
                    max="5"
                    value={assistant.personality[key]}
                    onChange={(e) => handlePersonalityChange(key, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{config.min}</span>
                    <span>{config.max}</span>
                  </div>
                </div>
              ))}
              
              <div className="mt-8 border-t pt-6">
                <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions personnalisées (prompt avancé)
                </label>
                <textarea
                  id="customPrompt"
                  name="customPrompt"
                  value={assistant.customPrompt}
                  onChange={handleChange}
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Donnez des instructions spécifiques à l'IA pour définir son comportement, son approche ou des connaissances particulières..."
                />
                <p className="mt-2 text-sm text-gray-500">
                  Pour les utilisateurs avancés: utilisez ce champ pour définir précisément le comportement de votre assistant.
                </p>
              </div>
            </div>
          </Tab.Panel>
          
          {/* Connaissances */}
          <Tab.Panel className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                Définissez les domaines de connaissances que votre assistant doit maîtriser pour évaluer les candidats. Vous pourrez télécharger des documents spécifiques dans l'onglet "Documents" après avoir créé l'assistant.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Domaines de connaissances</h3>
              
              {Object.entries({
                'technicalSkills': 'Compétences techniques',
                'softSkills': 'Compétences comportementales',
                'companyValues': 'Valeurs de l\'entreprise',
                'industryTrends': 'Tendances du secteur'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-3">
                  <Switch
                    checked={assistant.baseKnowledge[key]}
                    onChange={() => handleBaseKnowledgeToggle(key)}
                    className={`${
                      assistant.baseKnowledge[key] ? 'bg-primary-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        assistant.baseKnowledge[key] ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
              ))}
            </div>
            
            {/* Section pour télécharger des documents spécifiques à l'entreprise */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Documents d'entreprise</h3>
              <p className="text-sm text-gray-500 mb-4">
                Note: Vous pourrez télécharger des documents spécifiques à votre entreprise (fiches de poste, valeurs, etc.) après avoir créé l'assistant.
              </p>
            </div>
          </Tab.Panel>
          
          {/* Capacités */}
          <Tab.Panel className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                Activez les différentes capacités de votre assistant IA. Ces fonctionnalités détermineront comment l'assistant interagira durant les entretiens.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Fonctionnalités</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries({
                  'generateQuestions': {
                    label: 'Générer des questions',
                    description: 'Créer des questions d\'entretien pertinentes',
                    icon: LightBulbIcon
                  },
                  'evaluateResponses': {
                    label: 'Évaluer les réponses',
                    description: 'Analyser la qualité des réponses des candidats',
                    icon: ClipboardDocumentCheckIcon
                  },
                  'provideFeedback': {
                    label: 'Fournir des retours',
                    description: 'Donner des commentaires détaillés post-entretien',
                    icon: ChatBubbleLeftRightIcon
                  },
                  'suggestFollowUps': {
                    label: 'Suggérer des questions de suivi',
                    description: 'Proposer des questions complémentaires en temps réel',
                    icon: ArrowPathIcon
                  },
                  'realTimeCoaching': {
                    label: 'Coaching en temps réel',
                    description: 'Conseiller le recruteur pendant l\'entretien',
                    icon: AcademicCapIcon
                  },
                  'biometricIntegration': {
                    label: 'Intégration biométrique',
                    description: 'Analyser les expressions faciales et le ton de voix',
                    icon: FaceSmileIcon
                  }
                }).map(([key, config]) => (
                  <div key={key} className="flex p-4 border rounded-lg">
                    <div className="mr-4 flex-shrink-0">
                      <config.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{config.label}</h4>
                        <Switch
                          checked={assistant.capabilities[key]}
                          onChange={() => handleCapabilityToggle(key)}
                          className={`${
                            assistant.capabilities[key] ? 'bg-primary-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              assistant.capabilities[key] ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{config.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Tab.Panel>
          
          {/* Banque de questions */}
          <Tab.Panel className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                Créez une banque de questions personnalisées pour votre assistant IA. Ces questions seront utilisées lors des entretiens en fonction du profil du candidat.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Questions d'entretien</h3>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Ajouter une question
                </button>
              </div>
              
              {assistant.questionBank && assistant.questionBank.length > 0 ? (
                <div className="space-y-4">
                  {assistant.questionBank.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
                      <div>
                        <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-700">
                          Question
                        </label>
                        <textarea
                          id={`question-${index}`}
                          value={question.question}
                          onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                          rows={2}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="Ex: Décrivez une situation où vous avez dû résoudre un problème technique complexe."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`category-${index}`} className="block text-sm font-medium text-gray-700">
                            Catégorie
                          </label>
                          <select
                            id={`category-${index}`}
                            value={question.category}
                            onChange={(e) => handleQuestionChange(index, 'category', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            <option value="technical">Technique</option>
                            <option value="behavioral">Comportementale</option>
                            <option value="experience">Expérience</option>
                            <option value="problem-solving">Résolution de problèmes</option>
                            <option value="cultural-fit">Adéquation culturelle</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor={`difficulty-${index}`} className="block text-sm font-medium text-gray-700">
                            Difficulté
                          </label>
                          <select
                            id={`difficulty-${index}`}
                            value={question.difficulty}
                            onChange={(e) => handleQuestionChange(index, 'difficulty', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            <option value="easy">Facile</option>
                            <option value="medium">Moyenne</option>
                            <option value="hard">Difficile</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(index)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border rounded-lg bg-gray-50">
                  <DocumentTextIcon className="h-10 w-10 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Aucune question ajoutée. Cliquez sur "Ajouter une question" pour commencer.
                  </p>
                </div>
              )}
            </div>
          </Tab.Panel>
          
          {/* Tester l'assistant */}
          <Tab.Panel className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                Testez votre assistant IA pour vérifier qu'il répond correctement aux questions d'entretien. Cela vous permettra d'affiner sa configuration avant de l'utiliser avec des candidats réels.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Test de l'assistant</h3>
              
              <div className="flex flex-col space-y-2">
                <label htmlFor="testQuestion" className="block text-sm font-medium text-gray-700">
                  Posez une question d'entretien à votre assistant
                </label>
                <textarea
                  id="testQuestion"
                  value={testQuestion}
                  onChange={(e) => setTestQuestion(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Ex: Comment approcheriez-vous la résolution d'un bug critique en production?"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleTestAssistant}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={!testQuestion}
                  >
                    Tester l'assistant
                  </button>
                </div>
              </div>
              
              {testResponse && (
                <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Réponse de l'assistant:</h4>
                  <div className="p-3 bg-white rounded border text-sm">
                    {testResponse}
                  </div>
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      
      <div className="mt-8 flex justify-end space-x-3 border-t pt-6">
        <button
          type="button"
          onClick={() => {
            if (editMode) {
              router.push(`/ai-assistants/${assistantId}`);
            } else {
              router.push('/ai-assistants');
            }
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : editMode ? 'Mettre à jour' : 'Créer l\'assistant'}
        </button>
      </div>
    </div>
  );
};

export default AIAssistantConfigurator;