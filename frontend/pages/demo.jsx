// frontend/pages/demo.jsx

import React, { useState } from 'react';
import { Play, Pause, UserPlus, Users, MessageSquare, ChevronRight, Award, Code, Settings, Zap, Camera, CameraOff, Heart, BarChart, Activity, PieChart, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';

const DemoPage = () => {
  const [activeMode, setActiveMode] = useState('autonomous');
  const [activeScenario, setActiveScenario] = useState('technical');
  const [demoStep, setDemoStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [candidateCamera, setCandidateCamera] = useState(true);
  const [recruiterCamera, setRecruiterCamera] = useState(true);
  const [showStressMetrics, setShowStressMetrics] = useState(false);

  // Définition des scénarios
  const scenarios = {
    technical: {
      name: "Entretien technique",
      description: "Évaluation des compétences techniques du candidat",
      stressLevel: "moyen",
      autonomous: [
        {
          sender: 'ai',
          content: "Bonjour et bienvenue à cet entretien. Je suis l'assistant IA de RecruteIA. Aujourd'hui, nous allons discuter de votre expérience en développement web. Pouvez-vous me parler de votre expérience avec React.js ?"
        },
        {
          sender: 'candidate',
          content: "Bonjour ! J'ai 3 ans d'expérience avec React. J'ai travaillé sur plusieurs projets d'entreprise utilisant React avec Redux pour la gestion d'état et j'ai aussi utilisé Next.js sur mon dernier projet."
        },
        {
          sender: 'ai',
          content: "Merci pour ces précisions. Pouvez-vous me décrire un défi technique que vous avez rencontré lors de l'utilisation de React et comment vous l'avez surmonté ?"
        },
        {
          sender: 'stress-metrics',
          content: { confidence: 85, stress: 35, engagement: 90, focus: 88 }
        }
      ],
      collaborative: [
        {
          sender: 'recruiter',
          content: "Bonjour et bienvenue à cet entretien. Je suis Sophie, responsable recrutement chez TechCorp. Aujourd'hui, nous allons discuter de votre expérience en développement web. Pouvez-vous me parler de votre expérience avec React.js ?"
        },
        {
          sender: 'candidate',
          content: "Bonjour Sophie ! J'ai 3 ans d'expérience avec React. J'ai travaillé sur plusieurs projets d'entreprise utilisant React avec Redux pour la gestion d'état et j'ai aussi utilisé Next.js sur mon dernier projet."
        },
        {
          sender: 'ai-suggestion',
          content: "Suggestion : Demandez-lui de décrire un défi technique qu'il a rencontré avec React et comment il l'a surmonté. Cela permettra d'évaluer sa capacité à résoudre des problèmes."
        },
        {
          sender: 'recruiter',
          content: "Intéressant. Pouvez-vous me décrire un défi technique que vous avez rencontré lors de l'utilisation de React et comment vous l'avez surmonté ?"
        },
        {
          sender: 'stress-metrics',
          content: { confidence: 80, stress: 40, engagement: 92, focus: 85 }
        }
      ]
    },
    behavioral: {
      name: "Test comportemental et communication",
      description: "Évaluation des compétences en communication et du comportement",
      stressLevel: "faible",
      autonomous: [
        {
          sender: 'ai',
          content: "Bonjour et bienvenue à cet entretien comportemental. Je suis l'assistant IA de RecruteIA. Parlez-moi d'une situation où vous avez dû résoudre un conflit au sein d'une équipe. Comment avez-vous abordé cette situation ?"
        },
        {
          sender: 'candidate',
          content: "Bonjour ! Lors de mon dernier projet, deux développeurs de mon équipe avaient des approches très différentes pour l'architecture du système. J'ai organisé une réunion pour que chacun puisse présenter sa vision, puis j'ai proposé une solution hybride qui intégrait les points forts des deux approches."
        },
        {
          sender: 'ai',
          content: "C'est une approche intéressante. Comment avez-vous géré les réactions émotionnelles potentielles des personnes impliquées dans ce conflit ?"
        },
        {
          sender: 'stress-metrics',
          content: { confidence: 92, stress: 20, engagement: 95, focus: 90 }
        }
      ],
      collaborative: [
        {
          sender: 'recruiter',
          content: "Bonjour et bienvenue à cet entretien. Je suis Marc, responsable RH chez TechCorp. J'aimerais que vous me parliez d'une situation où vous avez dû résoudre un conflit au sein d'une équipe. Comment avez-vous abordé cette situation ?"
        },
        {
          sender: 'candidate',
          content: "Bonjour Marc ! Lors de mon dernier projet, deux développeurs de mon équipe avaient des approches très différentes pour l'architecture du système. J'ai organisé une réunion pour que chacun puisse présenter sa vision, puis j'ai proposé une solution hybride qui intégrait les points forts des deux approches."
        },
        {
          sender: 'ai-suggestion',
          content: "Suggestion : Explorez sa capacité à gérer les aspects émotionnels des conflits. Demandez comment il a géré les réactions émotionnelles des personnes impliquées."
        },
        {
          sender: 'recruiter',
          content: "C'est intéressant. Comment avez-vous géré les réactions émotionnelles potentielles des personnes impliquées dans ce conflit ?"
        },
        {
          sender: 'stress-metrics',
          content: { confidence: 88, stress: 25, engagement: 90, focus: 85 }
        }
      ]
    },
    peerReview: {
      name: "Peer Review avec IA",
      description: "Simulation d'un entretien entre pairs avec un assistant IA",
      stressLevel: "très faible",
      autonomous: [
        {
          sender: 'ai',
          content: "Salut ! Je suis Alex, développeur senior dans l'équipe frontend. Je vais jouer le rôle d'un de tes futurs collègues pour cette session. Peux-tu me dire ce qui t'intéresse le plus dans le développement front-end actuel ?"
        },
        {
          sender: 'candidate',
          content: "Salut Alex ! Ce qui m'intéresse particulièrement, c'est l'évolution des frameworks comme React avec les nouveaux hooks et l'architecture basée sur les composants. J'aime aussi beaucoup l'aspect performance et l'optimisation du rendu."
        },
        {
          sender: 'ai',
          content: "Super ! Nous travaillons justement sur l'optimisation des performances. Si tu devais repenser un composant qui re-render trop souvent, quelle approche prendrais-tu pour diagnostiquer et résoudre ce problème ?"
        },
        {
          sender: 'stress-metrics',
          content: { confidence: 95, stress: 10, engagement: 98, focus: 96 }
        }
      ],
      collaborative: [
        {
          sender: 'recruiter',
          content: "Bonjour ! Je suis Laurent, tech lead de l'équipe front. Je vais simuler une conversation entre collègues. Peux-tu me dire ce qui t'intéresse le plus dans le développement front-end actuel ?"
        },
        {
          sender: 'candidate',
          content: "Salut Laurent ! Ce qui m'intéresse particulièrement, c'est l'évolution des frameworks comme React avec les nouveaux hooks et l'architecture basée sur les composants. J'aime aussi beaucoup l'aspect performance et l'optimisation du rendu."
        },
        {
          sender: 'ai-suggestion',
          content: "Suggestion : Posez une question technique mais dans un style conversationnel pour simuler une vraie discussion entre collègues. Évitez le format question-réponse classique d'entretien."
        },
        {
          sender: 'recruiter',
          content: "Ah, c'est cool ça ! On a justement un projet où on galère un peu avec les performances. Si tu tombais sur un composant qui re-render trop souvent, comment tu t'y prendrais pour diagnostiquer et résoudre ça ?"
        },
        {
          sender: 'stress-metrics',
          content: { confidence: 96, stress: 8, engagement: 99, focus: 94 }
        }
      ]
    },
    pressureTesting: {
      name: "Test sous pression",
      description: "Évaluation de la réaction du candidat sous stress",
      stressLevel: "élevé",
      autonomous: [
        {
          sender: 'ai',
          content: "Bonjour et bienvenue à cet entretien. Je suis l'assistant IA de RecruteIA. Vous avez indiqué avoir 5 ans d'expérience en développement backend. Pouvez-vous résoudre ce problème d'algorithme en temps réel ? Écrivez une fonction qui trouve tous les anagrammes dans un tableau de chaînes de caractères."
        },
        {
          sender: 'candidate',
          content: "Bonjour. Oui, pour résoudre ce problème, je pourrais trier les caractères de chaque mot pour créer une clé normalisée, puis regrouper les mots ayant la même clé... Euh, laissez-moi réfléchir pour structurer l'algorithme..."
        },
        {
          sender: 'ai',
          content: "Vous avez 2 minutes restantes. Quelle complexité temporelle aura votre solution ? Y a-t-il un moyen d'optimiser davantage l'algorithme ?"
        },
        {
          sender: 'stress-metrics',
          content: { confidence: 60, stress: 75, engagement: 88, focus: 82 }
        }
      ],
      collaborative: [
        {
          sender: 'recruiter',
          content: "Bonjour et bienvenue. Je suis Thomas, CTO. Vous avez indiqué avoir 5 ans d'expérience en développement backend. Pouvez-vous résoudre ce problème d'algorithme en temps réel ? Écrivez une fonction qui trouve tous les anagrammes dans un tableau de chaînes de caractères."
        },
        {
          sender: 'candidate',
          content: "Bonjour Thomas. Pour résoudre ce problème, je pourrais trier les caractères de chaque mot pour créer une clé normalisée, puis regrouper les mots ayant la même clé... Euh, laissez-moi réfléchir pour structurer l'algorithme..."
        },
        {
          sender: 'ai-suggestion',
          content: "Suggestion : Augmentez la pression avec une contrainte de temps. Observez comment le candidat gère le stress et s'il parvient à rester méthodique malgré la pression."
        },
        {
          sender: 'recruiter',
          content: "Vous avez 2 minutes restantes. J'aimerais aussi que vous m'expliquiez quelle complexité temporelle aura votre solution. Y a-t-il un moyen d'optimiser davantage l'algorithme ?"
        },
        {
          sender: 'stress-metrics',
          content: { confidence: 55, stress: 80, engagement: 85, focus: 78 }
        }
      ]
    }
  };
  
  // Fonction pour récupérer les messages selon le mode et le scénario actifs
  const getScenarioMessages = () => {
    const scenarioData = scenarios[activeScenario];
    return activeMode === 'autonomous' ? scenarioData.autonomous : scenarioData.collaborative;
  };

  // Fonction pour afficher le bon ensemble de messages selon le mode et le scénario actifs
  const getActiveMessages = () => {
    const messages = getScenarioMessages();
    return messages.slice(0, demoStep + 1);
  };

  // Fonction pour démarrer/arrêter la démonstration automatique
  const toggleDemo = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const messages = getScenarioMessages();
      
      const interval = setInterval(() => {
        setDemoStep(prev => {
          if (prev < messages.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            clearInterval(interval);
            return prev;
          }
        });
      }, 3000);
    }
  };

  // Fonction pour réinitialiser la démonstration
  const resetDemo = () => {
    setDemoStep(0);
    setIsPlaying(false);
  };

  // Fonction pour changer de mode de démonstration
  const changeMode = (mode) => {
    setActiveMode(mode);
    resetDemo();
  };
  
  // Fonction pour changer de scénario
  const changeScenario = (scenario) => {
    setActiveScenario(scenario);
    resetDemo();
  };
  
  // Fonction pour afficher le niveau de stress pour le scénario actuel
  const getStressLevel = () => {
    return scenarios[activeScenario].stressLevel;
  };
  
  // Fonction pour obtenir la dernière métrique de stress si disponible
  const getLastStressMetrics = () => {
    const messages = getActiveMessages();
    const stressMessages = messages.filter(msg => msg.sender === 'stress-metrics');
    return stressMessages.length > 0 ? stressMessages[stressMessages.length - 1].content : null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">  
      {/* Onglets de mode */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-center border-b border-gray-200">
          <button 
            className={`px-6 py-3 text-lg font-medium ${activeMode === 'autonomous' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => changeMode('autonomous')}
          >
            Mode Autonome
          </button>
          <button 
            className={`px-6 py-3 text-lg font-medium ${activeMode === 'collaborative' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => changeMode('collaborative')}
          >
            Mode Collaboratif
          </button>
        </div>
      </div>
      
      {/* Sélection de scénario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Sélectionnez un scénario</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <button
                key={key}
                onClick={() => changeScenario(key)}
                className={`p-3 rounded-lg border text-left ${
                  activeScenario === key 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{scenario.name}</div>
                <div className="text-sm text-gray-500">{scenario.description}</div>
                <div className="mt-2 flex items-center">
                  <Activity className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-xs">
                    Stress: <span className={`font-medium ${
                      scenario.stressLevel === 'élevé' ? 'text-red-500' : 
                      scenario.stressLevel === 'moyen' ? 'text-yellow-500' : 
                      scenario.stressLevel === 'faible' ? 'text-green-500' : 'text-blue-500'
                    }`}>{scenario.stressLevel}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu de la démonstration */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Contrôles de la démonstration */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between gap-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {scenarios[activeScenario].name} - {activeMode === 'autonomous' ? 'Mode Autonome' : 'Mode Collaboratif'}
              </h3>
              <p className="text-sm text-gray-500">
                {activeMode === 'autonomous' 
                  ? 'L\'IA mène l\'entretien entièrement avec le candidat' 
                  : 'Le recruteur conduit l\'entretien avec l\'assistance de l\'IA'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Contrôles de caméra */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => setCandidateCamera(!candidateCamera)}
                  className={`p-2 rounded-full ${candidateCamera ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                  title="Caméra du candidat"
                >
                  {candidateCamera ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                </button>
                {activeMode === 'collaborative' && (
                  <button 
                    onClick={() => setRecruiterCamera(!recruiterCamera)}
                    className={`p-2 rounded-full ${recruiterCamera ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                    title="Caméra du recruteur"
                  >
                    {recruiterCamera ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                  </button>
                )}
              </div>
              
              {/* Bouton pour afficher/masquer les métriques de stress */}
              <button 
                onClick={() => setShowStressMetrics(!showStressMetrics)}
                className={`p-2 rounded-full ${showStressMetrics ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                title="Afficher les métriques de stress"
              >
                <Activity className="h-5 w-5" />
              </button>
              
              {/* Contrôles de lecture */}
              <div className="flex space-x-2">
                <button 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  onClick={resetDemo}
                >
                  Réinitialiser
                </button>
                <button 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  onClick={toggleDemo}
                >
                  {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Démarrer'}
                </button>
              </div>
            </div>
          </div>

          {/* Interface d'entretien */}
          <div className="flex flex-col md:flex-row">
            {/* Zone d'affichage des messages */}
            <div className="p-6 h-96 overflow-y-auto flex-grow">
              {/* Vidéo des participants */}
              <div className="flex justify-between mb-4">
                {activeMode === 'collaborative' && (
                  <div className={`w-28 h-20 rounded-lg overflow-hidden bg-gray-200 ${recruiterCamera ? 'opacity-100' : 'opacity-50'}`}>
                    {recruiterCamera ? (
                      <div className="w-full h-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">
                        Recruteur
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <CameraOff className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                )}
                <div className={`w-28 h-20 rounded-lg overflow-hidden bg-gray-200 ${candidateCamera ? 'opacity-100' : 'opacity-50'}`}>
                  {candidateCamera ? (
                    <div className="w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium">
                      Candidat
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <CameraOff className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Messages */}
              <div className="space-y-4">
                {getActiveMessages().filter(msg => msg.sender !== 'stress-metrics').map((message, index) => (
                  <div key={index} className={`flex ${message.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-md px-4 py-3 rounded-lg ${
                        message.sender === 'ai' ? 'bg-indigo-50 text-indigo-900' : 
                        message.sender === 'candidate' ? 'bg-blue-50 text-blue-900' : 
                        message.sender === 'recruiter' ? 'bg-green-50 text-green-900' : 
                        'bg-yellow-50 text-yellow-900 border border-yellow-200'
                      }`}
                    >
                      {message.sender === 'ai-suggestion' && (
                        <div className="font-semibold text-yellow-700 mb-1">Suggestion IA :</div>
                      )}
                      {message.content}
                    </div>
                  </div>
                ))}
                {getActiveMessages().length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Cliquez sur "Démarrer" pour lancer la démonstration
                  </div>
                )}
              </div>
            </div>
            
            {/* Panneau de métriques de stress */}
            {showStressMetrics && (
              <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50 p-4 h-96 overflow-y-auto">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  Analyse comportementale
                </h3>
                
                {getLastStressMetrics() ? (
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Confiance</label>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-600 bg-indigo-200">
                              {getLastStressMetrics().confidence}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-indigo-200">
                          <div style={{ width: `${getLastStressMetrics().confidence}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Niveau de stress</label>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-red-600 bg-red-200">
                              {getLastStressMetrics().stress}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-red-200">
                          <div style={{ width: `${getLastStressMetrics().stress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Engagement</label>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-green-600 bg-green-200">
                              {getLastStressMetrics().engagement}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-green-200">
                          <div style={{ width: `${getLastStressMetrics().engagement}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Focus</label>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-blue-600 bg-blue-200">
                              {getLastStressMetrics().focus}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                          <div style={{ width: `${getLastStressMetrics().focus}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Analyse globale</h4>
                      <div className="flex items-center text-sm">
                        {getLastStressMetrics().stress > 60 ? (
                          <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        )}
                        <span>
                          {getLastStressMetrics().stress > 60 
                            ? "Niveau de stress élevé détecté" 
                            : "Niveau de stress dans la norme"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm mt-1">
                        {getLastStressMetrics().engagement < 70 ? (
                          <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        )}
                        <span>
                          {getLastStressMetrics().engagement < 70 
                            ? "Engagement modéré" 
                            : "Bon niveau d'engagement"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Les métriques apparaîtront pendant l'entretien
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

DemoPage.getLayout = (page) => <Layout>{page}</Layout>;
export default DemoPage;