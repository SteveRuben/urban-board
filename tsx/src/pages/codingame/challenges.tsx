"use client";

import { Spinner } from "@/components/tools/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import {
  Archive,
  Copy,
  Edit,
  Linkedin,
  Mail,
  Send,
  SendIcon,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export enum ChallengeStatus {
  Draft = "DRAFT",
  Published = "PUBLISHED",
  Archived = "ARCHIVED",
}
interface Challenge {
  id: string;
  title: string;
  description: string;
  status: ChallengeStatus;
}

type Props = {
  authToken: string | null;
};

type CurrentFormActionType = {
  title: string;
  button: string;
  action: () => void;
};

export default function Challenges({ authToken }: Props) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [formAction, setFormAction] = useState<"create" | "update">("create");
  const [shareLink, setShareLink] = useState(
    "http://localhost:5000/api/challenges/participate/c8b47fd1-4d44-4e37-9fa2-224377b19c33"
  );
  const [loadingShareLink, setLoadingShareLink] = useState(false);

  // Récupération des challenges
  const fetchChallenges = async () => {
    if (!authToken) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/challenges", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        toast.error("Erreur lors du chargement des challenges");
        throw new Error("Erreur lors du chargement des challenges");
      }

      const data = await res.json();
      setChallenges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleCreate = async () => {
    if (!authToken) {
      toast.warning(
        "Veuillez d'abord vous authentifier pour créer un challenge"
      );
      return;
    }

    if (form.title.length <= 0) {
      toast.warning("Le titre est obligatoire");
      return;
    }

    if (form.description.length < 5) {
      toast.warning("La description doit avoir au moins 5 caractères");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error("Erreur lors de la création du challenge");
        throw new Error("Erreur lors de la création du challenge");
      }

      await res.json();
      resetForm();
      toast.success("Challenge créé avec success");
      await fetchChallenges();
    } catch (err) {
      console.error("Erreur lors de la création :", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!authToken) {
      toast.warning(
        "Veuillez d'abord vous authentifier pour modifier le challenge"
      );
      return;
    }

    if (selectedChallenge === null) {
      toast.warning("Veuillez selectionner le challenge à modifier");
      return;
    }

    if (form.title.length <= 0) {
      toast.warning("Le titre est obligatoire");
      return;
    }

    if (form.description.length < 5) {
      toast.warning("La description doit avoir au moins 5 caractères");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/challenges/${selectedChallenge?.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error("Erreur lors de la modification du challenge");
        throw new Error("Erreur lors de la modification du challenge");
      }

      await res.json();
      resetForm();
      toast.success("Challenge modifié avec success");
      await fetchChallenges();
    } catch (err) {
      console.error("Erreur lors de la modification :", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!authToken) {
      toast.warning(
        "Veuillez d'abord vous authentifier pour publier le challenge"
      );
      return;
    }

    if (selectedChallenge === null) {
      toast.warning("Veuillez selectionner le challenge à publier");
      return;
    }

    if (selectedChallenge.status === ChallengeStatus.Published) {
      toast.warning("Ce challenge est déjà publié");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/challenges/${selectedChallenge?.id}/publish`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        toast.error("Erreur lors de la publication du challenge");
        throw new Error("Erreur lors de la publication du challenge");
      }

      await res.json();
      resetForm();
      setIsModalOpen(false);
      toast.success("Challenge publié avec success");
      await fetchChallenges();
    } catch (err) {
      console.error("Erreur lors de la publication :", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!authToken) {
      toast.warning(
        "Veuillez d'abord vous authentifier pour archiver le challenge"
      );
      return;
    }

    if (selectedChallenge === null) {
      toast.warning("Veuillez selectionner le challenge à archiver");
      return;
    }

    if (selectedChallenge.status !== ChallengeStatus.Published) {
      toast.warning("Seuls les challenges publiés peuvent être archivés");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/challenges/${selectedChallenge?.id}/archive`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        toast.error("Erreur lors de l'archivage du challenge");
        throw new Error("Erreur lors de l'archivage du challenge");
      }

      await res.json();
      resetForm();
      setIsModalOpen(false);
      toast.success("Challenge archivé avec success");
      await fetchChallenges();
    } catch (err) {
      console.error("Erreur lors de l'archivage :", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!authToken) {
      toast.warning(
        "Veuillez d'abord vous authentifier pour supprimer le challenge"
      );
      return;
    }

    if (selectedChallenge === null) {
      toast.warning("Veuillez selectionner le challenge à supprimer");
      return;
    }

    if (!confirm("Êtes vous sûr de vouloir supprimer ?")) {
      toast("Processus de suppression annulé");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/challenges/${selectedChallenge?.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        toast.error("Erreur lors de la suppression du challenge");
        throw new Error("Erreur lors de la suppression du challenge");
      }

      await res.json();
      resetForm();
      setIsModalOpen(false);
      toast.success("Challenge supprimé avec success");
      await fetchChallenges();
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentFormAction = () => {
    let elt: CurrentFormActionType;
    switch (formAction) {
      case "create":
        elt = {
          title: "➕ Créer un nouveau Challenge",
          button: "🚀 Créer ...",
          action: handleCreate,
        };
        break;
      case "update":
        elt = {
          title: "Modifier le Challenge",
          button: "✏️ Éditer",
          action: handleUpdate,
        };
        break;
    }
    return elt;
  };

  const resetForm = () => {
    setForm({ title: "", description: "" });
    setSelectedChallenge(null);
    setFormAction("create");
  };

  // Dans le composant ou useState

  const generateShareLink = async () => {
    if (!authToken) {
      toast.warning(
        "Veuillez d'abord vous authentifier pour partager le challenge"
      );
      return;
    }

    if (selectedChallenge === null) {
      toast.warning("Veuillez selectionner le challenge à partager");
      return;
    }

    if (selectedChallenge.status !== ChallengeStatus.Published) {
      toast.warning("Veuillez d'abord publier le challenge");
      return;
    }

    try {
      setLoadingShareLink(true);
      const response = await fetch(
        `/api/challenges/${selectedChallenge.id}/get-participation-link`,
        {
          method: "POST",
        }
      );
      const data = await response.json();
      setShareLink(data.participation_url);
      toast.success("Lien généré avec succès !");
    } catch (error) {
      console.log(
        "Erreur lors de la génération du lien de participation",
        error
      );
      toast.error("Erreur lors de la génération du lien.");
    } finally {
      setLoadingShareLink(false);
    }
  };

  const displayCustomChallengeStatus = (status: ChallengeStatus) => {
    let customStatus: string = "";
    switch (status) {
      case ChallengeStatus.Draft:
        customStatus = "bg-red-500/30 text-red-500 border-red-500/80";
        break;
      case ChallengeStatus.Published:
        customStatus = "bg-green-500/40 text-green-500 border-green-500";
        break;
      case ChallengeStatus.Archived:
        customStatus = "bg-gray-500/40 text-gray-500 border-gray-500";
        break;
    }
    return customStatus;
  };

  const openModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="mx-auto max-w-screen-xl grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 text-white">
        {/* Liste des Challenges */}
        <div className="relative">
          {/* Overlay loader */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/10 z-20 flex items-center justify-center rounded-xl">
              <Spinner type="spin" />
            </div>
          )}

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
                  whileHover={{ scale: 1.03, translateY: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => openModal(challenge)}
                  className="group relative bg-gradient-to-br from-cyan-800/30 to-gray-900 px-5 py-2 rounded-r-2xl rounded-l-sm shadow-xl border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300"
                >
                  {/* Accent color bar on the left */}
                  <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-tl-2xl rounded-bl-2xl group-hover:bg-blue-400 transition-all duration-300"></span>

                  {/* Title */}
                  <div className="flex items-start gap-2">
                    <h3 className="text-base font-bold text-white mb-1">
                      {challenge.title}
                    </h3>
                    <span
                      className={`text-[10px] border-[1px] px-2 rounded-full ${displayCustomChallengeStatus(
                        challenge.status
                      )}`}
                    >
                      {challenge.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-start text-white/70 leading-snug line-clamp-3">
                    {challenge.description}
                  </p>

                  {/* CTA visual cue */}
                  <div className="absolute bottom-4 right-4 text-blue-400 text-xs opacity-0 group-hover:opacity-100 transition">
                    Voir plus →
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Formulaire  */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 p-6 rounded-xl shadow-xl backdrop-blur border border-white/10"
        >
          <h2 className="text-2xl font-bold mb-6">
            {currentFormAction()?.title}
          </h2>
          <div className="space-y-4">
            <Input
              placeholder="Titre du challenge"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={isLoading}
              className={isLoading ? "cursor-not-allowed opacity-60" : ""}
              required
            />

            <textarea
              placeholder="Description..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              disabled={isLoading}
              required
              className={`w-full p-3 rounded-md bg-black/20 border border-white/10 text-white resize-none min-h-[120px] ${
                isLoading ? "cursor-not-allowed opacity-60" : ""
              }`}
            />

            <motion.button
              onClick={currentFormAction()?.action}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              disabled={isLoading}
              className={`relative overflow-hidden px-4 py-1 rounded-full font-semibold bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 text-black shadow-lg transition ${
                isLoading ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              <motion.span
                className="absolute -inset-px rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 opacity-20 blur-lg animate-pulse"
                aria-hidden="true"
              />
              <span className="relative inline-flex items-center justify-center h-8">
                <span className={isLoading ? "invisible cursor-none" : ""}>
                  {currentFormAction()?.button}
                </span>

                {isLoading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner />
                  </span>
                )}
              </span>
            </motion.button>
            <Button
              onClick={resetForm}
              variant="outline"
              className={`${
                formAction === "create" ? "hidden" : "block"
              } w-full border-none text-gray-400 hover:text-cyan-500`}
            >
              Reset
            </Button>
          </div>
        </motion.div>

        {/* Modal */}
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="relative z-50"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-6 relative">
              {/* Titre + bouton partager */}
              <Dialog.Title className="mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedChallenge?.title}
                    </h3>
                    <span
                      className={`text-[10px] border px-2 rounded-full ${displayCustomChallengeStatus(
                        selectedChallenge?.status ?? ChallengeStatus.Draft
                      )}`}
                    >
                      {selectedChallenge?.status}
                    </span>
                  </div>

                  {/* Bouton Partager */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                    onClick={() => setIsSharing(!isSharing)}
                  >
                    {isSharing ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Share2 className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </Dialog.Title>

              {/* CONTENU : description ou partage */}
              {!isSharing ? (
                <>
                  {/* Description */}
                  <p className="text-white/70 text-sm mb-6">
                    {selectedChallenge?.description}
                  </p>

                  {/* Boutons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="text-white/80 hover:text-white hover:bg-black border-white/20 flex items-center gap-2"
                      onClick={() => {
                        form.title = selectedChallenge?.title ?? "";
                        form.description = selectedChallenge?.description ?? "";
                        setFormAction("update");
                        setIsModalOpen(false);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </Button>

                    <Button
                      className="bg-green-500 hover:bg-green-600 text-black flex items-center gap-2"
                      onClick={handlePublish}
                    >
                      <Upload className="w-4 h-4" />
                      Publier
                    </Button>

                    <Button
                      className="bg-cyan-500 hover:bg-cyan-800 text-black flex items-center gap-2"
                      onClick={handleArchive}
                    >
                      <Archive className="w-4 h-4" />
                      Archiver
                    </Button>

                    <Button
                      className="bg-red-700 hover:bg-red-800 text-white flex items-center gap-2"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* PARTAGE */}
                  <div className="space-y-4">
                    <Button
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold rounded-lg w-full justify-center py-2"
                      onClick={generateShareLink}
                      disabled={loadingShareLink}
                    >
                      {loadingShareLink ? (
                        <Spinner type="spin" />
                      ) : (
                        "🔗 Générer un nouveau lien de participation"
                      )}
                    </Button>
                    {
                      <>
                        <div className="bg-black/30 rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-white/80 text-sm">
                          <input
                            readOnly
                            value={shareLink}
                            className="bg-transparent outline-none w-full cursor-text my-2"
                            onClick={(e) => e.currentTarget.select()}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-white"
                            onClick={() => {
                              navigator.clipboard.writeText(shareLink);
                              toast.success("Lien copié !");
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-between">
                          <Button
                            variant="outline"
                            className="text-white border-white/20 flex gap-2"
                            onClick={() => {
                              window.open(
                                `mailto:?subject=Challenge&body=${shareLink}`
                              );
                            }}
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </Button>

                          <Button
                            variant="outline"
                            className="text-white border-white/20 flex gap-2"
                            onClick={() =>
                              window.open(
                                `https://wa.me/?text=${encodeURIComponent(
                                  shareLink
                                )}`
                              )
                            }
                          >
                            <Send className="w-4 h-4" />
                            WhatsApp
                          </Button>

                          <Button
                            variant="outline"
                            className="text-white border-white/20 flex gap-2"
                            onClick={() =>
                              window.open(
                                `https://t.me/share/url?url=${encodeURIComponent(
                                  shareLink
                                )}`
                              )
                            }
                          >
                            <SendIcon className="w-4 h-4" />
                            Telegram
                          </Button>

                          <Button
                            variant="outline"
                            className="text-white border-white/20 flex gap-2"
                            onClick={() =>
                              window.open(
                                `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                                  shareLink
                                )}`
                              )
                            }
                          >
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </Button>
                        </div>
                      </>
                    }
                  </div>
                </>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
