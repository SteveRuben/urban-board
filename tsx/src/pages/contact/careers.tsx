// components/Careers.tsx
import React, { ReactElement, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Briefcase, MapPin, Users, Coffee, Clock, Search } from 'lucide-react';
import { NextPageWithLayout } from '@/types/page';
import Layout from '@/components/layout/layout';

// Types pour les postes disponibles
interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string; // "Full-time", "Part-time", etc.
  description: string;
  requirements: string[];
  posted: string; // Date au format "DD/MM/YYYY"
}

const Careers: NextPageWithLayout = () => {
  // Liste des postes disponibles
  const [jobs, setJobs] = useState<JobPosition[]>([
    {
      id: 'ai-engineer',
      title: 'Ingénieur·e en IA',
      department: 'Technique',
      location: 'Paris, France',
      type: 'Temps plein',
      description: 'Nous recherchons un·e ingénieur·e en intelligence artificielle pour développer et améliorer nos algorithmes d\'entretien automatisé. Vous travaillerez sur des modèles de NLP avancés et des systèmes d\'analyse comportementale.',
      requirements: [
        'Master ou doctorat en informatique, IA ou domaine connexe',
        'Expérience avec les frameworks de deep learning (PyTorch, TensorFlow)',
        'Connaissance des techniques avancées de NLP',
        'Expérience en production de modèles d\'IA'
      ],
      posted: '15/04/2025'
    },
    {
      id: 'frontend-developer',
      title: 'Développeur·se Frontend',
      department: 'Technique',
      location: 'Paris, France',
      type: 'Temps plein',
      description: 'Rejoignez notre équipe pour créer des interfaces utilisateur exceptionnelles pour notre plateforme de recrutement. Vous collaborerez avec nos designers et ingénieurs backend pour développer des expériences utilisateur fluides et intuitives.',
      requirements: [
        'Expérience avec React et TypeScript',
        'Connaissance approfondie de Tailwind CSS',
        'Compréhension des principes de design UX',
        'Expérience avec Next.js est un plus'
      ],
      posted: '10/04/2025'
    },
    {
      id: 'hr-specialist',
      title: 'Spécialiste RH',
      department: 'Ressources Humaines',
      location: 'Remote / Télétravail',
      type: 'Temps plein',
      description: 'En tant que spécialiste RH, vous aiderez à façonner et améliorer nos produits d\'IA pour le recrutement en apportant votre expertise du domaine. Vous travaillerez en étroite collaboration avec l\'équipe produit pour garantir que nos solutions répondent aux besoins réels des professionnels du recrutement.',
      requirements: [
        'Minimum 5 ans d\'expérience en recrutement ou RH',
        'Excellente compréhension des processus de recrutement modernes',
        'Passion pour la technologie et l\'innovation',
        'Capacité à traduire les besoins RH en spécifications produit'
      ],
      posted: '05/04/2025'
    },
    {
      id: 'sales-manager',
      title: 'Responsable Commercial',
      department: 'Ventes',
      location: 'Lyon, France',
      type: 'Temps plein',
      description: 'Nous recherchons un·e responsable commercial·e pour développer notre portefeuille clients et promouvoir notre solution de recrutement par IA auprès des grandes entreprises et cabinets de recrutement.',
      requirements: [
        'Expérience commerciale B2B, idéalement dans le SaaS ou les solutions RH',
        'Excellentes compétences en négociation et présentation',
        'Compréhension du marché du recrutement et des RH',
        'Capacité à comprendre et expliquer des concepts techniques à des publics non techniques'
      ],
      posted: '01/04/2025'
    }
  ]);

  // État pour filtrer les postes
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Filtrer les postes en fonction de la recherche et du département
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === '' || job.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Liste des départements pour le filtre
  const departments = Array.from(new Set(jobs.map(job => job.department)));

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-black">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Rejoignez l'Avenir du Recrutement</h1>
            <p className="text-xl opacity-90 mb-8">
              Chez RecruteIA, nous construisons la prochaine génération d'outils de recrutement. Rejoignez notre équipe pour transformer la façon dont les entreprises trouvent leurs talents.
            </p>
          </div>
        </div>
      </section>
      {/* Pourquoi nous rejoindre */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/team-collaboration.jpg"
                alt="Équipe RecruteIA en collaboration"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Pourquoi Rejoindre RecruteIA</h2>
              <p className="text-lg text-gray-600 mb-6">
                Chez RecruteIA, vous aurez l'opportunité de travailler sur des technologies de pointe qui transforment une industrie entière. Nous combinons intelligence artificielle, expérience utilisateur exceptionnelle et expertise en ressources humaines pour créer des produits qui changent la façon dont les entreprises recrutent.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">Équipe Passionnée</h3>
                    <p className="text-gray-600 text-sm">Rejoignez des experts passionnés par la tech et l'innovation.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Coffee className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">Culture Inclusive</h3>
                    <p className="text-gray-600 text-sm">Environnement bienveillant où toutes les idées sont valorisées.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">Flexibilité</h3>
                    <p className="text-gray-600 text-sm">Horaires flexibles et options de télétravail partiel ou complet.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">Évolution</h3>
                    <p className="text-gray-600 text-sm">Opportunités d'apprentissage et de développement de carrière.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Avantages */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Nos Avantages</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Rémunération Attractive</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Salaires compétitifs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Programme d'intéressement et d'actions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Prime annuelle basée sur les performances</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Budget formation personnalisé</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Bien-être au Travail</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Horaires flexibles</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Télétravail partiel ou complet</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Congés illimités (avec minimum garanti)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Activités d'équipe régulières</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Environnement de Travail</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Bureaux modernes et bien équipés</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Équipement technologique de pointe</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Budget café et snacks illimités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Espaces de détente et de créativité</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      {/* Postes disponibles */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Postes Disponibles</h2>
          <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Explorez nos opportunités actuelles et rejoignez une équipe passionnée qui transforme l'industrie du recrutement.
          </p>
          
          {/* Filtres */}
          <div className="mb-10 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un poste..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">Tous les départements</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Liste des postes */}
          <div className="space-y-6 max-w-4xl mx-auto">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <div key={job.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:border-blue-300 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                      <p className="text-blue-600">{job.department}</p>
                    </div>
                    <div className="flex items-center mt-2 md:mt-0">
                      <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-gray-500 text-sm">{job.location}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <Briefcase className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-gray-500 text-sm">{job.type}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{job.description}</p>
                  
                  <h4 className="font-semibold mb-2">Compétences requises:</h4>
                  <ul className="mb-6 space-y-1">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="text-gray-600 text-sm">
                        • {req}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Publié le: {job.posted}
                    </p>
                    <a
                      href={`/careers/${job.id}`}
                      className="mt-3 sm:mt-0 inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                      >
                      Postuler
                      <ArrowRight size={16} className="ml-2" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Aucun poste ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Processus de recrutement */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Notre Processus de Recrutement</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/4 flex flex-col items-center mb-8 md:mb-0">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mb-4">1</div>
                <h3 className="text-lg font-semibold text-center mb-2">Candidature</h3>
                <p className="text-gray-600 text-center text-sm">Soumettez votre CV et une lettre de motivation.</p>
              </div>
              
              <div className="md:w-1/4 flex flex-col items-center mb-8 md:mb-0">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mb-4">2</div>
                <h3 className="text-lg font-semibold text-center mb-2">Premier Entretien</h3>
                <p className="text-gray-600 text-center text-sm">Discussion de 30 minutes avec notre équipe RH pour mieux vous connaître.</p>
              </div>
              
              <div className="md:w-1/4 flex flex-col items-center mb-8 md:mb-0">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mb-4">3</div>
                <h3 className="text-lg font-semibold text-center mb-2">Test Technique</h3>
                <p className="text-gray-600 text-center text-sm">Exercice pratique pertinent pour le poste (réalisé à votre rythme).</p>
              </div>
              
              <div className="md:w-1/4 flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mb-4">4</div>
                <h3 className="text-lg font-semibold text-center mb-2">Entretien Final</h3>
                <p className="text-gray-600 text-center text-sm">Rencontre avec l'équipe et discussion approfondie sur vos compétences.</p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-6">
                Notre processus de recrutement est conçu pour être rapide et transparent. Vous recevrez des retours à chaque étape, généralement dans un délai d'une semaine.
              </p>
              <p className="font-medium">
                Durée moyenne du processus : 2 à 3 semaines
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-indigo-700 to-purple-700 text-black">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Vous ne trouvez pas le poste idéal?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Nous sommes toujours à la recherche de talents exceptionnels. Envoyez-nous une candidature spontanée et dites-nous comment vous pourriez contribuer à notre mission.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a href="/contact" className="px-8 py-3 bg-white text-indigo-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Candidature Spontanée
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

Careers.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default Careers;