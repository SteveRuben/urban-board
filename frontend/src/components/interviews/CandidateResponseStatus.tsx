// tsx/src/components/interviews/CandidateResponseStatus.tsx

import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail,
  Eye,
  RefreshCw,
  Info 
} from 'lucide-react';
import { InterviewSchedule } from '../../types/interview-scheduling';
import { InterviewSchedulingService } from '../../services/interview-scheduling-service';
import EmailPreviewModal from './EmailPreviewModal';

interface CandidateResponseStatusProps {
  schedule: InterviewSchedule;
  onStatusUpdate?: (schedule: InterviewSchedule) => void;
  showActions?: boolean;
  compact?: boolean;
}

// Composant Badge personnalisé
const Badge: React.FC<{
  status: 'success' | 'error' | 'processing' | 'default';
  icon?: React.ReactNode;
  text: string;
  style?: React.CSSProperties;
}> = ({ status, icon, text, style }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      case 'processing': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  return (
    <span style={{ display: 'flex', alignItems: 'center', ...style }}>
      <span 
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: getStatusColor(),
          marginRight: 8,
          display: 'inline-block'
        }}
      />
      {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
      <span>{text}</span>
    </span>
  );
};

// Composant Button personnalisé
const Button: React.FC<{
  size?: 'small' | 'default';
  icon?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  type?: 'primary' | 'default';
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ size = 'default', icon, onClick, loading, type = 'default', style, children }) => {
  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: type === 'primary' ? 'none' : '1px solid #d9d9d9',
    borderRadius: 6,
    backgroundColor: type === 'primary' ? '#1890ff' : '#fff',
    color: type === 'primary' ? '#fff' : '#000',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    fontSize: size === 'small' ? '12px' : '14px',
    padding: size === 'small' ? '4px 8px' : '6px 12px',
    transition: 'all 0.2s',
    ...style
  };

  return (
    <button
      style={buttonStyle}
      onClick={loading ? undefined : onClick}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.opacity = '1';
        }
      }}
    >
      {loading ? (
        <RefreshCw size={size === 'small' ? 12 : 14} style={{ marginRight: children ? 6 : 0, animation: 'spin 1s linear infinite' }} />
      ) : (
        icon && <span style={{ marginRight: children ? 6 : 0 }}>{icon}</span>
      )}
      {children}
    </button>
  );
};

// Composant Card personnalisé
const Card: React.FC<{
  size?: 'small' | 'default';
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ size = 'default', title, extra, children }) => {
  return (
    <div style={{
      border: '1px solid #f0f0f0',
      borderRadius: 8,
      backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      {title && (
        <div style={{
          padding: size === 'small' ? '8px 16px' : '12px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 500
        }}>
          <div>{title}</div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div style={{
        padding: size === 'small' ? '12px 16px' : '16px 20px'
      }}>
        {children}
      </div>
    </div>
  );
};

// Composant Tooltip personnalisé
const Tooltip: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.75)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          marginBottom: 5
        }}>
          {title}
        </div>
      )}
    </div>
  );
};

// Fonction pour afficher les messages
const showMessage = {
  success: (content: string) => {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      color: #52c41a;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-size: 14px;
    `;
    notification.textContent = content;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  },
  error: (content: string) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fff2f0;
      border: 1px solid #ffccc7;
      color: #ff4d4f;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-size: 14px;
    `;
    notification.textContent = content;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }
};

export const CandidateResponseStatus: React.FC<CandidateResponseStatusProps> = ({
  schedule,
  onStatusUpdate,
  showActions = true,
  compact = false
}) => {
  const [loading, setLoading] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState<string>('');

  // Déterminer le statut de réponse candidat
  const getCandidateResponseStatus = () => {
    if (schedule.was_confirmed_by_candidate) {
      return {
        status: 'confirmed' as const,
        icon: <CheckCircle size={16} />,
        color: 'success' as const,
        text: 'Confirmé par le candidat',
        description: schedule.candidate_response_date 
          ? `Confirmé le ${new Date(schedule.candidate_response_date).toLocaleDateString('fr-FR')} à ${new Date(schedule.candidate_response_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Confirmé par le candidat'
      };
    }
    
    if (schedule.was_canceled_by_candidate) {
      return {
        status: 'canceled' as const,
        icon: <XCircle size={16} />,
        color: 'error' as const,
        text: 'Annulé par le candidat',
        description: schedule.cancellation_reason || 'Annulé par le candidat',
        fullDescription: schedule.candidate_response_date 
          ? `Annulé le ${new Date(schedule.candidate_response_date).toLocaleDateString('fr-FR')} à ${new Date(schedule.candidate_response_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Annulé par le candidat'
      };
    }
    
    // Vérifier si le candidat peut encore répondre
    const canRespond = schedule.can_candidate_respond?.can_respond || false;
    const responseReason = schedule.can_candidate_respond?.reason || '';
    
    return {
      status: 'pending' as const,
      icon: <Clock size={16} />,
      color: (canRespond ? 'processing' : 'default') as const,
      text: canRespond ? 'En attente de réponse' : 'Plus de réponse possible',
      description: canRespond ? 'Le candidat peut encore confirmer ou annuler' : responseReason
    };
  };

  const statusInfo = getCandidateResponseStatus();

  // Renvoyer l'invitation
  const handleResendInvitation = async () => {
    try {
      setLoading(true);
      await InterviewSchedulingService.resendInvitation(schedule.id);
      showMessage.success('Invitation renvoyée avec succès !');
      
      // Rafraîchir les données
      if (onStatusUpdate) {
        const updatedSchedule = await InterviewSchedulingService.getSchedule(schedule.id);
        onStatusUpdate(updatedSchedule);
      }
    } catch (error: any) {
      showMessage.error(`Erreur lors du renvoi : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Aperçu de l'email
  const handleEmailPreview = async () => {
    try {
      setLoading(true);
      const preview = await InterviewSchedulingService.getEmailPreview(schedule.id);
      setEmailPreview(preview);
      setShowEmailPreview(true);
    } catch (error: any) {
      showMessage.error(`Erreur aperçu email : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Version compacte (pour les listes)
  if (compact) {
    return (
      <Tooltip title={statusInfo.description}>
        <Badge 
          status={statusInfo.color} 
          text={statusInfo.text}
          style={{ cursor: 'pointer' }}
        />
      </Tooltip>
    );
  }

  // Version complète (pour les détails)
  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <Card 
        size="small" 
        title={
          <span>
            <Mail size={16} style={{ marginRight: 8 }} />
            Réponse du candidat
          </span>
        }
        extra={
          showActions && (
            <div>
              <Button
                size="small"
                icon={<Eye size={14} />}
                onClick={handleEmailPreview}
                loading={loading}
                style={{ marginRight: 8 }}
              >
                Aperçu email
              </Button>
              
              {statusInfo.status === 'pending' && schedule.can_candidate_respond?.can_respond && (
                <Button
                  size="small"
                  icon={<RefreshCw size={14} />}
                  onClick={handleResendInvitation}
                  loading={loading}
                  type="primary"
                >
                  Renvoyer
                </Button>
              )}
            </div>
          )
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <Badge 
            status={statusInfo.color} 
            icon={statusInfo.icon}
            text={
              <span style={{ fontWeight: 500, fontSize: '14px' }}>
                {statusInfo.text}
              </span>
            }
          />
        </div>

        <div style={{ color: '#666', fontSize: '13px', marginBottom: 8 }}>
          {statusInfo.description}
        </div>

        {/* Informations additionnelles pour annulation */}
        {statusInfo.status === 'canceled' && schedule.cancellation_reason && (
          <div style={{ 
            background: '#fff2f0', 
            border: '1px solid #ffccc7', 
            borderRadius: 4, 
            padding: 8,
            marginTop: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Info size={14} style={{ color: '#ff4d4f', marginRight: 6, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 500, color: '#ff4d4f', fontSize: '12px' }}>
                  Raison de l'annulation :
                </div>
                <div style={{ color: '#333', fontSize: '13px', marginTop: 2 }}>
                  "{schedule.cancellation_reason}"
                </div>
                {statusInfo.fullDescription && (
                  <div style={{ color: '#666', fontSize: '11px', marginTop: 4 }}>
                    {statusInfo.fullDescription}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Informations additionnelles pour confirmation */}
        {statusInfo.status === 'confirmed' && (
          <div style={{ 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f', 
            borderRadius: 4, 
            padding: 8,
            marginTop: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircle size={14} style={{ color: '#52c41a', marginRight: 6 }} />
              <div style={{ color: '#333', fontSize: '13px' }}>
                Le candidat a confirmé sa présence et sera à l'heure !
              </div>
            </div>
          </div>
        )}

        {/* Informations pour candidat qui ne peut plus répondre */}
        {statusInfo.status === 'pending' && !schedule.can_candidate_respond?.can_respond && (
          <div style={{ 
            background: '#fafafa', 
            border: '1px solid #d9d9d9', 
            borderRadius: 4, 
            padding: 8,
            marginTop: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Clock size={14} style={{ color: '#8c8c8c', marginRight: 6, marginTop: 2 }} />
              <div style={{ color: '#666', fontSize: '13px' }}>
                {schedule.can_candidate_respond?.reason || 'Le candidat ne peut plus modifier sa réponse'}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal aperçu email */}
      {showEmailPreview && (
        <EmailPreviewModal
          visible={showEmailPreview}
          htmlContent={emailPreview}
          onClose={() => setShowEmailPreview(false)}
          candidateName={schedule.candidate_name}
          interviewTitle={schedule.title}
        />
      )}
    </>
  );
};

export default CandidateResponseStatus;