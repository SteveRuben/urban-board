// frontend/components/layout/PublicLayout.jsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';

const PublicLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header variant="public" />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default PublicLayout;