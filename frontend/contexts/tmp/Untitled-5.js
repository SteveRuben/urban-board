// frontend/components/layout/DashboardLayout.jsx
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, 
  Video, 
  FileText, 
  Users, 
  Bell, 
  Settings, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../notifications/NotificationCenter';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation principale du dashboard
  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: Home },
    { name: 'Entretiens', href: '/interviews', icon: Video },
    { name: 'Analyse CV', href: '/resumes', icon: FileText },
    { name: 'Candidats', href: '/candidates', icon: Users },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  // Navigation du profil utilisateur
  const userNavigation = [
    { name: 'Mon profil', href: '/profile', icon: User },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Vérifier si un lien est actif
  const isActiveLink = (href) => {
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 flex md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true"></div>
        </div>
      )}

      {/* Sidebar pour mobile */}
      <div 
        className={`
          fixed inset-y-0 left-0 flex flex-col z-50 w-64 bg-gray-800 text-black transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:inset-0
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
          <Link href="/dashboard" className="flex items-center">
            <img
              className="h-8 w-auto"
              src="/logo-white.svg"
              alt="RecruteIA"
            />
            <span className="ml-2 text-xl font-semibold">RecruteIA</span>
          </Link>
          <button 
            className="md:hidden text-black" 
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation principale */}
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-2 text-sm font-medium rounded-md
                  ${isActiveLink(item.href)
                    ? 'bg-gray-900 text-black'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-black'}
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Navigation profil utilisateur */}
        <div className="pt-2 pb-3 border-t border-gray-700">
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-300 truncate">
              {user?.name || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email || ''}
            </p>
          </div>
          <nav className="mt-2 px-2 space-y-1">
            {userNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-2 text-sm font-medium rounded-md
                  ${isActiveLink(item.href)
                    ? 'bg-gray-900 text-black'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-black'}
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-black"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Déconnexion
            </button>
          </nav>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header du dashboard */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              className="md:hidden text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-1 flex justify-end items-center">
              <NotificationCenter />
              
              <div className="ml-4 relative flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 uppercase font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu de la page */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;