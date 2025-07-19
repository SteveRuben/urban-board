"use client";

import CustomCursor from "@/components/codingame/custom-cursor";
import Navbar from "@/components/codingame/navbar";
import BackgroundParticles from "@/components/codingame/particles-bg";
import { useEffect, useState } from "react";
import { Flip, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type LayoutProps = {
  children: (authToken: string | null) => React.ReactNode;
};

const CodingameLayout = ({ children }: LayoutProps) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setAuthToken(token);
    setCheckedAuth(true);
  }, []);

  if (!checkedAuth) {
    return <div className="text-white text-center mt-10">Chargement...</div>;
  }

  return (
    <div className="codingame relative min-h-screen overflow-hidden">
      <CustomCursor />
      <BackgroundParticles />
      <main className="flex flex-col items-center justify-center h-screen px-4 text-center">
        <Navbar />
        <section className="text-center py-5 px-4">
          {children(authToken)}
        </section>
      </main>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Flip}
        theme="dark" // Important pour le thème noir
      />
    </div>
  );
};

export default CodingameLayout;
