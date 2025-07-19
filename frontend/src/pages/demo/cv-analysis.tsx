// Page de démonstration publique de l'analyse de CV
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Upload, FileText, Brain, Star, TrendingUp, Users, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const CVAnalysisDemo = () => {
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Données de démonstration pour l'analyse CV
  const demoAnalysis = {
    candidate_name: "Marie Dubois",
    position: "Développeur Frontend React",
    fit_score: 8.7,
    technical_skills: [
      "React", "JavaScript", "TypeScript", "HTML/CSS", "Node.js", "Git", "REST APIs"
    ],
    soft_skills: [
      "Communication", "Travail d'équipe", "Résolution de problèmes", "Adaptabilité"
    ],
    experience_years: 4,
    strengths: [
      "Solide expérience en React et écosystème JavaScript moderne",
      "Projets variés démontrant une progression technique",
      "Expérience en méthodologies agiles",
      "Contributions open source visibles"
    ],
    gaps: [
      "Manque d'expérience avec les tests automatisés",
      "Peu d'exposition aux architectures microservices",
      "Formation continue en UX/UI design recommandée"
    ],
    recommended_questions: [
      {
        question: "Pouvez-vous me parler d'un projet React complexe que vous avez développé ?",
        rationale: "Évaluer la profondeur technique et l'approche de résolution de problèmes"
      },
      {
        question: "Comment gérez-vous l'état dans une application React de grande taille ?",
        rationale: "Comprendre la maîtrise des patterns avancés React"
      },
      {
        question: "Décrivez votre approche pour optimiser les performances d'une application web",
        rationale: "Évaluer les connaissances en optimisation et bonnes pratiques"
      }
    ]
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisStep(1);
    
    // Simuler les étapes d'analyse
    setTimeout(() => setAnalysisStep(2), 1500);
    setTimeout(() => setAnalysisStep(3), 3000);
    setTimeout(() => {
      setAnalysisStep(4);
      setIsAnalyzing(false);
    }, 4500);
  };

  const resetDemo = () => {
    setAnalysisStep(0);
    setIsAnalyzing(false);
  };

  return (
    <>
      <Head>
        <title>Démonstration Analyse CV IA - RecruteIA</title>
        <meta name="description" content="Découvrez comment notre IA analyse les CV et génère des insights pour optimiser vos entretiens. Essai gratuit." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Banner de démonstration */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Brain className="h-5 w-5" />
                <span className="font-medium">Analyse CV par IA</span>
                <span className="text-green-200">•</span>
                <span className="text-sm">Démonstration interactive gratuite</span>
              </div>
              <Link href="/auth/register" className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Essayer gratuitement
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Analyse de CV par Intelligence Artificielle
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez comment notre IA analyse automatiquement les CV, évalue l'adéquation avec le poste et génère des questions d'entretien personnalisées.
            </p>
          </div>

          {/* Étapes de démonstration */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {analysisStep === 0 && (
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="h-12 w-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Téléchargez un CV pour commencer
                </h2>
                <p className="text-gray-600 mb-8">
                  Dans cette démonstration, nous analyserons un CV exemple pour vous montrer la puissance de notre IA.
                </p>
                
                {/* CV exemple */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-md mx-auto">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="h-8 w-8 text-gray-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">CV_Marie_Dubois.pdf</p>
                      <p className="text-sm text-gray-500">Développeur Frontend • 4 ans d'exp.</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>• React, TypeScript, Node.js</p>
                    <p>• 3 entreprises, projets variés</p>
                    <p>• Formation ingénieur informatique</p>
                  </div>
                </div>

                <button
                  onClick={startAnalysis}
                  className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Brain className="mr-2 h-5 w-5" />
                  Analyser avec l'IA
                </button>
              </div>
            )}

            {analysisStep === 1 && (
              <div className="text-center">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Extraction des informations...
                </h2>
                <p className="text-gray-600">
                  L'IA extrait et structure les données du CV : compétences, expérience, formation...
                </p>
              </div>
            )}

            {analysisStep === 2 && (
              <div className="text-center">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Analyse de l'adéquation...
                </h2>
                <p className="text-gray-600">
                  Comparaison avec le profil de poste et calcul du score de compatibilité...
                </p>
              </div>
            )}

            {analysisStep === 3 && (
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Génération des insights...
                </h2>
                <p className="text-gray-600">
                  Création des questions d'entretien personnalisées et recommandations...
                </p>
              </div>
            )}

            {analysisStep === 4 && (
              <div>
                <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Analyse terminée !
                  </h2>
                  <p className="text-gray-600">
                    Voici les résultats de l'analyse IA pour {demoAnalysis.candidate_name}
                  </p>
                </div>

                {/* Résultats de l'analyse */}
                <div className="space-y-6">
                  {/* Score d'adéquation */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Score d'adéquation</h3>
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="text-2xl font-bold text-gray-900">{demoAnalysis.fit_score}/10</span>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      Excellent profil pour le poste de {demoAnalysis.position}. 
                      Compétences techniques solides et expérience pertinente.
                    </p>
                  </div>

                  {/* Compétences */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Compétences techniques</h3>
                      <div className="flex flex-wrap gap-2">
                        {demoAnalysis.technical_skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Compétences transversales</h3>
                      <div className="flex flex-wrap gap-2">
                        {demoAnalysis.soft_skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Forces et lacunes */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        Points forts
                      </h3>
                      <ul className="space-y-2">
                        {demoAnalysis.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                        Points d'attention
                      </h3>
                      <ul className="space-y-2">
                        {demoAnalysis.gaps.map((gap, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Questions recommandées */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions d'entretien recommandées</h3>
                    <div className="space-y-4">
                      {demoAnalysis.recommended_questions.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <p className="font-medium text-gray-900 mb-2">{item.question}</p>
                          <p className="text-sm text-gray-600 italic">💡 {item.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={resetDemo}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Nouvelle analyse
                    </button>
                    <Link
                      href="/auth/register"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      Commencer gratuitement
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fonctionnalités */}
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">IA Avancée</h3>
              <p className="text-gray-600">
                Analyse sémantique profonde des CV avec compréhension contextuelle
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Score Précis</h3>
              <p className="text-gray-600">
                Évaluation objective basée sur 50+ critères de compatibilité
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Questions Personnalisées</h3>
              <p className="text-gray-600">
                Génération automatique de questions d'entretien ciblées
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              Prêt à optimiser vos recrutements ?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Analysez vos premiers CV gratuitement et découvrez comment l'IA peut transformer votre processus de sélection.
            </p>
            <Link 
              href="/auth/register"
              className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Commencer l'essai gratuit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default CVAnalysisDemo;