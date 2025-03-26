// frontend/pages/auth/register.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

 /*  ,
    jobTitle: '',
    department: '' */

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register, isAuthenticated, loading, error } = useAuth();
  const router = useRouter();
  
  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);
  
  // Vérifier la force du mot de passe
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    const password = formData.password;
    
    // Longueur minimum
    if (password.length >= 8) strength += 1;
    
    // Majuscules et minuscules
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    
    // Chiffres
    if (/[0-9]/.test(password)) strength += 1;
    
    // Caractères spéciaux
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  }, [formData.password]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer les erreurs lors de la saisie
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Prénom
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    
    // Nom
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    
    // Email
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    // Mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Le mot de passe est trop faible';
    }
    
    // Confirmation de mot de passe
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Valider le formulaire
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setFormError('');
      
      const userData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName
        /* job_title: formData.jobTitle,
        department: formData.department */
      };
      
      const result = await register(userData);
      
      if (!result.success) {
        setFormError(result.error || result.message || 'Erreur lors de l\'inscription');
        return;
      }
      
      // Redirection après inscription réussie
      router.push('/dashboard');
    } catch (err) {
      setFormError('Une erreur est survenue. Veuillez réessayer.');
      console.error('Erreur d\'inscription:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Rendu des barres de force du mot de passe
  const renderPasswordStrength = () => {
    const bars = [];
    const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
    
    for (let i = 0; i < 4; i++) {
      bars.push(
        <div
          key={i}
          className={`h-1 w-1/4 rounded-full ${
            i < passwordStrength ? strengthColors[i] : 'bg-gray-200'
          }`}
        />
      );
    }
    
    return (
      <div className="mt-1">
        <div className="flex space-x-1">{bars}</div>
        {formData.password && (
          <p className="text-xs mt-1 text-gray-500">
            Force: {strengthLabels[passwordStrength - 1] || 'Très faible'}
          </p>
        )}
      </div>
    );
  };
  
  // Si l'authentification est en cours, afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Bannière latérale */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col justify-between bg-blue-600 p-8 text-white">
        <div>
          <h1 className="text-3xl font-bold">RecruteIA</h1>
          <p className="mt-2 text-blue-100">
            La plateforme d'entretien IA pour les professionnels du recrutement
          </p>
        </div>
        
        <div className="mt-auto">
          <h2 className="text-2xl font-semibold mb-4">
            Rejoignez RecruteIA aujourd'hui
          </h2>
          <ul className="space-y-3">
            <li className="flex items-center">
              <div className="rounded-full bg-blue-500 p-1 mr-3">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              Automatisez vos entretiens techniques
            </li>
            <li className="flex items-center">
              <div className="rounded-full bg-blue-500 p-1 mr-3">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              Analysez les CV avec l'intelligence artificielle
            </li>
            <li className="flex items-center">
              <div className="rounded-full bg-blue-500 p-1 mr-3">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              Gagnez du temps et réduisez les biais
            </li>
          </ul>
        </div>
        
        <div className="text-sm text-blue-200 mt-8">
          &copy; 2023 RecruteIA. Tous droits réservés.
        </div>
      </div>
      
      {/* Formulaire d'inscription */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Inscription</h2>
            <p className="mt-2 text-gray-600">
              Créez votre compte RecruteIA
            </p>
          </div>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Jean"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Dupont"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>
            
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {renderPasswordStrength()}
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Le mot de passe doit contenir au moins 8 caractères, une majuscule, 
                une minuscule, un chiffre et un caractère spécial.
              </p>
            </div>
            
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirmer le mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
            
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="jobTitle"
                  className="block text-sm font-medium text-gray-700"
                >
                  Fonction
                </label>
                <input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Recruteur Tech"
                />
              </div>
              
              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700"
                >
                  Département
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ressources Humaines"
                />
              </div>
            </div> */}
            
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700"
              >
                J'accepte les{' '}
                <Link 
                  href="/terms"
                  className="text-blue-600 hover:text-blue-500"
                >
                  conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link 
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-500"
                >
                  politique de confidentialité
                </Link>
              </label>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Inscription en cours...
                  </>
                ) : (
                  'S\'inscrire'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link 
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;