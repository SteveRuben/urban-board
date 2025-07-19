// Page d'accueil moderne RecruteIA avec design vert/orange
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Play,
  Star,
  Users,
  Brain,
  Code,
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  X,
  Shield,
  Clock,
  DollarSign,
  Award
} from 'lucide-react';
import { NextPage } from 'next';
import { User } from '@/types/user';
import { useAuth } from '@/provider/auth';
import Layout from '@/components/layout/layout';

const Home: NextPage = () => {
  const { user } = useAuth() as { user: User | null };

  return (
    <Layout>
      <Head>
        <title>RecruteIA - Révolutionnez vos entretiens avec l'IA</title>
        <meta name="description" content="Plateforme d'entretiens intelligente propulsée par l'IA. Analyse CV, tests de coding, évaluation automatique. Transformez votre recrutement dès aujourd'hui." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Section Hero */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Révolutionnez vos
              <span className="block bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent">
                entretiens avec l'IA
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              RecruteIA automatise l'analyse de CV, génère des questions personnalisées et évalue les compétences techniques en temps réel. 
              Transformez votre processus de recrutement dès aujourd'hui.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {user ? (
                <Link
                  href="/interviews/new"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Démarrer un entretien
                </Link>
              ) : (
                <>
                  <Link
                    href="/demo/features"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Voir les démos
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Essai gratuit 14 jours
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </>
              )}
            </div>

            {/* Badges de confiance */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="font-semibold text-green-600">1,200+</span>
                <span className="ml-1">entreprises nous font confiance</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-orange-600">50,000+</span>
                <span className="ml-1">entretiens réalisés</span>
              </div>
              <div className="flex items-center">
                <div className="flex text-yellow-400 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-semibold">4.9/5</span>
                <span className="ml-1">satisfaction client</span>
              </div>
            </div>
          </div>
        </div>

        {/* Éléments décoratifs */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </section>

      {/* Section Démonstrations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Découvrez RecruteIA en action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explorez nos démonstrations interactives et voyez comment l'IA peut transformer votre processus de recrutement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Dashboard Demo */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Dashboard Intelligent</h3>
                <p className="text-green-100">Analytics temps réel et métriques avancées pour optimiser vos recrutements</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Alertes intelligentes
                  </li>
                  <li className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Métriques de performance
                  </li>
                  <li className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Rapports personnalisés
                  </li>
                </ul>
                <Link
                  href="/demo/dashboard"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors group-hover:shadow-lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Essayer la démo
                </Link>
              </div>
            </div>

            {/* CV Analysis Demo */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-6">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Analyse CV par IA</h3>
                <p className="text-orange-100">Évaluation automatique et scoring intelligent des candidatures</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-orange-500 mr-3" />
                    Score d'adéquation
                  </li>
                  <li className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-orange-500 mr-3" />
                    Questions personnalisées
                  </li>
                  <li className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-orange-500 mr-3" />
                    Insights détaillés
                  </li>
                </ul>
                <Link
                  href="/demo/cv-analysis"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors group-hover:shadow-lg"
                >
                  <Brain className="mr-2 h-5 w-5" />
                  Analyser un CV
                </Link>
              </div>
            </div>

            {/* Coding Platform Demo */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-green-600 to-orange-500 p-8 text-white">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-6">
                  <Code className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Tests de Coding</h3>
                <p className="text-green-100">Évaluation technique sécurisée avec Docker et correction automatique</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    150+ exercices
                  </li>
                  <li className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    5 langages supportés
                  </li>
                  <li className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    Exécution sécurisée
                  </li>
                </ul>
                <Link
                  href="/demo/coding-platform"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-orange-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-orange-600 transition-colors group-hover:shadow-lg"
                >
                  <Code className="mr-2 h-5 w-5" />
                  Tester le code
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/demo/features"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-orange-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
            >
              Voir toutes les démonstrations
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir RecruteIA ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une plateforme complète qui révolutionne chaque étape de votre processus de recrutement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Rapidité</h3>
              <p className="text-gray-600 text-lg">
                Réduisez le temps de sélection de 60% grâce à l'automatisation intelligente et l'analyse IA
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Précision</h3>
              <p className="text-gray-600 text-lg">
                IA avancée pour une évaluation objective et des recommandations pertinentes
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Performance</h3>
              <p className="text-gray-600 text-lg">
                Améliorez la qualité de vos recrutements avec des insights data-driven
              </p>
            </div>
          </div>

          {/* Fonctionnalités détaillées */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Entretiens intelligents propulsés par l'IA
              </h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-4 mt-1">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Mode IA Autonome</h4>
                    <p className="text-gray-600">L'IA mène l'entretien de manière autonome, pose des questions adaptées et évalue les réponses en temps réel.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-4 mt-1">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Assistance IA</h4>
                    <p className="text-gray-600">Recevez des suggestions de questions, des analyses comportementales et des recommandations pendant l'entretien.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-4 mt-1">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Évaluation Technique</h4>
                    <p className="text-gray-600">Tests de coding sécurisés avec Docker, support multi-langages et correction automatique.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-green-500 to-orange-500 rounded-2xl p-8 text-white">
                <div className="text-center">
                  <Brain className="h-16 w-16 mx-auto mb-4 opacity-90" />
                  <h4 className="text-2xl font-bold mb-4">IA Avancée</h4>
                  <p className="text-lg opacity-90 mb-6">
                    Notre intelligence artificielle analyse plus de 50 critères pour évaluer chaque candidat
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold">98%</div>
                      <div className="text-sm opacity-80">Précision</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">60%</div>
                      <div className="text-sm opacity-80">Temps économisé</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos clients
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Plus de 1,200 entreprises nous font confiance pour optimiser leurs processus de recrutement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400 mr-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="text-green-600 font-semibold">Excellent</span>
              </div>
              <p className="text-gray-700 mb-6 text-lg italic">
                "RecruteIA a révolutionné notre processus de recrutement. Nous avons réduit le temps de sélection de 60% tout en améliorant la qualité des candidats."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  M
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Marie Dubois</div>
                  <div className="text-gray-600">DRH, TechCorp</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400 mr-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="text-orange-600 font-semibold">Parfait</span>
              </div>
              <p className="text-gray-700 mb-6 text-lg italic">
                "L'analyse automatique des CV nous fait gagner un temps précieux. Les insights fournis par l'IA sont d'une précision remarquable."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  P
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Pierre Martin</div>
                  <div className="text-gray-600">Responsable RH, StartupLab</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400 mr-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="text-blue-600 font-semibold">Exceptionnel</span>
              </div>
              <p className="text-gray-700 mb-6 text-lg italic">
                "Les tests de coding automatisés nous permettent d'évaluer les compétences techniques de manière objective et efficace."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  S
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sophie Leroy</div>
                  <div className="text-gray-600">CTO, DevSolutions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Étude Comparative */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              RecruteIA vs la Concurrence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez pourquoi RecruteIA surpasse les autres solutions de recrutement IA du marché
            </p>
          </div>

          {/* Tableau comparatif */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-500 to-orange-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Fonctionnalités</th>
                    <th className="px-6 py-4 text-center font-semibold">
                      <div className="flex items-center justify-center">
                        <Brain className="h-5 w-5 mr-2" />
                        RecruteIA
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">HireVue</th>
                    <th className="px-6 py-4 text-center font-semibold">Codility</th>
                    <th className="px-6 py-4 text-center font-semibold">HackerRank</th>
                    <th className="px-6 py-4 text-center font-semibold">Workday</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">IA Analyse CV Automatique</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto" title="Partiel"></div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Tests Coding Avancés</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Entretien Vidéo IA</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto" title="Partiel"></div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Analyse Comportementale</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Automatisation Workflow</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto" title="Partiel"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto" title="Partiel"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Support Multi-langues</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto" title="Partiel"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-green-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Prix (par mois)</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-600">49€</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">89€</td>
                    <td className="px-6 py-4 text-center text-gray-600">75€</td>
                    <td className="px-6 py-4 text-center text-gray-600">99€</td>
                    <td className="px-6 py-4 text-center text-gray-600">120€</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Points forts de RecruteIA */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sécurité Avancée</h3>
              <p className="text-gray-600">
                Environnement Docker sécurisé pour l'exécution de code et conformité RGPD complète
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Déploiement Rapide</h3>
              <p className="text-gray-600">
                Mise en place en moins de 24h avec formation incluse et support dédié
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">ROI Prouvé</h3>
              <p className="text-gray-600">
                Retour sur investissement moyen de 300% en 6 mois grâce à l'optimisation des processus
              </p>
            </div>
          </div>

          {/* CTA Comparaison */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-green-500 to-orange-500 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Prêt à faire la différence ?</h3>
              <p className="text-lg mb-6 opacity-90">
                Découvrez pourquoi RecruteIA est le choix n°1 des entreprises innovantes
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/demo/features"
                  className="inline-flex items-center px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Comparer en live
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-green-600 transition-all"
                >
                  Demander une démo personnalisée
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA Final */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-orange-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à révolutionner vos recrutements ?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Rejoignez plus de 1,200 entreprises qui utilisent déjà RecruteIA pour optimiser leurs processus de recrutement
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-white text-green-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
            >
              Commencer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/demo/features"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white hover:text-green-600 transition-all"
            >
              <Play className="mr-2 h-5 w-5" />
              Voir les démos
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;