// pages/_app.js
import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/layout/DashboardLayout';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import ToastManager from '../components/notifications/ToastManager';
import ToastContainer from '../components/notifications/ToastContainer';
import { NotificationProvider } from '../contexts/NotificationContext';
import WebSocketService from '../services/websocket-service';
import '../styles/globals.css';

// Les chemins qui utilisent toujours le layout principal, même pour les utilisateurs connectés
const alwaysPublicPaths = ['/', '/about', '/pricing', '/contact', '/legal'];

// Les chemins qui utilisent toujours le layout d'authentification (pas de layout)
const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

// Wrapper pour sélectionner le layout approprié
function AppWithLayout({ Component, pageProps }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    // Connecter WebSocket quand l'utilisateur est authentifié
    if (user && user.id) {
      WebSocketService.connect(user.id);
    }

    return () => {
      WebSocketService.disconnect();
    };
  }, [user]);

  // Si le composant a une méthode getLayout personnalisée, l'utiliser
  if (Component.getLayout) {
    return Component.getLayout(<Component {...pageProps} />);
  }
  
  // Pour les pages d'authentification, pas de layout
  if (authPaths.some(path => router.pathname.startsWith(path))) {
    return <Component {...pageProps} />;
  }

  // Si c'est une page publique ou si l'utilisateur n'est pas encore connecté
  if (alwaysPublicPaths.includes(router.pathname) || !user) {
    return <Component {...pageProps} />;
    /*  (
       <Layout>
         <Component {...pageProps} />
       </Layout>
     ); */
  }

  // Par défaut, pour les utilisateurs connectés, utiliser le DashboardLayout
  return (
    <DashboardLayout>
      <Component {...pageProps} />
    </DashboardLayout>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RecruteIA</title>
      </Head>

      <NotificationProvider>
        <AppWithLayout Component={Component} pageProps={pageProps} />
        <ToastContainer />
      </NotificationProvider>

      {/* Gestionnaire de notifications toast */}
      <ToastManager />
    </AuthProvider>
  );
}

export default MyApp;