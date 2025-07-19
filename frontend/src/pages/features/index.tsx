// frontend/pages/features.tsx
import React, { ReactElement } from 'react';
import Head from 'next/head';
import Layout from '@/components/layout/layout';
import { Monitor, Users, Brain, Activity, Shield, Clock, LucideIcon } from 'lucide-react';
import { NextPageWithLayout } from '@/types/page';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-4">
        <div className="bg-indigo-100 p-3 rounded-full mr-4">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const Features: NextPageWithLayout = () => {
  const mainFeatures: Feature[] = [
    {
      icon: Brain,
      title: "Entretiens IA Autonomes",
      description: "Notre IA mène des entretiens complets, pose des questions pertinentes basées sur le CV du candidat et la description du poste, et fournit une analyse détaillée."
    },
    {
      icon: Users,
      title: "Mode Collaboratif",
      description: "Travaillez en équipe avec des assistants IA spécialisés qui vous aident à poser les bonnes questions et à analyser les réponses en temps réel."
    },
    {
      icon: Activity,
      title: "Analyse Biométrique",
      description: "Analysez les expressions faciales, le ton de la voix et d'autres indicateurs biométriques pour obtenir des insights sur le niveau de stress et d'engagement des candidats."
    },
    {
      icon: Monitor,
      title: "Tableaux de Bord Analytiques",
      description: "Visualisez les performances des candidats avec des métriques détaillées et des comparaisons permettant une prise de décision basée sur les données."
    },
    {
      icon: Shield,
      title: "Sécurité Renforcée",
      description: "Protection des données avec authentification à deux facteurs, historique des connexions et conformité RGPD pour garantir la confidentialité."
    },
    {
      icon: Clock,
      title: "Gain de Temps Considérable",
      description: "Réduisez le temps consacré aux entretiens de 60% tout en augmentant la qualité des évaluations et la pertinence des recrutements."
    }
  ];

  return (
    <div>
      <Head>
        <title>Fonctionnalités | RecruteIA</title>
        <meta name="description" content="Découvrez les fonctionnalités innovantes de RecruteIA pour révolutionner vos processus de recrutement grâce à l'intelligence artificielle." />
      </Head>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Fonctionnalités Avancées
          </h1>
          <p className="mt-6 text-xl max-w-3xl">
            Découvrez comment RecruteIA révolutionne les processus de recrutement grâce à des technologies d'intelligence artificielle de pointe.
          </p>
        </div>
      </div>

      {/* Main Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Nos fonctionnalités principales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mainFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>

      {/* Detailed Feature Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Entretiens IA Intelligents
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Notre technologie d'IA avancée permet des entretiens plus efficaces, objectifs et informatifs.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-500 text-white">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    Questions générées dynamiquement en fonction du CV du candidat
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-500 text-white">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    Adaptation en temps réel selon les réponses et le temps de réaction
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-500 text-white">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    Transcription automatique et analyse sémantique des réponses
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-500 text-white">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    Détection des incohérences et vérification des compétences
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img 
                  className="w-full object-cover" 
                  src="/images/ai-interview.svg"
                  alt="Interface d'entretien IA"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Detailed Feature */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div className="mt-10 lg:mt-0 lg:order-first">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img 
                  className="w-full object-cover" 
                  src="/images/biometric-analysis.svg"
                  alt="Analyse biométrique"
                />
              </div>
            </div>
            <div className="lg:order-last">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Analyse Biométrique Avancée
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Obtenez des insights uniques sur les candidats grâce à notre technologie d'analyse biométrique non intrusive.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-500 text-white">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    Analyse des expressions faciales en temps réel
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-500 text-white">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    Détection du niveau de stress et de confiance
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-500 text-white">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    Mesure de l'engagement et des réactions émotionnelles
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-500 text-white">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    Visualisations graphiques des tendances comportementales
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Prêt à transformer votre recrutement?</span>
            <span className="block text-indigo-200">Commencez à utiliser RecruteIA dès aujourd'hui.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Démarrer gratuitement
              </a>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600"
              >
                Contactez-nous
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>  
  );
};

Features.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default Features;