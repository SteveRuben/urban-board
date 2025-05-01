// frontend/pages/pricing.jsx
import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';

const PricingPage = () => {
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' ou 'annual'
  
  // Données des plans
  const plans = [
    {
      name: 'Starter',
      description: 'Parfait pour les petites entreprises et les startups',
      monthlyPrice: 49,
      annualPrice: 490, // 2 mois gratuits
      features: [
        'Jusqu\'à 10 entretiens par mois',
        'Analyse de CV basique',
        '1 poste configurable',
        'Rapports standards',
        'Email support'
      ],
      limitations: [
        'Pas d\'analyse biométrique',
        'Pas d\'intégration ATS',
        'Pas de questions personnalisées'
      ],
      cta: 'Démarrer gratuitement',
      ctaLink: '/auth/register?plan=starter',
      highlighted: false
    },
    {
      name: 'Pro',
      description: 'Idéal pour les entreprises en croissance',
      monthlyPrice: 149,
      annualPrice: 1490, // 2 mois gratuits
      features: [
        'Jusqu\'à 50 entretiens par mois',
        'Analyse de CV avancée',
        '5 postes configurables',
        'Questions personnalisées',
        'Rapports détaillés',
        'Analyse biométrique basique',
        'Support prioritaire'
      ],
      limitations: [
        'Intégration ATS limitée',
        'Pas d\'API personnalisée'
      ],
      cta: 'Essai gratuit de 14 jours',
      ctaLink: '/auth/register?plan=pro',
      highlighted: true
    },
    {
      name: 'Enterprise',
      description: 'Solution complète pour les grandes organisations',
      monthlyPrice: 499,
      annualPrice: 4990, // 2 mois gratuits
      features: [
        'Entretiens illimités',
        'Analyse de CV et de compétences avancée',
        'Postes illimités',
        'Questions personnalisées avancées',
        'Analyse biométrique complète',
        'Intégration ATS complète',
        'API dédiée',
        'Manager de compte dédié',
        'SLA garanti',
        'Formations incluses'
      ],
      limitations: [],
      cta: 'Contacter les ventes',
      ctaLink: '/contact?plan=enterprise',
      highlighted: false
    }
  ];

  return (
    <div className="bg-gray-50 py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
            Plans tarifaires pour tous vos besoins
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Choisissez le plan qui correspond à vos besoins. Tous nos plans incluent un accès à notre technologie d'intelligence artificielle de pointe.
          </p>
        </div>

        {/* Toggle de la période de facturation */}
        <div className="mt-12 flex justify-center">
          <div className="relative bg-white rounded-lg p-1 flex shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`relative py-2 px-6 text-sm font-medium rounded-md whitespace-nowrap focus:outline-none ${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-600 text-black'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`relative py-2 px-6 ml-0.5 text-sm font-medium rounded-md whitespace-nowrap focus:outline-none ${
                billingPeriod === 'annual'
                  ? 'bg-indigo-600 text-black'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Annuel
              <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans tarifaires */}
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-5xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-sm divide-y divide-gray-200 ${
                plan.highlighted ? 'border-2 border-indigo-500 ring-4 ring-indigo-100' : ''
              }`}
            >
              {plan.highlighted && (
                <div className="bg-indigo-500 py-1 text-center text-sm font-semibold text-black rounded-t-lg">
                  Le plus populaire
                </div>
              )}
              
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900">{plan.name}</h2>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                
                <p className="mt-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice}€
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    {billingPeriod === 'monthly' ? '/mois' : '/an'}
                  </span>
                </p>
                
                {billingPeriod === 'annual' && (
                  <p className="mt-1 text-sm text-green-600">
                    Économisez {plan.monthlyPrice * 12 - plan.annualPrice}€ par an
                  </p>
                )}
                
                <Link
                  href={user ? '/dashboard/billing' : plan.ctaLink}
                  className={`mt-6 block w-full py-3 px-4 rounded-md shadow text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    plan.highlighted
                      ? 'bg-indigo-600 text-black hover:bg-indigo-700'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  {user ? 'Changer de plan' : plan.cta}
                </Link>
              </div>
              
              <div className="px-6 pt-6 pb-8">
                <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                  Fonctionnalités incluses
                </h3>
                <ul className="mt-4 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-sm text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>
                
                {plan.limitations.length > 0 && (
                  <>
                    <h3 className="mt-6 text-sm font-semibold text-gray-900 tracking-wide uppercase">
                      Limitations
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-start">
                          <div className="flex-shrink-0">
                            <Info className="h-5 w-5 text-gray-400" />
                          </div>
                          <p className="ml-3 text-sm text-gray-500">{limitation}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* FAQ ou informations supplémentaires */}
        <div className="mt-16 bg-white rounded-lg shadow-sm overflow-hidden divide-y divide-gray-200 lg:mt-20">
          <div className="px-6 py-8 sm:p-10">
            <h3 className="text-lg font-medium text-gray-900">
              Vous avez des besoins spécifiques ?
            </h3>
            <div className="mt-4 text-sm text-gray-600">
              <p>
                Nous proposons également des solutions personnalisées pour les organisations avec des exigences particulières.
                Notre équipe peut vous aider à configurer une solution qui correspond parfaitement à vos processus de recrutement.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Contacter notre équipe
              </Link>
            </div>
          </div>
          
          <div className="px-6 py-8 sm:p-10">
            <h3 className="text-lg font-medium text-gray-900">
              Questions fréquentes
            </h3>
            <div className="mt-4 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Puis-je changer de plan après mon inscription ?
                </h4>
                <p className="mt-2 text-sm text-gray-600">
                  Oui, vous pouvez facilement mettre à niveau ou rétrograder votre plan à tout moment depuis votre tableau de bord.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Comment fonctionne l'essai gratuit ?
                </h4>
                <p className="mt-2 text-sm text-gray-600">
                  Nos essais gratuits vous donnent un accès complet au plan choisi pendant 14 jours. Aucune carte de crédit n'est requise pour commencer.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Quels moyens de paiement acceptez-vous ?
                </h4>
                <p className="mt-2 text-sm text-gray-600">
                  Nous acceptons toutes les cartes de crédit principales (Visa, Mastercard, American Express) ainsi que les virements bancaires pour les plans Enterprise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PricingPage.getLayout = (page) => <Layout>{page}</Layout>;
export default PricingPage;