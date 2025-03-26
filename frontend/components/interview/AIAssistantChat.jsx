// frontend/components/interview/AIAssistantChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Brain, Send, RefreshCw } from 'lucide-react';

/**
 * Composant pour le chat en temps réel avec l'assistant IA
 */
const AIAssistantChat = ({ interviewId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Simuler le chargement initial des messages
  useEffect(() => {
    const loadInitialMessages = async () => {
      setIsLoading(true);
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Messages de démonstration pour le mode développement
      const initialMessages = [
        {
          id: 'm1',
          sender: 'ai',
          content: "Bonjour ! Je suis votre assistant IA pour cet entretien. Je vous aiderai à analyser les réponses du candidat et à suggérer des questions pertinentes.",
          timestamp: new Date(Date.now() - 300000).toISOString()
        }
      ];
      
      setMessages(initialMessages);
      setIsLoading(false);
    };
    
    loadInitialMessages();
  }, [interviewId]);

  // Faire défiler vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simuler l'envoi d'un message à l'assistant
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Simuler la réponse de l'IA après un délai
    setTimeout(() => {
      // Générer différentes réponses en fonction du contenu du message
      let response;
      const lowercaseInput = input.toLowerCase();
      
      if (lowercaseInput.includes('technique') || lowercaseInput.includes('compétence')) {
        response = "D'après les réponses aux questions techniques, le candidat semble avoir une bonne connaissance des concepts fondamentaux, mais pourrait approfondir certains aspects spécifiques. Je vous suggère d'explorer davantage son expérience pratique avec des projets concrets.";
      } else if (lowercaseInput.includes('comportement') || lowercaseInput.includes('soft skills')) {
        response = "Le candidat a démontré de bonnes compétences en communication et semble à l'aise pour expliquer des concepts complexes. Sa communication non verbale indique une bonne confiance en soi, mais j'ai noté quelques hésitations quand il aborde des sujets liés au travail d'équipe.";
      } else if (lowercaseInput.includes('résumé') || lowercaseInput.includes('synthèse')) {
        response = "En résumé, le candidat présente un profil intéressant avec des compétences techniques solides en développement frontend et une bonne compréhension des concepts architecturaux. Points forts: React, expérience en équipe, résolution de problèmes. Points à approfondir: gestion d'état avancée, optimisation des performances.";
      } else if (lowercaseInput.includes('question')) {
        response = "Voici quelques questions pertinentes à poser:\n1. Pouvez-vous décrire un projet technique complexe sur lequel vous avez travaillé et les défis que vous avez surmontés?\n2. Comment abordez-vous la collaboration avec des membres d'équipe ayant des opinions techniques différentes?\n3. Quelle est votre approche pour maintenir vos compétences à jour dans un domaine qui évolue rapidement?";
      } else {
        response = "J'ai analysé les réponses du candidat jusqu'à présent. Les indicateurs biométriques montrent un niveau de confiance stable et une bonne articulation des idées. Pour la suite de l'entretien, je suggère d'explorer davantage son expérience en gestion de projet et sa capacité à s'adapter à de nouvelles technologies.";
      }
      
      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  // Formater l'heure des messages
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Brain size={32} className="mb-2 text-gray-400" />
            <p>Commencez à discuter avec votre assistant IA</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3/4 rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-3/4 rounded-lg p-3 bg-gray-100">
              <div className="flex items-center space-x-2">
                <RefreshCw size={16} className="animate-spin text-gray-500" />
                <p className="text-sm text-gray-500">L'assistant réfléchit...</p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Formulaire de saisie */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Demandez de l'aide à l'assistant IA..."
            className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`p-2 rounded-r-md ${
              isLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
            disabled={isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIAssistantChat;