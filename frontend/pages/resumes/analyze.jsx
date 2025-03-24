// frontend/pages/resumes/analyze.jsx
import { useState } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ResumeUpload from '../../components/resume/ResumeUpload';
import ResumeAnalysisResult from '../../components/resume/ResumeAnalysisResult';

export default function ResumeAnalyzePage() {
  const [jobRole, setJobRole] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Gérer l'analyse complétée
  const handleAnalysisComplete = (data) => {
    setAnalysis(data);
    setShowResults(true);
    
    // Faire défiler vers les résultats
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 100);
  };

  return (
    <Layout>
      <Head>
        <title>Analyse de CV - RecruteIA</title>
        <meta name="description" content="Analyser un CV avec l'intelligence artificielle" />
      </Head>

      <div className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête de la page */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Analyse de CV</h1>
              <p className="text-gray-600">
                Téléchargez un CV pour obtenir une analyse détaillée et des recommandations pour l'entretien.
              </p>
            </div>

            {/* Sélection du poste */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Poste recherché</h2>
              <p className="text-gray-600 mb-4">
                Précisez le poste pour lequel vous analysez ce CV afin d'obtenir une analyse plus pertinente.
              </p>
              
              <div className="max-w-lg">
                <label htmlFor="job-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Intitulé du poste
                </label>
                <input
                  type="text"
                  id="job-role"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Développeur Front-end, Data Scientist, DevOps..."
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                />
              </div>
            </div>

            {/* Upload de CV */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Téléchargement du CV</h2>
              <p className="text-gray-600 mb-4">
                Téléchargez un CV au format PDF, DOCX ou TXT pour commencer l'analyse.
              </p>
              
              <ResumeUpload 
                onAnalysisComplete={handleAnalysisComplete}
                jobRole={jobRole}
              />
            </div>

            {/* Résultats d'analyse */}
            {showResults && (
              <div id="results-section" className="mt-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Résultats de l'analyse</h2>
                
                <ResumeAnalysisResult 
                  analysis={analysis}
                  jobRole={jobRole}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}