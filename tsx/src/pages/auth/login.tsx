// frontend/pages/auth/login.tsx
import { useAuth } from "@/provider/auth";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { FormEvent, MouseEvent, useEffect, useState } from "react";

interface SavedUser {
  email: string;
  lastLogin: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedUsers, setSavedUsers] = useState<SavedUser[]>([]);
  const [showSavedUsers, setShowSavedUsers] = useState<boolean>(false);

  const { login, isAuthenticated, loading, error } = useAuth();
  const router = useRouter();

  // Charger les utilisateurs précédemment connectés au chargement de la page
  useEffect(() => {
    const loadSavedUsers = () => {
      try {
        const savedUsersData = localStorage.getItem("recruteIA_savedUsers");
        if (savedUsersData) {
          const parsedUsers = JSON.parse(savedUsersData) as SavedUser[];
          setSavedUsers(parsedUsers);

          // Afficher la liste si des utilisateurs sont enregistrés
          if (parsedUsers.length > 0) {
            setShowSavedUsers(true);
          }
        }
      } catch (err) {
        console.error(
          "Erreur lors du chargement des utilisateurs sauvegardés:",
          err
        );
      }
    };

    loadSavedUsers();
  }, []);

  // Rediriger vers le tableau de bord si déjà authentifié
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const redirectTimer = setTimeout(() => {
        if (router.query.redirect) {
          router.push(router.query.redirect as string);
        } else {
          router.push("/dashboard");
        }
      }, 100);

      // Nettoyer le timer si le composant est démonté
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, loading, router]);

  // Mettre à jour l'erreur du formulaire si une erreur d'authentification se produit
  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);

  const saveUserToLocalStorage = (userEmail: string): void => {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUsers = [...savedUsers];
      const userExists = existingUsers.some((user) => user.email === userEmail);

      if (!userExists) {
        const updatedUsers = [
          { email: userEmail, lastLogin: new Date().toISOString() },
          ...existingUsers.slice(0, 4), // Garder max 5 utilisateurs
        ];

        localStorage.setItem(
          "recruteIA_savedUsers",
          JSON.stringify(updatedUsers)
        );
        setSavedUsers(updatedUsers);
      } else {
        // Mettre à jour la date de dernière connexion
        const updatedUsers = existingUsers.map((user) =>
          user.email === userEmail
            ? { ...user, lastLogin: new Date().toISOString() }
            : user
        );
        localStorage.setItem(
          "recruteIA_savedUsers",
          JSON.stringify(updatedUsers)
        );
        setSavedUsers(updatedUsers);
      }
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de l'utilisateur:", err);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      setFormError("Veuillez saisir votre adresse email.");
      return;
    }

    if (!password) {
      setFormError("Veuillez saisir votre mot de passe.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      const result = (await login(email, password)) as LoginResult;
      console.log("result: ", result);

      if (result.success) {
        // Sauvegarder l'utilisateur si "se souvenir de moi" est coché
        if (rememberMe) {
          saveUserToLocalStorage(email);
        }
      } else {
        setFormError(
          result.error ||
            "Échec de la connexion. Veuillez vérifier vos identifiants."
        );
      }
    } catch (err) {
      setFormError("Une erreur est survenue. Veuillez réessayer.");
      console.error("Erreur de connexion:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSavedUser = (userEmail: string): void => {
    setEmail(userEmail);
    setFormError("");
    // Focus sur le champ de mot de passe
    document.getElementById("password")?.focus();
  };

  const removeSavedUser = (
    e: MouseEvent<HTMLButtonElement>,
    userEmail: string
  ): void => {
    e.stopPropagation(); // Empêcher la sélection de l'utilisateur

    const updatedUsers = savedUsers.filter((user) => user.email !== userEmail);
    localStorage.setItem("recruteIA_savedUsers", JSON.stringify(updatedUsers));
    setSavedUsers(updatedUsers);

    if (updatedUsers.length === 0) {
      setShowSavedUsers(false);
    }
  };

  // Si l'authentification est en cours, afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Formater la date pour affichage
  const formatLastLogin = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      return "Date inconnue";
    }
  };

  return (
    <>
      <Head>
        <title>Connexion - RecruteIA</title>
        <meta
          name="description"
          content="Connectez-vous à votre compte RecruteIA"
        />
      </Head>
      <div className="min-h-screen flex bg-gray-50">
        {/* Partie gauche (image et texte) */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:bg-primary-700 lg:text-black lg:p-12">
          <div className="max-w-lg mx-auto">
            <h1 className="text-4xl font-bold mb-6">RecruteIA</h1>
            <p className="text-xl mb-8">
              La plateforme intelligente pour vos recrutements assistés par IA.
            </p>
            <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/login-illustration.svg"
                alt="Illustration de recrutement"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        </div>

        {/* Partie droite (formulaire) */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-12">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900">
                Connectez-vous à votre compte
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Ou{" "}
                <a href="/auth/register">
                  <span className="font-medium text-primary-600 hover:text-primary-500">
                    créez un nouveau compte
                  </span>
                </a>
              </p>
            </div>

            {/* Utilisateurs précédemment connectés */}
            {showSavedUsers && savedUsers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Comptes récemment utilisés
                </h3>
                <div className="space-y-2">
                  {savedUsers.map((user, index) => (
                    <div
                      key={index}
                      onClick={() => selectSavedUser(user.email)}
                      className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            Dernière connexion:{" "}
                            {formatLastLogin(user.lastLogin)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => removeSavedUser(e, user.email)}
                        className="text-gray-400 hover:text-gray-500"
                        aria-label="Supprimer cet utilisateur"
                      >
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <p className="mx-3 text-xs text-gray-500">ou</p>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {formError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{formError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Adresse email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="nom@entreprise.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mot de passe
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Se souvenir de moi
                  </label>
                </div>

                <div className="text-sm">
                  <a href="/auth/forgot-password">
                    <span className="font-medium text-primary-600 hover:text-primary-500">
                      Mot de passe oublié ?
                    </span>
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent 
                  rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connexion en cours...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Ou continuer avec
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Se connecter avec Google</span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Se connecter avec LinkedIn</span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
