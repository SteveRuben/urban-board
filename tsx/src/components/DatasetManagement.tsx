// components/DatasetManagement.tsx
import { useState, useEffect } from 'react';
import { Plus, Upload, Database, FileSpreadsheet, Download, Trash2, Eye } from 'lucide-react';
import { ExtendedCodingPlatformService } from '@/services/extended-coding-platform-service';
import { ExerciseDataset, DatasetFormData, DatasetType } from '@/types/coding-plateform';

interface DatasetManagementProps {
  exerciseId: string;
  exerciseTitle: string;
}

export default function DatasetManagement({ exerciseId, exerciseTitle }: DatasetManagementProps) {
  const [datasets, setDatasets] = useState<ExerciseDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
  }, [exerciseId]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const data = await ExtendedCodingPlatformService.getExerciseDatasets(exerciseId);
      setDatasets(data);
    } catch (err) {
      console.error('Erreur lors du chargement des datasets:', err);
      setError('Impossible de charger les datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetCreated = (newDataset: ExerciseDataset) => {
    setDatasets(prev => [...prev, newDataset]);
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des datasets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-6 w-6 text-emerald-600 mr-3" />
              <div>
                <h2 className="text-lg font-medium text-gray-800">Datasets</h2>
                <p className="text-sm text-gray-600">{exerciseTitle}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un dataset
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Datasets List */}
        <div className="p-6">
          {datasets.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun dataset</h3>
              <p className="text-gray-600 mb-4">
                Ajoutez des datasets pour permettre aux candidats d'analyser des données réelles.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier dataset
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {datasets.map((dataset) => (
                <DatasetCard key={dataset.id} dataset={dataset} onUpdate={loadDatasets} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <DatasetCreateForm
          exerciseId={exerciseId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleDatasetCreated}
        />
      )}
    </div>
  );
}

// Dataset Card Component
interface DatasetCardProps {
  dataset: ExerciseDataset;
  onUpdate: () => void;
}

function DatasetCard({ dataset, onUpdate }: DatasetCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const getDatasetIcon = (type: DatasetType) => {
    const icons = {
      csv: FileSpreadsheet,
      excel: FileSpreadsheet,
      json: FileSpreadsheet,
      sqlite: Database,
      postgresql: Database,
      mysql: Database,
      parquet: FileSpreadsheet
    };
    return icons[type] || FileSpreadsheet;
  };

  const formatFileSize = (sizeMb: number) => {
    if (sizeMb < 1) return `${Math.round(sizeMb * 1024)} KB`;
    return `${sizeMb.toFixed(1)} MB`;
  };

  const Icon = getDatasetIcon(dataset.dataset_type);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <Icon className="h-8 w-8 text-emerald-600 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">{dataset.name}</h3>
            <p className="text-sm text-gray-600">
              {ExtendedCodingPlatformService.getDatasetTypeLabel(dataset.dataset_type)}
            </p>
          </div>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded">
          {formatFileSize(dataset.size_mb)}
        </span>
      </div>

      {dataset.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{dataset.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <span>{dataset.row_count.toLocaleString()} lignes</span>
        <span>{new Date(dataset.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowPreview(true)}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Eye className="h-4 w-4 mr-1" />
          Aperçu
        </button>
        {dataset.file_path && (
          <button className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <DatasetPreviewModal
          dataset={dataset}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// Dataset Create Form
interface DatasetCreateFormProps {
  exerciseId: string;
  onClose: () => void;
  onSuccess: (dataset: ExerciseDataset) => void;
}

function DatasetCreateForm({ exerciseId, onClose, onSuccess }: DatasetCreateFormProps) {
  const [formData, setFormData] = useState<DatasetFormData>({
    name: '',
    description: '',
    dataset_type: 'csv'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.dataset_type) newErrors.dataset_type = 'Le type est requis';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const dataset = await ExtendedCodingPlatformService.createExerciseDataset(exerciseId, formData);
      onSuccess(dataset);
    } catch (err) {
      console.error('Erreur lors de la création du dataset:', err);
      setErrors({ general: 'Erreur lors de la création du dataset' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Nouveau dataset</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du dataset *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Données de ventes e-commerce"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                placeholder="Décrivez le contenu et l'utilisation de ce dataset..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de dataset *
              </label>
              <select
                value={formData.dataset_type}
                onChange={(e) => setFormData(prev => ({ ...prev, dataset_type: e.target.value as DatasetType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="json">JSON</option>
                <option value="sqlite">SQLite</option>
                <option value="postgresql">PostgreSQL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fichier ou chemin
              </label>
              <input
                type="text"
                value={formData.file_path || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, file_path: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: datasets/csv/sales.csv"
              />
              <p className="mt-1 text-sm text-gray-500">
                Chemin relatif vers le fichier ou chaîne de connexion pour les bases de données
              </p>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {errors.general}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le dataset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Dataset Preview Modal
interface DatasetPreviewModalProps {
  dataset: ExerciseDataset;
  onClose: () => void;
}

function DatasetPreviewModal({ dataset, onClose }: DatasetPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{dataset.name}</h3>
            <p className="text-sm text-gray-600">
              {ExtendedCodingPlatformService.getDatasetTypeLabel(dataset.dataset_type)} • {dataset.row_count.toLocaleString()} lignes
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {dataset.description && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{dataset.description}</p>
            </div>
          )}

          {dataset.schema_definition && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Structure</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-800 overflow-x-auto">
                  {JSON.stringify(dataset.schema_definition, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {dataset.sample_data && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Aperçu des données</h4>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800">
                  {JSON.stringify(dataset.sample_data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!dataset.sample_data && !dataset.schema_definition && (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Aucun aperçu disponible pour ce dataset</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}