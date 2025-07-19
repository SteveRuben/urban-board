// Page de démonstration principale des fonctionnalités
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Brain, 
  Code, 
  BarChart3, 
  Users, 
  ArrowRight, 
  Play, 
  Star, 
  CheckCircle,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const FeaturesDemo = () => {
  const demoFeatures = [
    {
      id: 'dashboard',
      title: 'Dashboard Intelligent',
      description: 'Tableau de bord avec analytics en temps réel, alertes intelligentes et métriques de performance.',
      icon: BarChart3,
      color: 'from-blue-500 to-indigo-600',
      href: '/demo/dashboard',
      features: ['Analytics temps réel', 'Alertes intelligentes', 'Métriques avancées', 'Rapports personnalisés'],
      badge: 'Populaire'
    },
    {
      id: 'cv-analysis',
      title: 'Analyse CV par IA',
      description: 'Analyse automatique des CV avec scoring intelligent et génération de questions d\'entretien.',
      icon: Brain,
      color: 'from-green-500 to-emerald-600',
      href: '/demo/cv-analysis',
      features: ['Analyse sémantique', 'Score d\'adéquation', 'Questions personnalisées', 'Insights détaillés'],
      badge: 'IA Avancée'
    },
    {
      id: 'coding-platform',
      title: 'Plateforme de Coding',
      description: 'Évaluation technique interactive avec exercices de programmation et correction automatique.',
      icon: Code,
      color: 'from-purple-500 to-pink-600',
      href: '/demo/coding-platform',
      features: ['150+ exercices', '5 langages', 'Tests automatisés', 'Rapports détaillés'],
      badge: 'Technique'
    },
    {
      id: 'ai-interview',
      title: 'Entretiens IA',
      description: 'Entretiens autonomes ou assistés par IA avec analyse comportementale en temps réel.',
      icon: Users,
      color: 'from-orange-500 to-red-600',
      href: '/demo',
      features: ['Mode autonome', 'Assistance IA', 'Analyse comportementale', 'Métriques de stress'],
      badge: 'Innovant'
    }
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "RH Manager chez TechCorp",
      content: "RecruteIA a révolutionné notre processus de recrutement. Nous avons réduit le temps de sélection de 60% tout en améliorant la qualité des candidats.",
      rating: 5
    },
    {
      name: "Pierre Martin",
      role: "CEO chez StartupInnovante",
      content: "L'analyse IA des CV nous fait gagner un temps précieux. Les questions d'entretien générées sont pertinentes et nous aident à mieux évaluer les candidats.",
      rating: 5
    },
    {
      name: "Sophie Laurent",
      role: "Tech Lead chez DevCompany",
      content: "La plateforme de coding est excellente pour évaluer les compétences techniques. Les exercices sont variés et l'interface est intuitive.",
      rating: 5
    }
  ];

  const stats = [
    { label: "Entreprises actives", value: "1,200+" },
    { label: "Entretiens réalisés", value: "50,000+" },
    { label: "Temps économisé", value: "60%" },
    { label: "Satisfaction client", value: "98%" }
  ];

  return (
    <>
      <Head>
        <title>Démonstrations RecruteIA - Découvrez nos fonctionnalités</title>
        <meta name="description" content="Explorez toutes les fonctionnalités de RecruteIA : dashboard intelligent, analyse CV par IA, plateforme de coding. Essais gratuits disponibles." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Découvrez RecruteIA
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  en action
                </span>
              </h1>
              <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
                Explorez nos démonstrations interactives et découvrez comment l'intelligence artificielle 
                peut transformer votre processus de recrutement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="#demos"
                  className="inline-flex items-center px-8 py-3 bg-white text-indigo-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Voir les démos
                </Link>
                <Link 
                  href="/auth/register"
                  className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-900 transition-colors"
                >
                  Essai gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-indigo-600 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demos Section */}
        <div id="demos" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Démonstrations interactives
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Testez nos fonctionnalités principales avec des données réelles et découvrez 
                la puissance de l'IA appliquée au recrutement.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {demoFeatures.map((feature) => (
                <div key={feature.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Header avec gradient */}
                  <div className={`bg-gradient-to-r ${feature.color} p-6 text-white relative`}>
                    <div className="flex items-center justify-between mb-4">
                      <feature.icon className="h-8 w-8" />
                      {feature.badge && (
                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                          {feature.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-white text-opacity-90">{feature.description}</p>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <ul className="space-y-2 mb-6">
                      {feature.features.map((item, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    
                    <Link
                      href={feature.href}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Essayer la démo
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Pourquoi choisir RecruteIA ?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapidité</h3>
                <p className="text-gray-600">
                  Réduisez le temps de sélection de 60% grâce à l'automatisation intelligente
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Précision</h3>
                <p className="text-gray-600">
                  IA avancée pour une évaluation objective et des recommandations pertinentes
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance</h3>
                <p className="text-gray-600">
                  Améliorez la qualité de vos recrutements avec des insights data-driven
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ce que disent nos clients
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à transformer vos recrutements ?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Rejoignez plus de 1,200 entreprises qui font confiance à RecruteIA pour optimiser leurs processus de recrutement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register"
                className="inline-flex items-center px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/contact"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors"
              >
                Demander une démo personnalisée
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default FeaturesDemo;