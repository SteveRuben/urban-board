"use client";

import CodingameLayout from "@/components/codingame/codingame-layout";
import { motion } from "framer-motion";

export default function Codingame() {
  return (
    <CodingameLayout>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        className="text-lg max-w-xl mx-auto mb-8 text-white/80"
      >
        Entraînez-vous à résoudre des défis de code comme en entretien. En temps
        réel.
      </motion.p>

      <motion.a
        href="#"
        whileHover={{ scale: 1.07, rotate: 0.5 }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative inline-block px-8 py-3 rounded-full font-semibold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors overflow-hidden shadow-xl"
      >
        {/* Glow rotatif en fond */}
        <motion.span
          className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 opacity-20 blur-2xl animate-spin-slow"
          aria-hidden="true"
        />

        {/* Sparkle / Particules */}
        <span className="absolute inset-0 z-0 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle cx="10" cy="10" r="1.5" fill="white" opacity="0.4">
              <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="2s"
                repeatCount="indefinite"
                begin="0s"
              />
            </circle>
            <circle cx="80" cy="20" r="1.5" fill="white" opacity="0.4">
              <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="2s"
                repeatCount="indefinite"
                begin="0.6s"
              />
            </circle>
            <circle cx="50" cy="70" r="1.5" fill="white" opacity="0.4">
              <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="2s"
                repeatCount="indefinite"
                begin="1.2s"
              />
            </circle>
          </svg>
        </span>

        {/* Contenu du bouton */}
        <span className="relative z-10 flex items-center gap-2">
          🚀 <span>Commencer</span>
        </span>
      </motion.a>
    </CodingameLayout>
  );
}
