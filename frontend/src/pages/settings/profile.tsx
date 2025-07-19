// frontend/pages/dashboard/profile.tsx
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import { UserService } from '@/services/user-service';
import DashboardLayout from '@/components/layout/dashboard-layout';

// Composants
import PersonalInfoCard from '@/components/profile/PersonalInfoCard';
import SecurityCard from '@/components/profile/SecurityCard';
import NotificationPreferencesCard from '@/components/profile/NotificationPreferencesCard';
import IntegrationsCard from '@/components/profile/IntegrationsCard';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import TwoFactorAuthModal from '@/components/profile/TwoFactorAuthModal';
import { useAuth } from '@/provider/auth';
import { useNotification } from '@/provider/toast';
import { ConfirmAction, Integration, NotificationPreferences, PasswordForm, 
  PersonalInfo, SecurityInfo, TwoFactorSetupData, TwoFactorSetupState } from '@/types';



const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState<boolean>(true);
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  
  // États pour les informations personnelles
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    company: '',
    phone: '',
    avatarUrl: ''
  });
  const [editingPersonalInfo, setEditingPersonalInfo] = useState<boolean>(false);
  
  // États pour la sécurité
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo>({
    lastPasswordChange: null,
    twoFactorEnabled: false,
    twoFactorMethod: null,
    loginHistory: []
  });
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState<boolean>(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showTwoFactorModal, setShowTwoFactorModal] = useState<boolean>(false);
  const [twoFactorSetupState, setTwoFactorSetupState] = useState<TwoFactorSetupState>('idle');
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<TwoFactorSetupData | null>(null);
  const [twoFactorVerificationCode, setTwoFactorVerificationCode] = useState<string>('');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  // États pour les préférences de notification
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    email: {
      newMessages: true,
      interviewReminders: true,
      weeklyReports: true,
      marketingEmails: false
    },
    push: {
      newMessages: true,
      interviewReminders: true,
      candidateUpdates: true,
      teamNotifications: true
    },
    desktop: {
      newMessages: true,
      interviewReminders: true,
      candidateUpdates: false,
      teamNotifications: true
    }
  });

  // États pour les intégrations

 useEffect(() => {
  const loadIntegrations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/integrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      setIntegrations(data);
    } catch (error) {
      console.error('Erreur chargement intégrations:', error);
    }
  };


  loadIntegrations();
  
}, []);

/*     { 
      id: 'calendar',
      name: 'Google Calendar',
      connected: false,
      connectionDate: null,
      icon: '/icons/google-calendar.svg'
    },
    { 
      id: 'microsoft',
      name: 'Microsoft 365',
      connected: false,
      connectionDate: null,
      icon: '/icons/microsoft-365.svg'
    },
    { 
      id: 'ats',
      name: 'Lever ATS',
      connected: false,
      connectionDate: null,
      icon: '/icons/lever.svg'
    },
    { 
      id: 'slack',
      name: 'Slack',
      connected: false,
      connectionDate: null,
      icon: '/icons/slack.svg'
    }
  ]); */
  
  // État pour les modaux de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>({
    title: '',
    message: '',
    confirmButtonText: '',
    cancelButtonText: '',
    onConfirm: async () => {}
  });
  
  // Charger les données de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Charger les informations de profil
        const profileData = await UserService.getProfile();
        
        // Mettre à jour les informations personnelles
        setPersonalInfo({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          email: profileData.email || '',
          jobTitle: profileData.job_title || '',
          company: profileData.company || '',
          phone: profileData.phone || '',
          avatarUrl: profileData.avatar_url || ''
        });
        
        // Mettre à jour les informations de sécurité
        setSecurityInfo({
          lastPasswordChange: profileData.last_password_change || null,
          twoFactorEnabled: profileData.two_factor_enabled || false,
          twoFactorMethod: profileData.two_factor_method || null,
          loginHistory: profileData.login_history || []
        });
        
        // Mettre à jour les préférences de notification
        if (profileData.notification_preferences) {
          setNotificationPreferences(profileData.notification_preferences);
        }
        
        // Mettre à jour les intégrations
        if (profileData.integrations && profileData.integrations.length > 0) {
          const updatedIntegrations = [...integrations];
          profileData.integrations.forEach((integration: any) => {
            const index = updatedIntegrations.findIndex(i => i.id === integration.id);
            if (index !== -1) {
              updatedIntegrations[index] = {
                ...updatedIntegrations[index],
                connected: integration.connected,
                connectionDate: integration.connected_at
              };
            }
          });
          setIntegrations(updatedIntegrations);
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des données du profil:', error);
        showToast('error', 'Impossible de charger vos informations de profil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [showToast]);

  // Gestion des informations personnelles
  const handlePersonalInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo({
      ...personalInfo,
      [name]: value
    });
  };

  const handleEditPersonalInfo = () => {
    setEditingPersonalInfo(true);
  };

  const handleCancelEditPersonalInfo = () => {
    // Recharger les informations d'origine
    setPersonalInfo({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      jobTitle: user?.jobTitle || '',
      company: user?.company || '',
      phone: user?.phone || '',
      avatarUrl: user?.avatarUrl || ''
    });
    setEditingPersonalInfo(false);
  };

  const handleSavePersonalInfo = async () => {
    setProcessingAction(true);
    
    try {
      const updatedProfile = await UserService.updateProfile({
        first_name: personalInfo.firstName,
        last_name: personalInfo.lastName,
        email: personalInfo.email,
        job_title: personalInfo.jobTitle,
        company: personalInfo.company,
        phone: personalInfo.phone
      });
      
      // Mettre à jour le contexte utilisateur
      updateUser({
        ...user,
        firstName: updatedProfile.first_name,
        lastName: updatedProfile.last_name,
        email: updatedProfile.email,
        jobTitle: updatedProfile.job_title,
        company: updatedProfile.company,
        phone: updatedProfile.phone,
        avatarUrl: updatedProfile.avatar_url
      });
      
      setEditingPersonalInfo(false);
      showToast('success', 'Informations personnelles mises à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      showToast('error', 'Erreur lors de la mise à jour de vos informations: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingAction(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    setProcessingAction(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const updatedProfile = await UserService.updateAvatar(formData);
      
      // Mettre à jour l'état local
      setPersonalInfo({
        ...personalInfo,
        avatarUrl: updatedProfile.avatar_url
      });
      
      // Mettre à jour le contexte utilisateur
      updateUser({
        ...user,
        avatarUrl: updatedProfile.avatar_url
      });
      
      showToast('success', 'Photo de profil mise à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'avatar:', error);
      showToast('error', 'Erreur lors de la mise à jour de votre photo: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingAction(false);
    }
  };

  // Gestion de la sécurité
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation de base
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      showToast('error', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setProcessingAction(true);
    
    try {
      await UserService.updatePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      
      // Mettre à jour l'état
      setSecurityInfo({
        ...securityInfo,
        lastPasswordChange: new Date().toISOString()
      });
      
      // Réinitialiser le formulaire
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setShowPasswordChangeForm(false);
      showToast('success', 'Mot de passe mis à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      showToast('error', 'Erreur lors de la mise à jour du mot de passe: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingAction(false);
    }
  };

  const handleShowTwoFactorSetup = async () => {
    setProcessingAction(true);
    
    try {
      // Si déjà activé, on veut le désactiver
      if (securityInfo.twoFactorEnabled) {
        setConfirmAction({
          title: 'Désactiver l\'authentification à deux facteurs',
          message: 'Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs ? Cela réduira la sécurité de votre compte.',
          confirmButtonText: 'Désactiver',
          cancelButtonText: 'Annuler',
          onConfirm: async () => {
            try {
              await UserService.disableTwoFactor();
              
              setSecurityInfo({
                ...securityInfo,
                twoFactorEnabled: false,
                twoFactorMethod: null
              });
              
              showToast('success', 'Authentification à deux facteurs désactivée');
            } catch (error: any) {
              console.error('Erreur lors de la désactivation de l\'authentification à deux facteurs:', error);
              showToast('error', 'Erreur: ' + (error.response?.data?.message || error.message));
            }
          }
        });
        setShowConfirmModal(true);
      } else {
        // Récupérer les données de configuration
        const setupData = await UserService.initTwoFactorSetup();
        
        setTwoFactorSetupData(setupData);
        setTwoFactorSetupState('setup');
        setShowTwoFactorModal(true);
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'initialisation de l\'authentification à deux facteurs:', error);
      showToast('error', 'Erreur: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingAction(false);
    }
  };

  const handleTwoFactorMethodChange = (method: 'app' | 'sms' | 'email') => {
    if (twoFactorSetupData) {
      setTwoFactorSetupData({
        ...twoFactorSetupData,
        method
      });
    }
  };

  const handleTwoFactorVerificationSubmit = async () => {
    if (!twoFactorSetupData) return;
    
    setProcessingAction(true);
    
    try {
      // Envoyer le code de vérification
      await UserService.verifyTwoFactor({
        method: twoFactorSetupData.method,
        code: twoFactorVerificationCode
      });
      
      // Mettre à jour l'état
      setSecurityInfo({
        ...securityInfo,
        twoFactorEnabled: true,
        twoFactorMethod: twoFactorSetupData.method
      });
      
      // Réinitialiser
      setTwoFactorSetupState('idle');
      setTwoFactorSetupData(null);
      setTwoFactorVerificationCode('');
      setShowTwoFactorModal(false);
      
      showToast('success', 'Authentification à deux facteurs activée avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la vérification du code:', error);
      showToast('error', 'Code incorrect ou erreur lors de la vérification: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingAction(false);
    }
  };

  const handleTwoFactorSetupCancel = () => {
    setTwoFactorSetupState('idle');
    setTwoFactorSetupData(null);
    setTwoFactorVerificationCode('');
    setShowTwoFactorModal(false);
  };
  
  // Gestion des préférences de notification
  const handleNotificationPreferenceChange = (category: keyof NotificationPreferences, type: string, checked: boolean) => {
    setNotificationPreferences({
      ...notificationPreferences,
      [category]: {
        ...notificationPreferences[category],
        [type]: checked
      }
    });
  };

  const handleSaveNotificationPreferences = async () => {
    setProcessingAction(true);
    
    try {
      await UserService.updateNotificationPreferences(notificationPreferences);
      showToast('success', 'Préférences de notification mises à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des préférences de notification:', error);
      showToast('error', 'Erreur: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingAction(false);
    }
  };

  // Gestion des intégrations
  const handleConnectIntegration = async (integrationId: string) => {
    setProcessingAction(true);
    
    try {
      // Vérifier si l'intégration est déjà connectée
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        throw new Error('Intégration non trouvée');
      }
      
      if (integration.connected) {
        // Si connectée, on veut déconnecter
        setConfirmAction({
          title: `Déconnecter ${integration.name}`,
          message: `Êtes-vous sûr de vouloir déconnecter ${integration.name} ? Toutes les synchronisations automatiques seront arrêtées.`,
          confirmButtonText: 'Déconnecter',
          cancelButtonText: 'Annuler',
          onConfirm: async () => {
            try {
              await UserService.disconnectIntegration(integrationId);
              
              // Mettre à jour l'état local
              setIntegrations(integrations.map(i => 
                i.id === integrationId 
                  ? {...i, connected: false, connectionDate: null} 
                  : i
              ));
              
              showToast('success', `${integration.name} a été déconnecté`);
            } catch (error: any) {
              console.error('Erreur lors de la déconnexion:', error);
              showToast('error', 'Erreur: ' + (error.response?.data?.message || error.message));
            }
          }
        });
        setShowConfirmModal(true);
      } else {
        // Si non connectée, on veut connecter
        // Typiquement, cela redirige vers une page d'authentification OAuth
        const authUrl = await UserService.getIntegrationAuthUrl(integrationId);
        
        // Ouvrir dans une nouvelle fenêtre
        window.open(authUrl, '_blank', 'width=600,height=600');
        
        // Écouter le message de retour (après authentification réussie)
        const handleMessage = (event: MessageEvent) => {
          if (event.data && event.data.type === 'INTEGRATION_CONNECTED' && event.data.integrationId === integrationId) {
            // Mettre à jour l'état local
            setIntegrations(integrations.map(i => 
              i.id === integrationId 
                ? {...i, connected: true, connectionDate: new Date().toISOString()} 
                : i
            ));
            
            showToast('success', `${integration.name} a été connecté avec succès`);
            window.removeEventListener('message', handleMessage);
          }
        };
        
        window.addEventListener('message', handleMessage);
      }
    } catch (error: any) {
      console.error('Erreur lors de la gestion de l\'intégration:', error);
      showToast('error', 'Erreur: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Profil utilisateur</h1>
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Profil utilisateur</h1>
        
        {/* Informations personnelles */}
        <PersonalInfoCard 
          personalInfo={personalInfo}
          editingPersonalInfo={editingPersonalInfo}
          processingAction={processingAction}
          onPersonalInfoChange={handlePersonalInfoChange}
          onEditPersonalInfo={handleEditPersonalInfo}
          onCancelEditPersonalInfo={handleCancelEditPersonalInfo}
          onSavePersonalInfo={handleSavePersonalInfo}
          onAvatarChange={handleAvatarChange}
        />
        
        {/* Sécurité */}
        <SecurityCard 
          securityInfo={securityInfo}
          showPasswordChangeForm={showPasswordChangeForm}
          passwordForm={passwordForm}
          processingAction={processingAction}
          onTogglePasswordForm={() => setShowPasswordChangeForm(!showPasswordChangeForm)}
          onPasswordChange={handlePasswordChange}
          onUpdatePassword={handleUpdatePassword}
          onShowTwoFactorSetup={handleShowTwoFactorSetup}
        />
        
        {/* Préférences de notification */}
        <NotificationPreferencesCard 
          notificationPreferences={notificationPreferences}
          processingAction={processingAction}
          onNotificationPreferenceChange={handleNotificationPreferenceChange}
          onSaveNotificationPreferences={handleSaveNotificationPreferences}
        />
        
        {/* Intégrations */}
        <IntegrationsCard 
          integrations={integrations}
          processingAction={processingAction}
          onConnectIntegration={handleConnectIntegration}
        />

        {/* Modaux */}
        {showConfirmModal && (
          <ConfirmActionModal 
            title={confirmAction.title}
            message={confirmAction.message}
            confirmButtonText={confirmAction.confirmButtonText}
            cancelButtonText={confirmAction.cancelButtonText}
            onConfirm={() => {
              confirmAction.onConfirm();
              setShowConfirmModal(false);
            }}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}

        {showTwoFactorModal && (
          <TwoFactorAuthModal 
            setupState={twoFactorSetupState}
            setupData={twoFactorSetupData}
            verificationCode={twoFactorVerificationCode}
            processingAction={processingAction}
            onMethodChange={handleTwoFactorMethodChange}
            onVerificationCodeChange={setTwoFactorVerificationCode}
            onVerificationSubmit={handleTwoFactorVerificationSubmit}
            onCancel={handleTwoFactorSetupCancel}
          />
        )}
      </div>
    </div>
  );
};

ProfilePage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
export default ProfilePage;