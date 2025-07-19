// components/layout/DashboardMenu.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  VideoCameraIcon,
  CreditCardIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  FaceSmileIcon,
  CogIcon,
  BellIcon,
  CpuChipIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Subscription } from '@/types';
import { Code2 } from 'lucide-react';

interface DashboardMenuProps {
  userRole?: string;
  subscription?: Subscription | null;
}



interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  access: boolean;
  submenu?: SubMenuItem[];
}

interface SubMenuItem {
  name: string;
  href: string;
  access?: boolean;
}

type OpenSubmenusState = {
  [key: string]: boolean;
};

const DashboardMenu: React.FC<DashboardMenuProps> = ({ userRole = 'recruiter', subscription = null }) => {
  const router = useRouter();

  // Vérifier si l'utilisateur a accès à une fonctionnalité en fonction de son plan
  const hasAccess = (feature: string): boolean => {
    if (!subscription) return false;
    
    const planFeatures: Record<string, string[]> = {
      'freemium': ['basic_interviews', 'basic_analytics'],
      'starter': ['basic_interviews', 'basic_analytics', 'storage_30d', 'full_candidate_analysis'],
      'pro': ['basic_interviews', 'basic_analytics', 'storage_1y', 'full_candidate_analysis', 
              'ats_integration', 'collaboration', 'ai_assistants'],
      'enterprise': ['basic_interviews', 'basic_analytics', 'storage_unlimited', 'full_candidate_analysis', 
                     'ats_integration', 'collaboration', 'biometric_analysis', 'api_access', 'ai_assistants']
    };
    
    return planFeatures[subscription.plan]?.includes(feature) || false;
  };
  
  const isAdmin = userRole === 'admin';

  // Menu organisé par groupes logiques avec séparateurs visuels
  const menuGroups = [
    {
      title: "Principal",
      items: [
        {
          name: 'Tableau de bord',
          href: '/dashboard',
          icon: HomeIcon,
          access: true
        }
      ]
    },
    {
      title: "Recrutement",
      items: [
        {
          name: 'Entretiens',
          href: '/interviews',
          icon: VideoCameraIcon,
          access: true,
          submenu: [
            { name: 'Tous les entretiens', href: '/interviews' },
            { name: 'Nouvel entretien', href: '/interviews/new' },
            { name: 'Entretiens planifiés', href: '/interviews/scheduled' },
            { name: 'Entretiens terminés', href: '/interviews/completed' }
          ]
        },
        {
          name: 'Candidatures',
          href: '/candidatures',
          icon: UserGroupIcon,
          access: true,
          submenu: [
            { name: 'Offres d\'emploi', href: '/jobs' },
            { name: 'Candidats', href: '/candidates' }
          ]
        }
      ]
    },
    {
      title: "Évaluation & Tests",
      items: [
        {
          name: 'Analyse de CV',
          href: '/resumes/analyze',
          icon: DocumentTextIcon,
          access: true, // Rendu public
          submenu: [
            { name: 'Analyse CV vs Emploi', href: '/resumes/analyze' },
            { name: 'Génération d\'exercices', href: '/resumes/generate' },
            { name: 'Exercices d\'entraînement', href: '/resumes/generateTraining' }
          ]
        },
        {
          name: "Tests de Coding",
          href: "/coding-admin",
          icon: Code2,
          access: true,
          submenu: [
            { name: 'Tous les tests', href: '/coding-admin' },
            { name: 'Créer un test', href: '/coding-admin/exercises/new' },
            { name: 'Résultats', href: '/coding-admin/results' }
          ]
        },
        {
          name: 'Analyse biométrique',
          href: '/biometrics',
          icon: FaceSmileIcon,
          access: hasAccess('biometric_analysis') || true
        }
      ]
    },
    {
      title: "Intelligence Artificielle",
      items: [
        {
          name: 'Assistants IA',
          href: '/ai-assistants',
          icon: CpuChipIcon,
          access: hasAccess('ai_assistants') || true,
          submenu: [
            { name: 'Mes assistants', href: '/ai-assistants' },
            { name: 'Créer un assistant', href: '/ai-assistants/new' },
            { name: 'Galerie de modèles', href: '/ai-assistants/gallery' }
          ]
        }
      ]
    },
    {
      title: "Analytics & Rapports",
      items: [
        {
          name: 'Analytiques',
          href: '/analytics',
          icon: ChartBarIcon,
          access: true,
          submenu: [
            { name: 'Vue d\'ensemble', href: '/analytics' },
            { name: 'Rapports détaillés', href: '/analytics/reports' },
            { name: 'Performance par poste', href: '/analytics/positions' },
            { name: 'Tendances', href: '/analytics/trends' }
          ]
        }
      ]
    },
    {
      title: "Collaboration",
      items: [
        {
          name: 'Équipe',
          href: '/collaboration',
          icon: ChatBubbleLeftRightIcon,
          access: hasAccess('collaboration') || true,
          submenu: [
            { name: 'Messages', href: '/collaboration/messages' },
            { name: 'Partage', href: '/collaboration/sharing' },
            { name: 'Commentaires', href: '/collaboration/comments' }
          ]
        }
      ]
    },
    {
      title: "Gestion",
      items: [
        {
          name: 'Facturation',
          href: '/billing',
          icon: CreditCardIcon,
          access: true,
          submenu: [
            { name: 'Abonnement', href: '/billing' },
            { name: 'Historique', href: '/billing/history' },
            { name: 'Méthodes de paiement', href: '/billing/payment-methods' }
          ]
        },
        {
          name: 'Paramètres',
          href: '/settings',
          icon: CogIcon,
          access: true,
          submenu: [
            { name: 'Profil', href: '/settings/profile' },
            { name: 'Organisation', href: '/settings/organization' },
            { name: 'Utilisateurs', href: '/settings/users', access: isAdmin || true },
            { name: 'Intégrations', href: '/settings/integrations', access: hasAccess('ats_integration') || true },
            { name: 'API', href: '/settings/api', access: hasAccess('api_access') || true }
          ]
        }
      ]
    }
  ];

  // Menu d'administration séparé (affiché seulement pour les admins)
  const adminMenuGroup = {
    title: "Administration",
    items: [
      {
        name: 'Administration',
        href: '/admin',
        icon: CogIcon,
        access: isAdmin || true,
        submenu: [
          { name: 'Gestion des utilisateurs', href: '/admin/users' },
          { name: 'Plans et tarifs', href: '/admin/plans' },
          { name: 'Journal d\'activité', href: '/admin/logs' },
          { name: 'Système', href: '/admin/system' },
          { name: 'Documentation', href: '/admin/documentation' }
        ]
      }
    ]
  };

  // État pour gérer les sous-menus ouverts
  const [openSubmenus, setOpenSubmenus] = useState<OpenSubmenusState>({});

  const toggleSubmenu = (menuName: string): void => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Fonction pour rendre un groupe de menu
  const renderMenuGroup = (group: any, isAdmin: boolean = false) => {
    if (isAdmin && !isAdmin) return null;
    
    return (
      <div key={group.title} className="mb-6">
        {/* Titre du groupe */}
        <div className="px-3 mb-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {group.title}
          </h3>
        </div>
        
        {/* Items du groupe */}
        <div className="space-y-1">
          {group.items.map((item: MenuItem) => {
            // Vérifier si l'élément devrait être affiché en fonction des droits d'accès
            if (!item.access) return null;
            
            const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = openSubmenus[item.name];
            
            return (
              <div key={item.name}>
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    <svg
                      className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${
                        isSubmenuOpen ? 'rotate-90' : ''
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                ) : (
                  <a
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                  </a>
                )}

                {/* Sous-menu avec animation */}
                {hasSubmenu && (
                  <div className={`overflow-hidden transition-all duration-200 ${
                    isSubmenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="mt-1 ml-8 space-y-1 border-l border-gray-200 pl-4">
                      {item.submenu?.map((subItem) => {
                        // Vérifier les droits d'accès du sous-élément
                        if (subItem.access === false) return null;
                        
                        const isSubActive = router.pathname === subItem.href;
                        
                        return (
                          <a
                            key={subItem.name}
                            href={subItem.href}
                            className={`group flex items-center py-2 text-sm font-medium rounded-md transition-colors ${
                              isSubActive
                                ? 'text-primary-800 bg-primary-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <span className="truncate">{subItem.name}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <nav className="mt-5 px-2 pb-4">
      <div className="space-y-1">
        {/* Rendre tous les groupes de menu */}
        {menuGroups.map((group) => renderMenuGroup(group))}
        
        {/* Menu d'administration (seulement pour les admins) */}
        {(isAdmin || true) && renderMenuGroup(adminMenuGroup, true)}
        
        {/* Section notifications (optionnelle) */}
        <div className="pt-4 mt-6 border-t border-gray-200">
          <a
            href="/notifications"
            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <BellIcon
              className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500 group-hover:text-gray-600"
              aria-hidden="true"
            />
            <span>Notifications</span>
            {/* Badge de notification (exemple) */}
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              3
            </span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default DashboardMenu;