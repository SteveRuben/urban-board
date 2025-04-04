// frontend/pages/notifications/settings.jsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  BellIcon, 
  ArrowLeftIcon, 
  CheckIcon,
  ExclamationCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  SpeakerWaveIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState({
    email: {
      interview_completed: true,
      interview_scheduled: true,
      candidate_application: true,
      job_position: false,
      biometric_analysis: false,
      collaboration: true,
      subscription_renewal: true,
      system: false
    },
    inApp: {
      interview_completed: true,
      interview_scheduled: true,
      candidate_application: true,
      job_position: true,
      biometric_analysis: true,
      collaboration: true,
      subscription_renewal: true,
      system: true
    },
    mobile: {
      interview_completed: true,
      interview_scheduled: true,
      candidate_application: true,
      job_position: false,
      biometric_analysis: false,
      collaboration: false,
      subscription_renewal: true,
      system: false
    },
    preferences: {
      emailDigest: 'daily', // 'realtime', 'daily', 'weekly', 'never'
      emailTime: '09:00',
      desktopNotifications: true,
      soundAlerts: false
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // En environnement de développement, utiliser des données fictives
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler un délai réseau
          // Les paramètres par défaut sont déjà définis dans l'état initial
        } else {
          // En production, appeler l'API
          const response = await axios.get('/api/notifications/settings');
          setSettings(response.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres de notification:', err);
        setError('Impossible de charger les paramètres. Veuillez réessayer.');
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [category]: {
        ...prevSettings[category],
        [setting]: value
      }
    }));
  };

  const handlePreferenceChange = (preference, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      preferences: {
        ...prevSettings.preferences,
        [preference]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      // En environnement de développement, simuler la sauvegarde
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simuler un délai réseau
      } else {
        // En production, appeler l'API
        await axios.put('/api/notifications/settings', settings);
      }
      
      setSaving(false);
      setSaveSuccess(true);
      
      // Cacher le message de succès après 3 secondes
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des paramètres:', err);
      setError('Impossible de sauvegarder les paramètres. Veuillez réessayer.');
      setSaving(false);
    }
  };

  // Obtenir le nom lisible pour le type de notification
  const getNotificationTypeName = (type) => {
    switch (type) {
      case 'interview_completed':
        return 'Entretiens terminés';
      case 'interview_scheduled':
        return 'Entretiens planifiés';
      case 'candidate_application':
        return 'Nouvelles candidatures';
      case 'subscription_renewal':
        return 'Abonnement et facturation';
      case 'job_position':
        return 'Changements de postes';
      case 'biometric_analysis':
        return 'Analyses biométriques';
      case 'collaboration':
        return 'Mentions et commentaires';
      case 'system':
        return 'Système et maintenance';
      default:
        return 'Autre';
    }
  };

  // Obtenir la description pour le type de notification
  const getNotificationTypeDescription = (type) => {
    switch (type) {
      case 'interview_completed':
        return 'Notifications lorsque les entretiens sont terminés et prêts à être analysés.';
      case 'interview_scheduled':
        return 'Rappels pour les entretiens à venir et changements de planification.';
      case 'candidate_application':
        return 'Alertes lorsque de nouveaux candidats postulent à vos offres.';
      case 'subscription_renewal':
        return 'Informations sur les paiements, renouvellements et changements de forfait.';
      case 'job_position':
        return 'Mises à jour concernant les postes (nouveaux, modifiés, fermés).';
      case 'biometric_analysis':
        return 'Résultats disponibles des analyses biométriques des entretiens.';
      case 'collaboration':
        return 'Notifications quand quelqu\'un vous mentionne ou commente vos entretiens.';
      case 'system':
        return 'Informations importantes sur le système, maintenance planifiée, mises à jour.';
      default:
        return '';
    }
  };

  const notificationTypes = [
    'interview_completed',
    'interview_scheduled',
    'candidate_application',
    'job_position',
    'biometric_analysis',
    'collaboration',
    'subscription_renewal',
    'system'
  ];

  return (
    <>
      <Head>
        <title>Paramètres de notification - RecruteIA</title>
        <meta name="description" content="Gérez vos préférences de notification" />
      </Head>

      <div className="bg-gray-50 py-6 min-h-screen">
        <div className="container mx-auto px-4">
          {/* En-tête */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <Link href="/notifications">
                <a className="mr-4 text-gray-500 hover:text-gray-700">
                  <ArrowLeftIcon className="h-5 w-5" />
                </a>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Paramètres de notification</h1>
            </div>
            <p className="text-gray-600 max-w-3xl">
              Personnalisez la façon dont vous recevez les notifications et leur fréquence. Les paramètres s'appliquent à tous les canaux (email, application, mobile).
            </p>
          </div>

          {loading ? (
            <div className="py-12 px-4 text-center bg-white shadow rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Chargement des paramètres...</p>
            </div>
          ) : (
            <>
              {/* Notification de succès */}
              {saveSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-500 mr-3" />
                  <div>
                    <p className="text-green-700 font-medium">Paramètres enregistrés avec succès</p>
                    <p className="text-green-600 text-sm">Vos préférences de notification ont été mises à jour.</p>
                  </div>
                </div>
              )}

              {/* Notification d'erreur */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                  <div>
                    <p className="text-red-700 font-medium">Erreur</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Préférences générales */}
              <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Préférences générales
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Configurez la fréquence et le mode de réception de vos notifications.
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6 space-y-6">
                  {/* Fréquence des emails */}
                  <div>
                    <label htmlFor="emailDigest" className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence des emails
                    </label>
                    <select
                      id="emailDigest"
                      name="emailDigest"
                      value={settings.preferences.emailDigest}
                      onChange={(e) => handlePreferenceChange('emailDigest', e.target.value)}
                      className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="realtime">En temps réel (pour chaque événement)</option>
                      <option value="daily">Résumé quotidien</option>
                      <option value="weekly">Résumé hebdomadaire</option>
                      <option value="never">Ne pas recevoir d'emails</option>
                    </select>
                  </div>

                  {/* Heure d'envoi du résumé */}
                  {(settings.preferences.emailDigest === 'daily' || settings.preferences.emailDigest === 'weekly') && (
                    <div>
                      <label htmlFor="emailTime" className="block text-sm font-medium text-gray-700 mb-2">
                        Heure d'envoi du résumé
                      </label>
                      <input
                        type="time"
                        id="emailTime"
                        name="emailTime"
                        value={settings.preferences.emailTime}
                        onChange={(e) => handlePreferenceChange('emailTime', e.target.value)}
                        className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                  )}

                  {/* Notifications de bureau */}
                  <div className="flex items-center">
                    <div className="flex items-center h-5">
                      <input
                        id="desktopNotifications"
                        name="desktopNotifications"
                        type="checkbox"
                        checked={settings.preferences.desktopNotifications}
                        onChange={(e) => handlePreferenceChange('desktopNotifications', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="desktopNotifications" className="font-medium text-gray-700">
                        Activer les notifications de bureau
                      </label>
                      <p className="text-gray-500">
                        Recevez des notifications de bureau lorsque l'application est ouverte dans votre navigateur.
                      </p>
                    </div>
                  </div>

                  {/* Alertes sonores */}
                  <div className="flex items-center">
                    <div className="flex items-center h-5">
                      <input
                        id="soundAlerts"
                        name="soundAlerts"
                        type="checkbox"
                        checked={settings.preferences.soundAlerts}
                        onChange={(e) => handlePreferenceChange('soundAlerts', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="soundAlerts" className="font-medium text-gray-700">
                        Activer les alertes sonores
                      </label>
                      <p className="text-gray-500">
                        Jouez un son lors de la réception de nouvelles notifications.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tableau des paramètres de notification */}
              <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <BellIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Types de notifications par canal
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Choisissez les types de notifications que vous souhaitez recevoir sur chaque canal.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type de notification
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex flex-col items-center">
                            <EnvelopeIcon className="h-5 w-5 mb-1" />
                            <span>Email</span>
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex flex-col items-center">
                            <BellIcon className="h-5 w-5 mb-1" />
                            <span>Application</span>
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex flex-col items-center">
                            <DevicePhoneMobileIcon className="h-5 w-5 mb-1" />
                            <span>Mobile</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {notificationTypes.map((type) => (
                        <tr key={type}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{getNotificationTypeName(type)}</div>
                              <div className="text-sm text-gray-500">{getNotificationTypeDescription(type)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={settings.email[type]}
                                onChange={(e) => handleSettingChange('email', type, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={settings.inApp[type]}
                                onChange={(e) => handleSettingChange('inApp', type, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={settings.mobile[type]}
                                onChange={(e) => handleSettingChange('mobile', type, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Boutons de sauvegarde */}
              <div className="flex justify-end space-x-3">
                <Link href="/notifications">
                  <a className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Annuler
                  </a>
                </Link>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer les modifications'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

NotificationSettingsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default NotificationSettingsPage;