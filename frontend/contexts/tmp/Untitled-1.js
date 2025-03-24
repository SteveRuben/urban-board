// frontend/components/Layout.jsx
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Menu, 
  Home, 
  Users, 
  FileText, 
  MessageSquare,
  BarChart2,
  Settings,
  LogOut,
  User,
  Menu as MenuIcon,
  X
} from 'lucide-react';
import NotificationCenter from '../notifications/NotificationCenter';

const Layout = ({ children }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fonction pour vérifier si un lien est actif
  const isActive = (path) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  // Navigation principale
  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: Home },
    { name: 'Entretiens', href: '/interviews', icon: MessageSquare },
    { name: 'Candidats', href: '/candidates', icon: Users },
    { name: 'CV & Analyses', href: '/resumes', icon: FileText },
    { name: 'Rapports', href: '/reports', icon: BarChart2 },
    { name: 'Paramètres', href: '/settings', icon: Settings }
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar pour mobile */}
      <div className={`md:hidden fixed inset-0 z-40 flex ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Fermer la navigation</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Link href="/" className="cursor-pointer">
                <div className="h-8 w-auto font-bold text-xl text-blue-600">
                  RecruteIA
                </div>
              </Link>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {React.createElement(item.icon, {
                    className: `mr-4 h-6 w-6 ${
                      isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`
                  })}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <Link 
              href="/profile"
              className="flex-shrink-0 group block"
            >
              <div className="flex items-center">
                <div className="inline-block h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                    Thomas Dupont
                  </p>
                  <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700">
                    Administrateur
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Sidebar pour desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <Link href="/" className="cursor-pointer">
                  <div className="h-8 w-auto font-bold text-xl text-blue-600">
                    RecruteIA
                  </div>
                </Link>
              </div>
              <nav className="mt-8 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {React.createElement(item.icon, {
                      className: `mr-3 h-5 w-5 ${
                        isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`
                    })}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <Link 
                href="/profile"
                className="flex-shrink-0 w-full group block"
              >
                <div className="flex items-center">
                  <div className="inline-block h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      Thomas Dupont
                    </p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                      Administrateur
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Ouvrir la navigation</span>
            <MenuIcon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              {/* Vous pouvez ajouter une barre de recherche ici si nécessaire */}
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Centre de notifications */}
              <NotificationCenter />
              
              {/* Autres éléments de la barre (profil, etc.) */}
              <Link 
                href="/settings"
                className="p-1 rounded-full text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Paramètres</span>
                <Settings className="h-6 w-6" />
              </Link>
              
              <Link 
                href="/auth/logout"
                className="p-1 rounded-full text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Déconnexion</span>
                <LogOut className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>

        {/* Contenu de la page */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;