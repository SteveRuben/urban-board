// frontend/pages/interviews/create.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

// Composants
import DashboardLayout from '../../components/layout/DashboardLayout';
import InterviewSetupForm from '../../components/interview/InterviewSetupForm';
import InterviewRoom from '../../components/interview/InterviewRoom';
import { Button, Alert } from '../../components/ui';

// Hooks
import { useAuth } from '../../hooks/useAuth';

/**
 * Page de création d'un nouvel entretien
 */
const CreateInterviewPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState('setup'); // 'setup' ou 'interview'
  const [error, setError] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  
  // Traitement de la configuration terminée
  const handleSetupComplete = async (data) => {
    try {
      setLoading(true);
      
      // Créer un FormData pour envoyer le CV
      const formData = new FormData();
      formData.append('cv_file', data.cvFile);
      formData.append('candidate_name', data.candidateName);
      formData.append('job_title', data.jobTitle);
      formData.append('job_description', data.jobDescription);
      formData.append('experience_level', data.experienceLevel);
      formData.append('interview_mode', data.interviewMode);
      formData.append('questions', JSON.stringify(data.questions));
      
      // Créer l'entretien via l'API
      const response = await axios.post('/api/interviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Stocker l'ID de l'entretien créé
      const newInterviewId = response.data.id;
      setInterviewId(newInterviewId);
      
      // Stocker les données pour l'entretien
      setInterviewData(data);
      setLoading(false);
      setStep('interview');
    } catch (err) {
      console.error('Erreur lors de la création de l\'entretien:', err);
      setError('Impossible de créer l\'entretien. Veuillez réessayer.');
      setLoading(false);
    }
  };
  
  // Annuler la création d'entretien
  const handleCancel = () => {
    router.push('/interviews');
  };
  
  // Gérer la fin de l'entretien
  const handleInterviewComplete = (result) => {
    if (interviewId) {
      router.push(`/interviews/${interviewId}/summary`);
    } else {
      router.push('/interviews');
    }
  };
  
  return (
    <>
      <Head>
        <title>Créer un entretien | RecruteIA</title>
      </Head>
      
      {error && (
        <Alert 
          type="error" 
          title="Erreur" 
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Création de l'entretien en cours...</p>
            <p className="text-sm text-gray-500 mt-2">Cela peut prendre quelques instants</p>
          </div>
        </div>
      )}
      
      {step === 'setup' ? (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Créer un nouvel entretien
            </h1>
          </div>
          
          <InterviewSetupForm 
            onSetupComplete={handleSetupComplete}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <InterviewRoom 
          interviewId={interviewId}
          jobRole={interviewData?.jobTitle}
          experienceLevel={interviewData?.experienceLevel}
          questions={interviewData?.questions}
          candidateName={interviewData?.candidateName}
          interviewMode={interviewData?.interviewMode}
          onInterviewComplete={handleInterviewComplete}
        />
      )}
    </>
  );
};

export default CreateInterviewPage;