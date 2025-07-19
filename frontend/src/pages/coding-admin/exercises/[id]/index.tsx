import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Plus, Edit, Trash, Eye, Clock, Target, Code, BookOpen, CheckCircle } from 'lucide-react';
import { CodingPlatformService } from '@/services/coding-platform-service';
import { Challenge, ChallengeStatus, Exercise } from '@/types/coding-plateform';

export default function ExerciseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const exerciseId = id?.toString();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (exerciseId) {
      loadExerciseAndChallenges();
    }
  }, [exerciseId]);

  const loadExerciseAndChallenges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger l'exercice avec ses challenges
      const exerciseData = await CodingPlatformService.getExercise(exerciseId || '');
      setExercise(exerciseData);
      setChallenges(exerciseData.challenges || []);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Impossible de charger l\'exercice. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce challenge ? Cette action supprimera également toutes les étapes associées.')) {
      return;
    }
    
    try {
      await CodingPlatformService.deleteChallenge(challengeId);
      setChallenges(prev => prev.filter(challenge => challenge.id !== challengeId));
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Impossible de supprimer le challenge. Veuillez réessayer.');
    }
  };

  const getStatusBadgeClass = (status: ChallengeStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Chargement de l'exercice...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-red-600 mb-4">{error || 'Exercice non trouvé'}</p>
              <Link
                href="/coding-admin/exercises"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux exercices
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{exercise.title} - Gestion des challenges</title>
        <meta name="description" content={`Gérer les challenges de l'exercice: ${exercise.title}`} />
      </Head>

      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Navigation */}
            <div className="flex items-center mb-6">
              <Link
                href="/coding-admin/exercises"
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour aux exercices
              </Link>
            </div>

            {/* En-tête de l'exercice */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <Code className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800">{exercise.title}</h1>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-md ${getDifficultyBadgeClass(exercise.difficulty)}`}>
                          {CodingPlatformService.getDifficultyLabel(exercise.difficulty)}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                          {CodingPlatformService.getLanguageLabel(exercise.language)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Ordre: {exercise.order_index}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{exercise.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-500 space-x-6">
                    <span>Créé le {formatDate(exercise.created_at)}</span>
                    <span>Modifié le {formatDate(exercise.updated_at)}</span>
                    <span>{exercise.challenge_count} challenge(s)</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-6">
                  <Link
                    href={`/coding-admin/exercises/${exercise.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Link>
                </div>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Section des challenges */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-lg font-medium text-gray-800">
                    Challenges ({challenges.length})
                  </h2>
                </div>
                <Link
                  href={`/coding-admin/exercises/${exercise.id}/challenges/new`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau challenge
                </Link>
              </div>

              {challenges.length === 0 ? (
                <div className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Aucun challenge créé pour cet exercice.</p>
                  <Link
                    href={`/coding-admin/exercises/${exercise.id}/challenges/new`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier challenge
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {challenges.map((challenge) => (
                    <div key={challenge.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-medium text-gray-900 mr-3">
                              {challenge.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-md ${getStatusBadgeClass(challenge.status)}`}>
                              {CodingPlatformService.getChallengeStatusLabel(challenge.status)}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-3 line-clamp-2">{challenge.description}</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {challenge.estimated_time_minutes} min
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {challenge.step_count} étape(s)
                            </div>
                            <span>Ordre: {challenge.order_index}</span>
                            <span>Créé le {formatDate(challenge.created_at)}</span>
                          </div>
                          
                          {challenge.tags && challenge.tags.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {challenge.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {challenge.constraints && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-600">
                                <strong>Contraintes:</strong> {challenge.constraints}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-6">
                          <Link
                            href={`/coding-admin/challenges/${challenge.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="Voir les étapes"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          
                          <Link
                            href={`/coding-admin/challenges/${challenge.id}/edit`}
                            className="text-gray-600 hover:text-gray-800"
                            title="Modifier"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          
                          <button
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <Trash className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions rapides */}
            {challenges.length > 0 && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Target className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Actions rapides</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Vous pouvez maintenant :</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Cliquer sur un challenge pour gérer ses étapes et cas de test</li>
                        <li>Modifier l'ordre des challenges en éditant leur numéro d'ordre</li>
                        <li>Publier les challenges terminés pour les rendre disponibles</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}