// frontend/pages/interviews/index.jsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import DashboardLayout from '../../components/layout/DashboardLayout';
import axios from 'axios';

const InterviewsIndexPage =() => {
  const router = useRouter();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Charger les entretiens depuis l'API
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        
        // En environnement de développement, utiliser des données factices
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 800)); // Simuler un délai réseau
          
          const mockInterviews = [
            {
              id: 'int-001',
              candidate_name: 'Thomas Dubois',
              job_role: 'Développeur Front-end',
              status: 'scheduled',
              scheduled_time: new Date(Date.now() + 86400000).toISOString(), // Demain
              created_at: new Date().toISOString()
            },
            {
              id: 'int-002',
              candidate_name: 'Sophie Martin',
              job_role: 'Développeur Backend',
              status: 'completed',
              completed_at: new Date(Date.now() - 172800000).toISOString(), // Il y a deux jours
              score: 8.5,
              created_at: new Date(Date.now() - 432000000).toISOString() // Il y a 5 jours
            },
            {
              id: 'int-003',
              candidate_name: 'Julien Petit',
              job_role: 'DevOps Engineer',
              status: 'in_progress',
              started_at: new Date(Date.now() - 3600000).toISOString(), // Il y a une heure
              created_at: new Date(Date.now() - 86400000).toISOString() // Hier
            },
            {
              id: 'int-004',
              candidate_name: 'Marie Leroy',
              job_role: 'UX Designer',
              status: 'completed',
              completed_at: new Date(Date.now() - 86400000).toISOString(), // Hier
              score: 7.2,
              created_at: new Date(Date.now() - 259200000).toISOString() // Il y a 3 jours
            },
            {
              id: 'int-005',
              candidate_name: 'Alexandre Moreau',
              job_role: 'Data Scientist',
              status: 'scheduled',
              scheduled_time: new Date(Date.now() + 172800000).toISOString(), // Dans 2 jours
              created_at: new Date(Date.now() - 43200000).toISOString() // Il y a 12 heures
            }
          ];
          
          setInterviews(mockInterviews);
        } else {
          // En production, appeler l'API réelle
          const response = await axios.get('/api/interviews');
          setInterviews(response.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des entretiens:', err);
        setError('Impossible de charger la liste des entretiens. Veuillez réessayer.');
        setLoading(false);
      }
    };
    
    fetchInterviews();
  }, []);

  // Filtrer les entretiens en fonction de la recherche et du filtre de statut
  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          interview.job_role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Formatter une date pour l'affichage
  const formatDate = (dateString) => {
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Planifié
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            En cours
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Terminé
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Annulé
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <Layout>
      <Head>
        <title>Entretiens - RecruteIA</title>
        <meta name="description" content="Gérez vos entretiens assistés par IA" />
      </Head>

      <div className="bg-gray-50 py-8 min-h-screen">
        <div className="container mx-auto px-4">
          {/* En-tête de la page */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Entretiens</h1>
              <p className="text-gray-600">Gérez vos entretiens assistés par l'IA</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link 
                href="/interviews/new" 
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvel entretien
              </Link>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              {/* Recherche */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Rechercher par nom ou poste..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Filtre par statut */}
              <div className="w-full md:w-64">
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="scheduled">Planifiés</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminés</option>
                  <option value="cancelled">Annulés</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des entretiens */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-2"></div>
              <p className="text-gray-600">Chargement des entretiens...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              {searchTerm || statusFilter !== 'all' ? (
                <>
                  <p className="text-gray-600 mb-2">Aucun entretien ne correspond à votre recherche.</p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Réinitialiser les filtres
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">Vous n'avez pas encore d'entretiens.</p>
                  <Link 
                    href="/interviews/new" 
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Créer votre premier entretien
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidat
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poste
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      {statusFilter === 'completed' || statusFilter === 'all' ? (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                      ) : null}
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInterviews.map((interview) => (
                      <tr 
                        key={interview.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/interviews/${interview.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{interview.candidate_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{interview.job_role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(interview.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {interview.status === 'scheduled' && interview.scheduled_time ? 
                            formatDate(interview.scheduled_time) :
                            interview.status === 'completed' && interview.completed_at ?
                            formatDate(interview.completed_at) :
                            interview.status === 'in_progress' && interview.started_at ?
                            formatDate(interview.started_at) :
                            formatDate(interview.created_at)
                          }
                        </td>
                        {(statusFilter === 'completed' || statusFilter === 'all') && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {interview.status === 'completed' && interview.score ? (
                              <div className="flex items-center">
                                <span className={`text-sm font-medium ${
                                  interview.score >= 8 ? 'text-green-600' :
                                  interview.score >= 6 ? 'text-blue-600' :
                                  'text-yellow-600'
                                }`}>
                                  {interview.score.toFixed(1)}/10
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/interviews/${interview.id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Voir
                            </Link>
                            {interview.status === 'scheduled' && (
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Logique pour annuler l'entretien
                                  alert('Fonctionnalité à implémenter: Annuler l\'entretien');
                                }}
                              >
                                Annuler
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

InterviewsIndexPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default InterviewsIndexPage;