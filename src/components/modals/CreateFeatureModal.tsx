import { useEffect, useState } from 'react'
import { Feature } from '../../types'
import { featureService } from '../../services/feature.service'
import RichTextEditor from '../common/RichTextEditor'

interface Props {
  onClose: () => void;
  onCreate?: (feature: Feature) => void;
  onUpdate?: (feature: Feature) => void;
  projectId?: string;
  featureToEdit?: Feature;
}

export default function CreateFeatureModal({ onClose, onCreate, projectId,  onUpdate 
, featureToEdit}: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState('')
  const [type, setType] = useState('task')
  const [types, setTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

    const isEditMode = !!featureToEdit;


  useEffect(() => {
    featureService.getTypes().then(setTypes).catch(console.error)
     if (featureToEdit) {
      setTitle(featureToEdit.title);
      setDescription(featureToEdit.description);
      setCriteria(featureToEdit.criteria);
    }
  }, [featureToEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !description.trim() || !criteria.trim()) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    try {
      if (isEditMode) {
        // Edit mode
        const feature = await featureService.update(
          featureToEdit!.id,
          title.trim(),
          description.trim(),
          criteria.trim(),
        );
        onUpdate?.(feature);
      } else {
        // Create mode
        const feature = await featureService.create(
          title.trim(),
          description.trim(),
          criteria.trim(),
           type,
          projectId,
        );
        onCreate?.(feature);
      }
      onClose();
    } catch {
      setError(
        isEditMode
          ? "Failed to edit task. Please try again."
          : "Failed to create task. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEditMode ? "Edit Task" : "Create Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 col-span-1">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Title</label>
              <input
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be built?"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-1">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {types.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Description</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe the feature in detail…"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Acceptance Criteria
            </label>
            <textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="List the conditions that must be met…"
              rows={3}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading
                ? isEditMode
                  ? "Updating…"
                  : "Creating…"
                : isEditMode
                  ? "Update Task"
                  : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
