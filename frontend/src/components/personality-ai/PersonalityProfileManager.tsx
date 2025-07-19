// tsx/src/components/personality-ai/PersonalityProfileManager.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ChartBarIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer 
} from 'recharts'

interface PersonalityProfile {
  id: string
  candidate_name: string
  candidate_email: string
  candidate_gender?: string
  big_five_traits: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
  }
  communication_style: string
  preferred_interaction_style: string
  motivation_factors: string[]
  stress_indicators: string[]
  analysis_confidence: number
  analysis_date: string
  personality_summary: string
  strengths: string[]
  development_areas: string[]
  created_at: string
}

interface FilterOptions {
  communication_style?: string
  candidate_gender?: string
  min_confidence?: number
  date_from?: string
  date_to?: string
}

const communicationStyleColors = {
  'direct': 'bg-red-100 text-red-800',
  'diplomatic': 'bg-blue-100 text-blue-800',
  'analytical': 'bg-green-100 text-green-800',
  'expressive': 'bg-purple-100 text-purple-800',
  'balanced': 'bg-gray-100 text-gray-800'
}

const traitLabels = {
  openness: 'Ouverture',
  conscientiousness: 'Conscienciosité',
  extraversion: 'Extraversion',
  agreeableness: 'Agréabilité',
  neuroticism: 'Neuroticisme'
}

export default function PersonalityProfileManager() {
  const [profiles, setProfiles] = useState<PersonalityProfile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<PersonalityProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<PersonalityProfile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadProfiles()
  }, [currentPage])

  useEffect(() => {
    applyFilters()
  }, [profiles, searchQuery, filters])

  const loadProfiles = async () => {
    try {
      const response = await fetch(`/api/personality-interview/profiles?page=${currentPage}&per_page=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des profils:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = profiles

    // Recherche textuelle
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(profile => 
        profile.candidate_name.toLowerCase().includes(query) ||
        profile.candidate_email.toLowerCase().includes(query) ||
        profile.communication_style.toLowerCase().includes(query) ||
        profile.personality_summary.toLowerCase().includes(query)
      )
    }

    // Filtres
    if (filters.communication_style) {
      filtered = filtered.filter(profile => profile.communication_style === filters.communication_style)
    }

    if (filters.candidate_gender) {
      filtered = filtered.filter(profile => profile.candidate_gender === filters.candidate_gender)
    }

    if (filters.min_confidence) {
      filtered = filtered.filter(profile => profile.analysis_confidence >= filters.min_confidence)
    }

    if (filters.date_from) {
      filtered = filtered.filter(profile => new Date(profile.created_at) >= new Date(filters.date_from!))
    }

    if (filters.date_to) {
      filtered = filtered.filter(profile => new Date(profile.created_at) <= new Date(filters.date_to!))
    }

    setFilteredProfiles(filtered)
  }

  const getTraitLevel = (value: number) => {
    if (value >= 0.7) return { label: 'Élevé', color: 'text-green-600' }
    if (value >= 0.4) return { label: 'Moyen', color: 'text-yellow-600' }
    return { label: 'Faible', color: 'text-red-600' }
  }

  const formatRadarData = (traits: PersonalityProfile['big_five_traits']) => {
    return Object.entries(traits).map(([trait, value]) => ({
      trait: traitLabels[trait as keyof typeof traitLabels],
      value: Math.round(value * 100),
      fullMark: 100
    }))
  }

  const ProfileCard = ({ profile }: { profile: PersonalityProfile }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center">
            <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="font-semibold text-gray-900">{profile.candidate_name}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">{profile.candidate_email}</p>
          
          <div className="flex items-center mt-2 space-x-3">
            <span className={`px-2 py-1 text-xs rounded-full ${
              communicationStyleColors[profile.communication_style as keyof typeof communicationStyleColors] || 
              'bg-gray-100 text-gray-800'
            }`}>
              {profile.communication_style}
            </span>
            
            {profile.candidate_gender && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {profile.candidate_gender}
              </span>
            )}
            
            <div className="flex items-center text-xs text-gray-500">
              <SparklesIcon className="w-3 h-3 mr-1" />
              {Math.round(profile.analysis_confidence * 100)}% confiance
            </div>
          </div>
        </div>
        
        <button
          onClick={() => {
            setSelectedProfile(profile)
            setShowProfileModal(true)
          }}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <EyeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Traits principaux */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Object.entries(profile.big_five_traits).map(([trait, value]) => {
          const level = getTraitLevel(value)
          return (
            <div key={trait} className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                {traitLabels[trait as keyof typeof traitLabels]}
              </div>
              <div className={`text-sm font-medium ${level.color}`}>
                {level.label}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${value * 100}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Résumé de personnalité */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {profile.personality_summary}
      </p>

      {/* Facteurs de motivation */}
      {profile.motivation_factors.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Facteurs de motivation:</p>
          <div className="flex flex-wrap gap-1">
            {profile.motivation_factors.slice(0, 3).map((factor, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                {factor}
              </span>
            ))}
            {profile.motivation_factors.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                +{profile.motivation_factors.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Date de création */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <CalendarIcon className="w-3 h-3 mr-1" />
          {new Date(profile.created_at).toLocaleDateString('fr-FR')}
        </div>
        <button 
          onClick={() => {
            setSelectedProfile(profile)
            setShowProfileModal(true)
          }}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Voir détails →
        </button>
      </div>
    </div>
  )

  const ProfileModal = () => {
    if (!selectedProfile) return null

    const radarData = formatRadarData(selectedProfile.big_five_traits)

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Profil de Personnalité - {selectedProfile.candidate_name}
                </h2>
                <p className="text-gray-600">{selectedProfile.candidate_email}</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Graphique radar des traits */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Profil Big Five</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="trait" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informations Générales</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Style de communication:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      communicationStyleColors[selectedProfile.communication_style as keyof typeof communicationStyleColors]
                    }`}>
                      {selectedProfile.communication_style}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Style d'interaction:</span>
                    <span className="font-medium">{selectedProfile.preferred_interaction_style}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confiance de l'analyse:</span>
                    <span className="font-medium">{Math.round(selectedProfile.analysis_confidence * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date d'analyse:</span>
                    <span className="font-medium">
                      {new Date(selectedProfile.analysis_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Traits Détaillés</h4>
                <div className="space-y-3">
                  {Object.entries(selectedProfile.big_five_traits).map(([trait, value]) => {
                    const level = getTraitLevel(value)
                    return (
                      <div key={trait}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">
                            {traitLabels[trait as keyof typeof traitLabels]}
                          </span>
                          <span className={`text-sm font-medium ${level.color}`}>
                            {Math.round(value * 100)}% - {level.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${value * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Résumé de personnalité */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Résumé de Personnalité</h4>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {selectedProfile.personality_summary}
              </p>
            </div>

            {/* Forces et axes de développement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <SparklesIcon className="w-4 h-4 text-green-500 mr-2" />
                  Forces
                </h4>
                <ul className="space-y-2">
                  {selectedProfile.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <ChartBarIcon className="w-4 h-4 text-blue-500 mr-2" />
                  Axes de Développement
                </h4>
                <ul className="space-y-2">
                  {selectedProfile.development_areas.map((area, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Facteurs de motivation et stress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Facteurs de Motivation</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.motivation_factors.map((factor, index) => (
                    <span key={index} className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Indicateurs de Stress</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.stress_indicators.map((indicator, index) => (
                    <span key={index} className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full">
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fermer
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Générer un Rapport
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-500 mr-3" />
            Profils de Personnalité
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion et analyse des profils Big Five
          </p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FunnelIcon className="w-5 h-5 mr-2" />
          Filtres
        </button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-white p-4 border border-gray-200 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style de communication
              </label>
              <select
                value={filters.communication_style || ''}
                onChange={(e) => setFilters({...filters, communication_style: e.target.value || undefined})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Tous</option>
                <option value="direct">Direct</option>
                <option value="diplomatic">Diplomatique</option>
                <option value="analytical">Analytique</option>
                <option value="expressive">Expressif</option>
                <option value="balanced">Équilibré</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Genre
              </label>
              <select
                value={filters.candidate_gender || ''}
                onChange={(e) => setFilters({...filters, candidate_gender: e.target.value || undefined})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Tous</option>
                <option value="male">Masculin</option>
                <option value="female">Féminin</option>
                <option value="non-binary">Non-binaire</option>
                <option value="prefer-not-to-say">Préfère ne pas dire</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confiance minimale
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.min_confidence || 0}
                onChange={(e) => setFilters({...filters, min_confidence: parseFloat(e.target.value)})}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((filters.min_confidence || 0) * 100)}%
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({})}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{profiles.length}</div>
          <div className="text-sm text-gray-600">Profils totaux</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{filteredProfiles.length}</div>
          <div className="text-sm text-gray-600">Profils filtrés</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {profiles.length > 0 ? Math.round(profiles.reduce((acc, p) => acc + p.analysis_confidence, 0) / profiles.length * 100) : 0}%
          </div>
          <div className="text-sm text-gray-600">Confiance moyenne</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {new Set(profiles.map(p => p.communication_style)).size}
          </div>
          <div className="text-sm text-gray-600">Styles différents</div>
        </div>
      </div>

      {/* Liste des profils */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map(profile => (
          <ProfileCard key={profile.id} profile={profile} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Précédent
          </button>
          
          <span className="px-3 py-2 text-gray-600">
            Page {currentPage} sur {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Message si aucun profil */}
      {filteredProfiles.length === 0 && !loading && (
        <div className="text-center py-12">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun profil trouvé
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || Object.keys(filters).length > 0 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par créer votre premier entretien avec analyse de personnalité'
            }
          </p>
          {!searchQuery && Object.keys(filters).length === 0 && (
            <button 
              onClick={() => window.location.href = '/interviews/create?type=personality'}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Créer un entretien IA
            </button>
          )}
        </div>
      )}

      {/* Modal de détail du profil */}
      {showProfileModal && <ProfileModal />}
    </div>
  )
}