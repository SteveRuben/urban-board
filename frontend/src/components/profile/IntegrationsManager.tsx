// components/profile/IntegrationsManager.tsx
import React, { useState, useEffect } from 'react';
import IntegrationsCard from './IntegrationsCard';
import { useAuth } from '@/provider/auth';

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  connectionDate: string | null;
  icon: string;
}

const IntegrationsManager: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [processingAction, setProcessingAction] = useState(false);
  let token = localStorage.getItem("AccesToekn"); 
  
  // Récupérer la liste des intégrations
  const fetchIntegrations = async () => {
    setProcessingAction(true);
    try {
      const response = await fetch('/api/integrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch integrations');
      
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Gérer la connexion d'une intégration
  const handleConnectIntegration = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    
    if (!integration) return;
    
    setProcessingAction(true);
    
    try {
      if (integration.connected) {
        // Déconnecter l'intégration
        const response = await fetch(`/api/integrations/${integrationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to disconnect integration');
        
        // Mettre à jour l'état local
        fetchIntegrations();
      } else {
        // Connecter l'intégration
        const response = await fetch(`/api/integrations/${integrationId}/auth-url`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to get auth URL');
        
        const { authUrl } = await response.json();
        
        // Ouvrir la popup d'authentification
        const width = 600, height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const popup = window.open(
          authUrl,
          `${integrationId}_auth`,
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        // Configurer un écouteur d'événements pour la communication avec la popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'INTEGRATION_CONNECTED' && 
              event.data.integrationId === integrationId &&
              event.data.success) {
            // Mettre à jour la liste des intégrations
            fetchIntegrations();
            
            // Nettoyer l'écouteur d'événements
            window.removeEventListener('message', messageListener);
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Vérifier périodiquement si la popup est fermée
        const checkPopupClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopupClosed);
            window.removeEventListener('message', messageListener);
            setProcessingAction(false);
          }
        }, 500);
      }
    } catch (error) {
      console.error(`Error handling integration ${integrationId}:`, error);
      setProcessingAction(false);
    }
  };
  
  // Charger les intégrations au montage du composant
  useEffect(() => {
    fetchIntegrations();
  }, []);
  
  return (
    <IntegrationsCard 
      integrations={integrations}
      processingAction={processingAction}
      onConnectIntegration={handleConnectIntegration}
    />
  );
};

export default IntegrationsManager;