import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../utils/axios'
import PageWrapper from '../../components/PageWrapper/PageWrapper'
import Alert from '../../components/Alert/Alert'
import Spinner from '../../components/Spinner/Spinner'
import Badge from '../../components/Badge/Badge'
import AddRepositoryModal from '../../components/Modals/AddRepositoryModal'
import { Project } from '../../types/project'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const res = await api.get<Project>(`/projects/${id}`)
      setProject(res.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRepository = async (data: { repo_name: string; branch: string; purpose: string; createNew: boolean; description?: string; isPrivate?: boolean }) => {
    await api.post(`/projects/${id}/repos`, data)
    setIsModalOpen(false)
    fetchProject()
  }

  const handleRemoveRepository = async (repoId: string) => {
    if (!confirm('Are you sure you want to remove this repository?')) return
    try {
      await api.delete(`/projects/${id}/repos/${repoId}`)
      fetchProject()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove repository')
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to completely delete this project and detach all its repositories? This action cannot be undone.')) return
    try {
      await api.delete(`/projects/${id}`)
      navigate('/dashboard')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete project')
    }
  }

  if (loading) return <PageWrapper><Spinner /></PageWrapper>
  if (error) return <PageWrapper><Alert message={error} /></PageWrapper>
  if (!project) return <PageWrapper><Alert message="Project not found" /></PageWrapper>

  return (
    <PageWrapper>
      <div className="mb-6">
        <Link to="/dashboard" replace className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          &larr; Back to Dashboard
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500 mt-2 max-w-2xl">{project.description || 'No description provided.'}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleDeleteProject}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 font-medium transition-colors"
            >
              Delete Project
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              + Add Repository
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Repositories</h3>

        {(!project.repos || project.repos.length === 0) ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-10 text-center">
            <p className="text-gray-500 mb-4">No repositories linked to this project yet.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 font-medium hover:underline"
            >
              Link a GitHub Repository
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repository</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {project.repos.map((repo) => (
                  <tr key={repo._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/repository/${repo.repo_name}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {repo.repo_name}
                      </Link>
                      <div className="text-xs text-gray-500">Added {new Date(repo.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {repo.branch}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        label={repo.purpose}
                        variant={repo.purpose === 'FE' ? 'success' : repo.purpose === 'BE' ? 'warning' : 'neutral'}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemoveRepository(repo._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddRepositoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddRepository}
      />
    </PageWrapper>
  )
}
