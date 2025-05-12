"use client";

import CodingameLayout from "@/components/codingame/codingame-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  useEffect(() => {
    axios.get("/api/challenges").then((res) => setChallenges(res.data));
  }, []);

  const openModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    axios.post("/api/challenges", form).then((res) => {
      setChallenges([...challenges, res.data]);
      setForm({ title: "", description: "" });
    });
  };

  return (
    <CodingameLayout>
      <div className="mx-auto max-w-screen-xl grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 text-white">
        {/* Liste des Challenges  border border-white/10 rounded-xl bg-white/5 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">📋 Mes Challenges</h2>
          {challenges.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-white/60">
              Aucun challenge disponible
            </div>
          ) : (
            challenges.map((challenge) => (
              <motion.div
                key={challenge.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800 p-4 rounded-xl shadow-lg cursor-pointer transition border border-white/10 hover:border-white/30"
                onClick={() => openModal(challenge)}
              >
                <h3 className="text-xl font-semibold">{challenge.title}</h3>
                <p className="text-sm text-white/60 line-clamp-2">
                  {challenge.description}
                </p>
              </motion.div>
            ))
          )}
        </div>

        {/* Formulaire de création */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 p-6 rounded-xl shadow-xl backdrop-blur border border-white/10"
        >
          <h2 className="text-2xl font-bold mb-6">
            ➕ Créer un nouveau Challenge
          </h2>
          <div className="space-y-4">
            <Input
              placeholder="Titre du challenge"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              placeholder="Description..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full p-3 rounded-md bg-black/20 border border-white/10 text-white resize-none min-h-[120px]"
            />

            {/* Bouton stylé */}
            <motion.button
              onClick={handleCreate}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden px-4 py-2 rounded-full font-semibold bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 text-black shadow-lg transition"
            >
              <motion.span
                className="absolute -inset-px rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 opacity-20 blur-lg animate-pulse"
                aria-hidden="true"
              />
              <span className="relative z-10">🚀 Créer le Challenge</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Modal */}
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-xl bg-gray-900 p-6 border border-white/10 shadow-2xl">
              <Dialog.Title className="text-xl font-bold mb-2">
                {selectedChallenge?.title}
              </Dialog.Title>
              <p className="text-white/70 mb-4">
                {selectedChallenge?.description}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-white/80 hover:text-white border-white/20"
                >
                  Modifier
                </Button>
                <Button className="bg-green-500 hover:bg-green-600 text-black">
                  Publier
                </Button>
                <Button className="bg-red-500 hover:bg-red-600 text-black">
                  Archiver
                </Button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </CodingameLayout>
  );
}
