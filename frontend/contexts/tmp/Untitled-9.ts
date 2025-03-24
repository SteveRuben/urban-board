/* // frontend/pages/_app.js
import React from 'react';
import Head from 'next/head';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import ToastContainer from '../components/notifications/ToastContainer';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Vérifier si la page utilise sa propre mise en page (getLayout)
  // Certaines pages comme les pages d'authentification peuvent avoir des mises en page différentes
  const getLayout = Component.getLayout || ((page) => page);
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AuthProvider>
        <NotificationProvider>
          {getLayout(<Component {...pageProps} />)}
          <ToastContainer />
        </NotificationProvider>
      </AuthProvider>
    </>
  );
}

export default MyApp; */
// frontend/pages/_app.js
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import Layout from '../components/layout/Layout';
import DashboardLayout from '../components/layout/DashboardLayout';
import ToastContainer from '../components/notifications/ToastContainer';
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

// Le composant principal _app qui initialise les providers
function MyApp({ Component, pageProps }) {
  const { user } = useAuth();
  useEffect(() => {
    // Connecter WebSocket quand l'utilisateur est authentifié
    if (user && user.id) {
      WebSocketService.connect(user.id);
    }
    
    return () => {
      WebSocketService.disconnect();
    };
  }, [user]);
  
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <>
        <NotificationProvider>
          <AppWithLayout Component={Component} pageProps={pageProps} />
          <ToastContainer />
        </NotificationProvider>
      </>
    </AuthProvider>
  );
}

export default MyApp;