import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../utils/axios'
import PageWrapper from '../../components/PageWrapper/PageWrapper'
import Alert from '../../components/Alert/Alert'
import Spinner from '../../components/Spinner/Spinner'
import Badge from '../../components/Badge/Badge'
import AddRepositoryModal from '../../components/Modals/AddRepositoryModal'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import { Project } from '../../types/project'
import DescriptionDisplay from '../../components/common/DescriptionDisplay'

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
        <Link to="/dashboard" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mb-4 transition-colors">
          &larr; Back to Dashboard
        </Link>
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-8 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 break-words line-clamp-2">{project.name}</h1>
              {project.projectKey && (
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded tracking-wider mt-1 shrink-0">
                  {project.projectKey}
                </span>
              )}
            </div>
            <div className="mt-4">
              <DescriptionDisplay content={project.description || 'No description provided.'} />
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="danger" onClick={handleDeleteProject}>
              Delete Project
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              + Add Repository
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-4 mb-4 justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Repositories</h3>
          <button
            onClick={() => navigate(`/features?projectId=${id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Go to Task Board →
          </button>
        </div>

        {(!project.repos || project.repos.length === 0) ? (
          <Card padding="lg" className="text-center border-dashed bg-gray-50">
            <p className="text-gray-500 mb-4">No repositories linked to this project yet.</p>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Link a GitHub Repository
            </Button>
          </Card>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRepository(repo._id)}
                        className="text-red-600 hover:text-red-900 hover:bg-red-50"
                      >
                        Remove
                      </Button>
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
