// frontend/components/interview/InterviewSetupForm.jsx
import React, { useState } from 'react';
import CVUpload from './CVUpload';
import aiInterviewService from '../../services/ai-interview-service';

const InterviewSetupForm = ({ onSetupComplete, initialJobDescription = '', onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Données du formulaire
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [experienceLevel, setExperienceLevel] = useState('intermédiaire');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [cvFile, setCVFile] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [interviewMode, setInterviewMode] = useState('autonomous');
  
  // Questions générées
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  
  // Gérer le téléchargement du CV
  const handleCVUploaded = (file) => {
    setCVFile(file);
  };
  
  // Passer à l'étape suivante
  const goToNextStep = () => {
    // Validation selon l'étape actuelle
    if (step === 1) {
      if (!jobTitle.trim()) {
        setError("Veuillez saisir l'intitulé du poste");
        return;
      }
      if (!jobDescription.trim()) {
        setError("Veuillez saisir la description du poste");
        return;
      }
    } else if (step === 2) {
      if (!cvFile) {
        setError("Veuillez télécharger le CV du candidat");
        return;
      }
      if (!candidateName.trim()) {
        setError("Veuillez saisir le nom du candidat");
        return;
      }
      
      // Générer les questions à la fin de l'étape 2
      generateQuestions();
      return;
    }
    
    setError(null);
    setStep(step + 1);
  };
  
  // Revenir à l'étape précédente
  const goToPreviousStep = () => {
    setError(null);
    setStep(step - 1);
  };
  
  // Générer des questions basées sur le CV et la description du poste
  const generateQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const questions = await aiInterviewService.generateQuestionsFromCVFile(
        cvFile,
        jobDescription,
        {
          numberOfQuestions,
          experienceLevel
        }
      );
      
      setGeneratedQuestions(questions);
      setLoading(false);
      setStep(3);
    } catch (err) {
      console.error('Erreur lors de la génération des questions:', err);
      setError('Impossible de générer les questions. Veuillez réessayer.');
      setLoading(false);
    }
  };
  
  // Finaliser la configuration de l'entretien
  const finalizeSetup = () => {
    if (generatedQuestions.length === 0) {
      setError("Aucune question n'a été générée");
      return;
    }
    
    // Préparer les données de l'entretien
    const interviewData = {
      candidateName,
      jobTitle,
      jobDescription,
      experienceLevel,
      questions: generatedQuestions,
      interviewMode,
      cvFile
    };
    
    // Notifier le composant parent
    if (onSetupComplete) {
      onSetupComplete(interviewData);
    }
  };
  
  // Suppression d'une question
  const removeQuestion = (index) => {
    setGeneratedQuestions(questions => questions.filter((_, i) => i !== index));
  };
  
  // Édition manuelle d'une question
  const editQuestion = (index, field, value) => {
    setGeneratedQuestions(questions => {
      const newQuestions = [...questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return newQuestions;
    });
  };
  
  // Ajout manuel d'une question
  const addCustomQuestion = () => {
    const newQuestion = {
      question: "Nouvelle question personnalisée",
      difficulty: "moyenne",
      category: "personnalisée",
      reasoning: "Question ajoutée manuellement"
    };
    
    setGeneratedQuestions([...generatedQuestions, newQuestion]);
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Indicateur d'étape */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
            <div className={`step-circle ${step >= 1 ? 'bg-primary-600' : 'bg-gray-300'}`}>1</div>
            <div className="step-title">Poste</div>
          </div>
          <div className="step-separator"></div>
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
            <div className={`step-circle ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}>2</div>
            <div className="step-title">Candidat</div>
          </div>
          <div className="step-separator"></div>
          <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
            <div className={`step-circle ${step >= 3 ? 'bg-primary-600' : 'bg-gray-300'}`}>3</div>
            <div className="step-title">Questions</div>
          </div>
        </div>
      </div>
      
      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      {/* Étape 1: Informations sur le poste */}
      {step === 1 && (
        <div className="step-content">
          <h2 className="text-xl font-semibold mb-6">Informations sur le poste</h2>
          
          <div className="mb-4">
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Intitulé du poste *
            </label>
            <input
              type="text"
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ex: Développeur Frontend React"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Niveau d'expérience requis
            </label>
            <select
              id="experienceLevel"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="débutant">Débutant (0-2 ans)</option>
              <option value="intermédiaire">Intermédiaire (2-5 ans)</option>
              <option value="senior">Senior (5-8 ans)</option>
              <option value="expert">Expert (8+ ans)</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description du poste *
            </label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Collez ici la description complète du poste..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Plus la description est détaillée, plus les questions générées seront pertinentes.
            </p>
          </div>
        </div>
      )}
      
      {/* Étape 2: Informations sur le candidat */}
      {step === 2 && (
        <div className="step-content">
          <h2 className="text-xl font-semibold mb-6">Informations sur le candidat</h2>
          
          <div className="mb-4">
            <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du candidat *
            </label>
            <input
              type="text"
              id="candidateName"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ex: Jean Dupont"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="cvUpload" className="block text-sm font-medium text-gray-700 mb-1">
              CV du candidat *
            </label>
            <CVUpload onCVUploaded={handleCVUploaded} />
            <p className="text-sm text-gray-500 mt-1">
              Le CV sera analysé pour générer des questions personnalisées.
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="numberOfQuestions" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de questions
            </label>
            <select
              id="numberOfQuestions"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="3">3 questions</option>
              <option value="5">5 questions</option>
              <option value="7">7 questions</option>
              <option value="10">10 questions</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode d'entretien
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="modeAutonomous"
                  name="interviewMode"
                  value="autonomous"
                  checked={interviewMode === 'autonomous'}
                  onChange={() => setInterviewMode('autonomous')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="modeAutonomous" className="ml-2 text-sm text-gray-700">
                  Autonome (IA seule)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="modeCollaborative"
                  name="interviewMode"
                  value="collaborative"
                  checked={interviewMode === 'collaborative'}
                  onChange={() => setInterviewMode('collaborative')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="modeCollaborative" className="ml-2 text-sm text-gray-700">
                  Collaboratif (avec recruteur)
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Étape 3: Révision des questions */}
      {step === 3 && (
        <div className="step-content">
          <h2 className="text-xl font-semibold mb-6">Révision des questions</h2>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Génération des questions en cours...</p>
              <p className="text-sm text-gray-500 mt-1">
                L'analyse du CV et de la description du poste peut prendre jusqu'à une minute.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-gray-600">
                Passez en revue les questions générées par l'IA. Vous pouvez les modifier, en supprimer ou en ajouter de nouvelles.
              </p>
              
              <div className="space-y-4 mb-6">
                {generatedQuestions.map((question, index) => (
                  <div key={index} className="border rounded-md p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex space-x-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          question.difficulty === 'difficile' ? 'bg-red-100 text-red-800' :
                          question.difficulty === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {question.difficulty}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {question.category}
                        </span>
                      </div>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="text-gray-400 hover:text-red-500"
                        title="Supprimer la question"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="mb-2">
                      <textarea
                        value={question.question}
                        onChange={(e) => editQuestion(index, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={2}
                      />
                    </div>
                    
                    {question.reasoning && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Raisonnement: </span>
                        {question.reasoning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={addCustomQuestion}
                className="flex items-center text-primary-600 hover:text-primary-700 mb-6"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter une question personnalisée
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Boutons de navigation */}
      <div className="flex justify-between mt-8">
        {step === 1 ? (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Annuler
          </button>
        ) : (
          <button
            onClick={goToPreviousStep}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Précédent
          </button>
        )}
        
        {step < 3 ? (
          <button
            onClick={goToNextStep}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
            disabled={loading}
          >
            Suivant
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={finalizeSetup}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            disabled={loading}
          >
            Démarrer l'entretien
          </button>
        )}
      </div>
      
      {/* Styles pour les étapes */}
      <style jsx>{`
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100px;
        }
        
        .step-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .step-title {
          font-size: 14px;
          color: #4b5563;
        }
        
        .step-item.active .step-title {
          color: #111827;
          font-weight: 500;
        }
        
        .step-separator {
          flex-grow: 1;
          height: 2px;
          background-color: #e5e7eb;
          margin: 0 10px;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
};

export default InterviewSetupForm;