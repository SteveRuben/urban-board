import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  ChevronDown, 
  Brain, 
  Play, 
  BarChart3, 
  Code, 
  Users, 
  Star, 
  Zap, 
  Target, 
  TrendingUp,
  Monitor,
  MessageSquare,
  FileText,
  Video,
  Headphones,
  Settings,
  Award,
  Clock,
  Shield
} from 'lucide-react';
import { useAuth } from '@/provider/auth';

const Header = ({ variant = 'public' }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-white/95 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-9 h-9 bg-gradient-to-r from-green-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight">
                RecruteIA
              </span>
            </div>
          </div>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Menu Explorer avec dropdown amélioré */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group-hover:bg-gray-50">
                Explorer
                <ChevronDown className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 backdrop-blur-sm">
                <div className="py-3">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    Découvrir la Plateforme
                  </div>
                  <Link href="/features" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-blue-200 transition-colors">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Fonctionnalités</div>
                      <div className="text-xs text-gray-500">Toutes nos capacités IA</div>
                    </div>
                  </Link>
                  <Link href="/pricing" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-green-200 transition-colors">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Tarifs</div>
                      <div className="text-xs text-gray-500">Plans et abonnements</div>
                    </div>
                  </Link>
                  <Link href="/about" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-purple-200 transition-colors">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">À propos</div>
                      <div className="text-xs text-gray-500">Notre mission et équipe</div>
                    </div>
                  </Link>
                  <Link href="/contact" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-orange-200 transition-colors">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">Contact</div>
                      <div className="text-xs text-gray-500">Support et assistance</div>
                    </div>
                  </Link>
                  
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <Link href="/blog" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group/item">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-indigo-200 transition-colors">
                        <FileText className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-medium">Blog & Actualités</div>
                        <div className="text-xs text-gray-500">Conseils RH et IA</div>
                      </div>
                    </Link>
                    <Link href="/resources" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors group/item">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-teal-200 transition-colors">
                        <Target className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <div className="font-medium">Ressources</div>
                        <div className="text-xs text-gray-500">Guides et documentation</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Démos avec dropdown complet */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group-hover:bg-gray-50">
                Démos
                <ChevronDown className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 backdrop-blur-sm">
                <div className="py-3">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    Démonstrations Interactives
                  </div>
                  
                  {/* Section IA & Analytics */}
                  <div className="px-4 py-2 mt-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">IA & Analytics</div>
                  </div>
                  <Link href="/demo/dashboard" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-blue-200 transition-colors">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Dashboard IA</div>
                      <div className="text-xs text-gray-500">Analytics temps réel et métriques</div>
                    </div>
                  </Link>
                  <Link href="/demo/cv-analysis" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-orange-200 transition-colors">
                      <Brain className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">Analyse CV par IA</div>
                      <div className="text-xs text-gray-500">Scoring automatique et insights</div>
                    </div>
                  </Link>
                  <Link href="/demo/ai-assistant" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-purple-200 transition-colors">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Assistant IA</div>
                      <div className="text-xs text-gray-500">Questions intelligentes et conseils</div>
                    </div>
                  </Link>

                  {/* Section Évaluation Technique */}
                  <div className="px-4 py-2 mt-3 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Évaluation Technique</div>
                  </div>
                  <Link href="/demo/coding-platform" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-green-200 transition-colors">
                      <Code className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Tests de Code</div>
                      <div className="text-xs text-gray-500">150+ exercices, 5 langages</div>
                    </div>
                  </Link>
                  <Link href="/demo/live-coding" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-indigo-200 transition-colors">
                      <Monitor className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium">Live Coding</div>
                      <div className="text-xs text-gray-500">Évaluation en temps réel</div>
                    </div>
                  </Link>
                  <Link href="/demo/code-review" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-teal-200 transition-colors">
                      <FileText className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-medium">Code Review IA</div>
                      <div className="text-xs text-gray-500">Analyse automatique du code</div>
                    </div>
                  </Link>

                  {/* Section Entretiens */}
                  <div className="px-4 py-2 mt-3 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Entretiens Intelligents</div>
                  </div>
                  <Link href="/demo/video-interview" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-red-200 transition-colors">
                      <Video className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">Entretien Vidéo IA</div>
                      <div className="text-xs text-gray-500">Analyse comportementale avancée</div>
                    </div>
                  </Link>
                  <Link href="/demo/voice-analysis" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-pink-200 transition-colors">
                      <Headphones className="h-4 w-4 text-pink-600" />
                    </div>
                    <div>
                      <div className="font-medium">Analyse Vocale</div>
                      <div className="text-xs text-gray-500">Détection d'émotions et stress</div>
                    </div>
                  </Link>

                  {/* Section Outils Avancés */}
                  <div className="px-4 py-2 mt-3 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Outils Avancés</div>
                  </div>
                  <Link href="/demo/automation" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-yellow-200 transition-colors">
                      <Settings className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium">Automatisation RH</div>
                      <div className="text-xs text-gray-500">Workflows intelligents</div>
                    </div>
                  </Link>
                  <Link href="/demo/performance" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-emerald-200 transition-colors">
                      <Award className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium">Évaluation Performance</div>
                      <div className="text-xs text-gray-500">Métriques et benchmarks</div>
                    </div>
                  </Link>

                  {/* CTA Section */}
                  <div className="px-4 py-3 mt-3 border-t border-gray-100 bg-gradient-to-r from-green-50 to-orange-50">
                    <Link href="/demo/features" className="flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-green-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg">
                      <Play className="h-4 w-4 mr-2" />
                      Voir toutes les démos
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Problèmes avec dropdown amélioré */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group-hover:bg-gray-50">
                Problèmes
                <ChevronDown className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 backdrop-blur-sm">
                <div className="py-3">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    Exercices
                  </div>
                  <Link href="/coding-admin" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-green-200 transition-colors">
                      <Code className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Liste des problèmes</div>
                      <div className="text-xs text-gray-500">150+ exercices</div>
                    </div>
                  </Link>
                  <Link href="/interviews" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-orange-200 transition-colors">
                      <Users className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">Entretiens</div>
                      <div className="text-xs text-gray-500">Sessions d'évaluation</div>
                    </div>
                  </Link>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <Link href="/leaderboard" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors group/item">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-yellow-200 transition-colors">
                        <Star className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium">Classement</div>
                        <div className="text-xs text-gray-500">Top performers</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Étudier avec dropdown */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group-hover:bg-gray-50">
                Étudier
                <ChevronDown className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 backdrop-blur-sm">
                <div className="py-3">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    Ressources
                  </div>
                  <Link href="/features" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-blue-200 transition-colors">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Fonctionnalités</div>
                      <div className="text-xs text-gray-500">Découvrir la plateforme</div>
                    </div>
                  </Link>
                  <Link href="/tutorials" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors group/item">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-green-200 transition-colors">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Tutoriels</div>
                      <div className="text-xs text-gray-500">Guides d'apprentissage</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/pricing" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200">
              Tarifs
            </Link>
          </div>

          {/* Boutons d'action améliorés */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative group">
                <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group-hover:bg-gray-50">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 shadow-md">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden lg:block">{user.name}</span>
                  <ChevronDown className="ml-2 h-4 w-4 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 backdrop-blur-sm">
                  <div className="py-3">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <Link href="/dashboard" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group/item">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-blue-200 transition-colors">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Dashboard</div>
                        <div className="text-xs text-gray-500">Vue d'ensemble</div>
                      </div>
                    </Link>
                    <Link href="/profile" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors group/item">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-green-200 transition-colors">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Mon Profil</div>
                        <div className="text-xs text-gray-500">Informations personnelles</div>
                      </div>
                    </Link>
                    <Link href="/settings" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors group/item">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-gray-200 transition-colors">
                        <Target className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">Paramètres</div>
                        <div className="text-xs text-gray-500">Configuration</div>
                      </div>
                    </Link>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group/item">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-red-200 transition-colors">
                          <X className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">Déconnexion</div>
                          <div className="text-xs text-red-500">Quitter la session</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  Se connecter
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          {/* Menu mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile dropdown amélioré */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg backdrop-blur-sm">
          <div className="px-4 pt-4 pb-6 space-y-1 max-h-screen overflow-y-auto">
            {/* Section Explorer */}
            <div className="mb-6">
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-3">
                Découvrir la Plateforme
              </div>
              <Link href="/features" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Fonctionnalités</div>
                  <div className="text-xs text-gray-500">Toutes nos capacités IA</div>
                </div>
              </Link>
              <Link href="/pricing" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Tarifs</div>
                  <div className="text-xs text-gray-500">Plans et abonnements</div>
                </div>
              </Link>
              <Link href="/about" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">À propos</div>
                  <div className="text-xs text-gray-500">Notre mission et équipe</div>
                </div>
              </Link>
              <Link href="/contact" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-200 transition-colors">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium">Contact</div>
                  <div className="text-xs text-gray-500">Support et assistance</div>
                </div>
              </Link>
              <Link href="/blog" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-indigo-200 transition-colors">
                  <FileText className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <div className="font-medium">Blog & Actualités</div>
                  <div className="text-xs text-gray-500">Conseils RH et IA</div>
                </div>
              </Link>
              <Link href="/resources" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-teal-200 transition-colors">
                  <Target className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <div className="font-medium">Ressources</div>
                  <div className="text-xs text-gray-500">Guides et documentation</div>
                </div>
              </Link>
            </div>

            {/* Section Démos Complètes */}
            <div className="mb-6">
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-3">
                Démos Interactives
              </div>
              
              {/* IA & Analytics */}
              <div className="px-2 py-1 mb-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">IA & Analytics</div>
              </div>
              <Link href="/demo/ai-assistant" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Assistant IA</div>
                  <div className="text-xs text-gray-500">Questions intelligentes</div>
                </div>
              </Link>

              {/* Évaluation Technique */}
              <div className="px-2 py-1 mb-2 mt-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Évaluation Technique</div>
              </div>
              <Link href="/demo/live-coding" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-indigo-200 transition-colors">
                  <Monitor className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <div className="font-medium">Live Coding</div>
                  <div className="text-xs text-gray-500">Temps réel</div>
                </div>
              </Link>
              <Link href="/demo/code-review" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-teal-200 transition-colors">
                  <FileText className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <div className="font-medium">Code Review IA</div>
                  <div className="text-xs text-gray-500">Analyse automatique</div>
                </div>
              </Link>

              {/* Entretiens */}
              <div className="px-2 py-1 mb-2 mt-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Entretiens</div>
              </div>
              <Link href="/demo/video-interview" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                  <Video className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="font-medium">Entretien Vidéo IA</div>
                  <div className="text-xs text-gray-500">Analyse comportementale</div>
                </div>
              </Link>
              <Link href="/demo/voice-analysis" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-pink-200 transition-colors">
                  <Headphones className="h-4 w-4 text-pink-600" />
                </div>
                <div>
                  <div className="font-medium">Analyse Vocale</div>
                  <div className="text-xs text-gray-500">Émotions et stress</div>
                </div>
              </Link>

              {/* Outils Avancés */}
              <div className="px-2 py-1 mb-2 mt-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Outils Avancés</div>
              </div>
              <Link href="/demo/automation" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-yellow-200 transition-colors">
                  <Settings className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium">Automatisation RH</div>
                  <div className="text-xs text-gray-500">Workflows intelligents</div>
                </div>
              </Link>
              <Link href="/demo/performance" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-emerald-200 transition-colors">
                  <Award className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <div className="font-medium">Évaluation Performance</div>
                  <div className="text-xs text-gray-500">Métriques avancées</div>
                </div>
              </Link>
            </div>

            {/* Section Problèmes */}
            <div className="mb-6">
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-3">
                Problèmes
              </div>
              <Link href="/coding-admin" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                  <Code className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Liste des problèmes</div>
                  <div className="text-xs text-gray-500">150+ exercices</div>
                </div>
              </Link>
              <Link href="/interviews" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-200 transition-colors">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium">Entretiens</div>
                  <div className="text-xs text-gray-500">Sessions d'évaluation</div>
                </div>
              </Link>
              <Link href="/leaderboard" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-yellow-200 transition-colors">
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium">Classement</div>
                  <div className="text-xs text-gray-500">Top performers</div>
                </div>
              </Link>
            </div>

            {/* Section Étudier */}
            <div className="mb-6">
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-3">
                Étudier
              </div>
              <Link href="/features" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Fonctionnalités</div>
                  <div className="text-xs text-gray-500">Découvrir la plateforme</div>
                </div>
              </Link>
              <Link href="/tutorials" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Tutoriels</div>
                  <div className="text-xs text-gray-500">Guides d'apprentissage</div>
                </div>
              </Link>
              <Link href="/pricing" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium">Tarifs</div>
                  <div className="text-xs text-gray-500">Plans et abonnements</div>
                </div>
              </Link>
            </div>
            
            {/* Section Authentification */}
            {!user && (
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  <Link href="/auth/login" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors group">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium">Se connecter</div>
                      <div className="text-xs text-gray-500">Accéder à votre compte</div>
                    </div>
                  </Link>
                  <div className="px-3">
                    <Link href="/auth/register" className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 rounded-lg transition-all shadow-md hover:shadow-lg">
                      <Brain className="h-4 w-4 mr-2" />
                      S'inscrire gratuitement
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Section Utilisateur connecté */}
            {user && (
              <div className="pt-4 border-t border-gray-200">
                <div className="px-3 py-2 mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 shadow-md">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link href="/dashboard" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Dashboard</div>
                      <div className="text-xs text-gray-500">Vue d'ensemble</div>
                    </div>
                  </Link>
                  <Link href="/profile" className="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Mon Profil</div>
                      <div className="text-xs text-gray-500">Informations personnelles</div>
                    </div>
                  </Link>
                  <button className="flex items-center w-full px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                      <X className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">Déconnexion</div>
                      <div className="text-xs text-red-500">Quitter la session</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;