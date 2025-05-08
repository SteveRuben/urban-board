import "@/styles/globals.css";
import React, { useEffect } from 'react';
import type { AppProps } from "next/app";
import { I18nProvider } from "@/provider/i18n";
import { AuthProvider, useAuth } from "@/provider/auth";
import Head from "next/head";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/dashboard-layout";
import WebSocketService from "@/hooks/websocket-service";


// Les chemins qui utilisent toujours le layout principal, même pour les utilisateurs connectés
const alwaysPublicPaths: string[] = ['/', '/about', '/pricing', '/contact', '/legal', '/documentation'];

// Les chemins qui utilisent toujours le layout d'authentification (pas de layout)
const authPaths: string[] = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

// Les chemins pour l'onboarding
const onboardingPaths: string[] = ['/onboarding'];

// Types for pages with custom getLayout
type NextPageWithLayout = AppProps['Component'] & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
};

interface AppPropsWithLayout extends AppProps {
  Component: NextPageWithLayout;
}

// Wrapper pour sélectionner le layout approprié
function AppWithLayout({ Component, pageProps }: AppPropsWithLayout): React.ReactNode  {
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

  useEffect(() => {
    // Rediriger vers l'onboarding si l'utilisateur est connecté mais n'a pas d'organisation
    /* if (user && !user.onboarding_completed && !onboardingPaths.includes(router.pathname)) {
      router.push('/onboarding');
    } */
      router.push('/dashboard');
  }, [user, router.pathname]);


  // Si le composant a une méthode getLayout personnalisée, l'utiliser
  if (Component.getLayout) {
    return Component.getLayout(<Component {...pageProps} />);
  }

  // Pour les pages d'authentification, pas de layout
  if (authPaths.some(path => router.pathname.startsWith(path))) {
    return <Component {...pageProps} />;
  }

  // Pour les pages d'onboarding, pas de layout
  if (onboardingPaths.some(path => router.pathname.startsWith(path))) {
    return <Component {...pageProps} />;
  }

  // Si c'est une page publique ou si l'utilisateur n'est pas encore connecté
  if (alwaysPublicPaths.includes(router.pathname) || !user) {
    return <Component {...pageProps} />;
  }

  // Par défaut, pour les utilisateurs connectés, utiliser le DashboardLayout
  return (
    <DashboardLayout>
      <Component {...pageProps} />
    </DashboardLayout>
  );
}

export default function App({ Component, pageProps }: AppPropsWithLayout) : React.ReactElement{
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RecruteIA</title>
      </Head>
      <I18nProvider>
        <AppWithLayout Component={Component} pageProps={pageProps}  />
      </I18nProvider>
    </AuthProvider>
  );
}
