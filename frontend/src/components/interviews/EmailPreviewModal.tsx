
import React, { useState } from 'react';
import { 
  Eye, 
  Mail, 
  Smartphone, 
  Monitor,
  Copy,
  X
} from 'lucide-react';

interface EmailPreviewModalProps {
  visible: boolean;
  htmlContent: string;
  onClose: () => void;
  candidateName: string;
  interviewTitle: string;
}

// Composant Button personnalisé
const Button: React.FC<{
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: 'primary' | 'default';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ icon, onClick, type = 'default', children, style }) => {
  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: type === 'primary' ? 'none' : '1px solid #d9d9d9',
    borderRadius: 6,
    backgroundColor: type === 'primary' ? '#1890ff' : '#fff',
    color: type === 'primary' ? '#fff' : '#000',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '6px 12px',
    transition: 'all 0.2s',
    marginLeft: 8,
    ...style
  };

  return (
    <button
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    >
      {icon && <span style={{ marginRight: children ? 6 : 0 }}>{icon}</span>}
      {children}
    </button>
  );
};

// Composant Card personnalisé
const Card: React.FC<{
  size?: 'small' | 'default';
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ size = 'default', style, children }) => {
  return (
    <div style={{
      border: '1px solid #f0f0f0',
      borderRadius: 8,
      backgroundColor: '#fff',
      padding: size === 'small' ? 12 : 16,
      ...style
    }}>
      {children}
    </div>
  );
};

// Composant Tabs personnalisé
const Tabs: React.FC<{
  defaultActiveKey: string;
  size?: 'small' | 'default';
  children: React.ReactNode;
}> = ({ defaultActiveKey, size = 'default', children }) => {
  const [activeKey, setActiveKey] = useState(defaultActiveKey);
  
  const tabPanes = React.Children.toArray(children) as React.ReactElement[];
  const activePane = tabPanes.find(pane => pane.props.tabKey === activeKey);

  return (
    <div>
      {/* Tab Headers */}
      <div style={{ 
        borderBottom: '1px solid #f0f0f0',
        marginBottom: 16,
        display: 'flex'
      }}>
        {tabPanes.map((pane) => (
          <div
            key={pane.props.tabKey}
            style={{
              padding: size === 'small' ? '8px 16px' : '12px 20px',
              cursor: 'pointer',
              borderBottom: activeKey === pane.props.tabKey ? '2px solid #1890ff' : '2px solid transparent',
              color: activeKey === pane.props.tabKey ? '#1890ff' : '#666',
              fontWeight: activeKey === pane.props.tabKey ? 500 : 'normal',
              transition: 'all 0.2s'
            }}
            onClick={() => setActiveKey(pane.props.tabKey)}
          >
            {pane.props.tab}
          </div>
        ))}
      </div>
      
      {/* Tab Content */}
      <div>
        {activePane?.props.children}
      </div>
    </div>
  );
};

// Composant TabPane personnalisé
const TabPane: React.FC<{
  tab: React.ReactNode;
  tabKey: string;
  children: React.ReactNode;
}> = ({ children }) => {
  return <div>{children}</div>;
};

// Composant Divider personnalisé
const Divider: React.FC = () => {
  return <div style={{ 
    height: 1, 
    backgroundColor: '#f0f0f0', 
    margin: '16px 0' 
  }} />;
};

// Fonction pour afficher les messages
const showMessage = {
  success: (content: string) => {
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
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
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
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
};

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  visible,
  htmlContent,
  onClose,
  candidateName,
  interviewTitle
}) => {

  // Copier le HTML dans le presse-papier
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      showMessage.success('HTML copié dans le presse-papier !');
    } catch (error) {
      console.error('Erreur copie:', error);
      showMessage.error('Erreur lors de la copie');
    }
  };

  // Simuler l'aperçu texte (version simplifiée)
  const getTextPreview = () => {
    // Extraction basique du contenu HTML pour version texte
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 20,
          overflow: 'auto'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 8,
            width: 800,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: '16px' }}>
              <Eye size={16} style={{ marginRight: 8 }} />
              Aperçu de l'email - {candidateName}
            </div>
            <button
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4
              }}
              onClick={onClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 24, overflow: 'auto', flex: 1 }}>
            <div style={{ marginBottom: 16 }}>
              <Card size="small" style={{ background: '#f0f2f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>Destinataire : {candidateName}</div>
                    <div style={{ color: '#666', fontSize: '12px' }}>Sujet : Invitation à l'entretien - {interviewTitle}</div>
                  </div>
                  <Mail size={24} style={{ color: '#1890ff' }} />
                </div>
              </Card>
            </div>

            <Tabs defaultActiveKey="html" size="small">
              <TabPane 
                tab={
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <Monitor size={14} style={{ marginRight: 6 }} />
                    Aperçu HTML
                  </span>
                } 
                tabKey="html"
              >
                <div 
                  style={{ 
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    overflow: 'auto',
                    maxHeight: 500,
                    background: 'white'
                  }}
                >
                  {htmlContent ? (
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                  ) : (
                    <div style={{ 
                      padding: 40, 
                      textAlign: 'center', 
                      color: '#999' 
                    }}>
                      <Mail size={48} style={{ marginBottom: 16 }} />
                      <div>Aucun aperçu disponible</div>
                      <div style={{ fontSize: '12px', marginTop: 8 }}>
                        L'email sera généré automatiquement lors de l'envoi
                      </div>
                    </div>
                  )}
                </div>
              </TabPane>

              <TabPane 
                tab={
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <Smartphone size={14} style={{ marginRight: 6 }} />
                    Version texte
                  </span>
                } 
                tabKey="text"
              >
                <div 
                  style={{ 
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    padding: 16,
                    background: '#fafafa',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    maxHeight: 500,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {htmlContent ? getTextPreview() : 'Aucun contenu disponible'}
                </div>
              </TabPane>

              <TabPane 
                tab={
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <Copy size={14} style={{ marginRight: 6 }} />
                    Code HTML
                  </span>
                } 
                tabKey="code"
              >
                <div 
                  style={{ 
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    padding: 16,
                    background: '#f6f8fa',
                    fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: '11px',
                    lineHeight: 1.4,
                    maxHeight: 500,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {htmlContent || '<!-- Aucun contenu HTML disponible -->'}
                </div>
              </TabPane>
            </Tabs>

            <Divider />
            
            <div style={{ background: '#f0f2f5', padding: 12, borderRadius: 4, fontSize: '12px' }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>ℹ️ Informations importantes :</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>Les boutons "Confirmer" et "Annuler" sont fonctionnels et sécurisés</li>
                <li>Le candidat verra cette version exacte dans sa boîte email</li>
                <li>L'email est responsive et s'adapte aux mobiles</li>
                <li>Les liens expirent automatiquement après la date de l'entretien</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 24px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}>
            <Button icon={<Copy size={14} />} onClick={copyToClipboard}>
              Copier HTML
            </Button>
            <Button onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailPreviewModal;