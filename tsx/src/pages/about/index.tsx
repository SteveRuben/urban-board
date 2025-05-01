// components/index.tsx
import React, { ReactElement } from 'react';
import Image from 'next/image';
import { ArrowRight, Check, Users, Zap, Shield } from 'lucide-react';
import { NextPageWithLayout } from '@/types/page';
import Layout from '@/components/layout/layout';

const AboutUs: NextPageWithLayout = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-black">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Révolutionner le Recrutement avec l'Intelligence Artificielle</h1>
            <p className="text-xl opacity-90 mb-8">Nous redéfinissons le processus d'entretien pour le rendre plus efficace, objectif et adapté aux besoins des recruteurs modernes.</p>
          </div>
        </div>
      </section>

      {/* Notre Mission */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Notre Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                Chez RecruteIA, nous avons pour mission de transformer les processus de recrutement traditionnels grâce à la puissance de l'intelligence artificielle.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Nous croyons qu'en combinant la technologie de pointe avec l'expertise humaine, nous pouvons créer un système de recrutement plus juste, efficace et agréable pour toutes les parties concernées.
              </p>
              <p className="text-lg text-gray-600">
                Notre plateforme est conçue pour aider les recruteurs à identifier les meilleurs talents tout en offrant une expérience enrichissante aux candidats.
              </p>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/team-meeting.jpg"
                alt="L'équipe RecruteIA en réunion"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Nos Valeurs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Users className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Collaboration</h3>
              <p className="text-gray-600">
                Nous croyons que la meilleure approche du recrutement est une combinaison harmonieuse entre l'expertise humaine et l'intelligence artificielle.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="text-indigo-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Équité</h3>
              <p className="text-gray-600">
                Notre technologie est conçue pour réduire les biais inconscients et assurer que chaque candidat est évalué objectivement sur ses compétences et son potentiel.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Zap className="text-purple-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Innovation</h3>
              <p className="text-gray-600">
                Nous repoussons constamment les limites de ce qui est possible dans le domaine du recrutement assisté par IA, avec une recherche et un développement continus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Équipe */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Notre Équipe</h2>
          <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            RecruteIA est dirigée par une équipe passionnée d'experts en IA, développement logiciel et ressources humaines.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Membre 1 */}
            <div className="text-center">
              <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-4 relative">
                <Image
                  src="/images/ceo-portrait.jpg"
                  alt="Sophie Martin, CEO"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold">Sophie Martin</h3>
              <p className="text-blue-600 mb-3">CEO & Fondatrice</p>
              <p className="text-gray-600 max-w-sm mx-auto">
                Experte en IA avec 15 ans d'expérience, Sophie a fondé RecruteIA pour révolutionner le secteur du recrutement.
              </p>
            </div>
            
            {/* Membre 2 */}
            <div className="text-center">
              <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-4 relative">
                <Image
                  src="/images/cto-portrait.jpg"
                  alt="Thomas Dubois, CTO"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold">Thomas Dubois</h3>
              <p className="text-blue-600 mb-3">CTO</p>
              <p className="text-gray-600 max-w-sm mx-auto">
                Architecte logiciel passionné par les technologies émergentes, Thomas dirige le développement technique de notre plateforme.
              </p>
            </div>
            
            {/* Membre 3 */}
            <div className="text-center">
              <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-4 relative">
                <Image
                  src="/images/hr-director-portrait.jpg"
                  alt="Marie Laurent, Directrice RH"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold">Marie Laurent</h3>
              <p className="text-blue-600 mb-3">Directrice RH</p>
              <p className="text-gray-600 max-w-sm mx-auto">
                Avec 20 ans d'expérience en ressources humaines, Marie apporte une perspective essentielle à notre approche du recrutement.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <a href="/contact/careers" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800">
              Rejoignez notre équipe
              <ArrowRight size={16} className="ml-2" />
            </a>
          </div>
        </div>
      </section>
      
      {/* Avantages de RecruteIA */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Pourquoi Choisir RecruteIA</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="flex">
              <div className="flex-shrink-0 mt-1">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold mb-2">Deux Modes d'Entretien</h3>
                <p className="text-gray-600">
                  Notre plateforme offre à la fois un mode autonome où l'IA mène l'entretien et un mode collaboratif où elle assiste le recruteur.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 mt-1">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold mb-2">Analyse Biométrique</h3>
                <p className="text-gray-600">
                  Évaluez l'engagement et les réactions des candidats grâce à notre analyse avancée des expressions faciales.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 mt-1">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold mb-2">Assistants IA Personnalisables</h3>
                <p className="text-gray-600">
                  Configurez vos assistants IA pour qu'ils reflètent la culture et les exigences spécifiques de votre entreprise.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 mt-1">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold mb-2">Intégration Transparente</h3>
                <p className="text-gray-600">
                  Notre plateforme s'intègre facilement à vos systèmes existants de gestion des candidats et des ressources humaines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-indigo-700 to-purple-700 text-black">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à Transformer Votre Processus de Recrutement?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Découvrez comment RecruteIA peut vous aider à trouver les meilleurs talents plus rapidement et plus efficacement.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a href="/demo" className="px-8 py-3 bg-white text-indigo-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Demander une Démo
            </a>
            <a href="/contact" className="px-8 py-3 bg-transparent border-2 border-white font-medium rounded-lg hover:bg-white/10 transition-colors">
              Nous Contacter
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

AboutUs.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default AboutUs;