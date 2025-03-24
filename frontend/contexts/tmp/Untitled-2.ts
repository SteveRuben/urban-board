// frontend/pages/_app.js
import React from 'react';
import Head from 'next/head';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import Layout from '../components/Layout';
import ToastContainer from '../components/notifications/ToastContainer';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Vérifier si le layout doit être utilisé pour cette page
  // Pages d'authentification sans layout
  const noLayoutPages = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];
  
  const useLayout = !noLayoutPages.includes(pageProps.pathname);
  
  return (
    <>
      <Head>
        <title>RecruteIA - Plateforme d'entretien IA</title>
        <meta name="description" content="Recrutez plus efficacement avec notre plateforme IA" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AuthProvider>
        <NotificationProvider>
          {useLayout ? (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          ) : (
            <Component {...pageProps} />
          )}
          <ToastContainer />
        </NotificationProvider>
      </AuthProvider>
    </>
  );
}

// Récupérer le chemin de la page pour déterminer si on doit utiliser le layout
MyApp.getInitialProps = async ({ Component, ctx }) => {
  let pageProps = {};
  
  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }
  
  pageProps.pathname = ctx.pathname;
  
  return { pageProps };
};

export default MyApp;