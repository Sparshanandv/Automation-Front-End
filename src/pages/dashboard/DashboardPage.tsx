import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/axios'
import PageWrapper from '../../components/PageWrapper/PageWrapper'
import Alert from '../../components/Alert/Alert'
import Spinner from '../../components/Spinner/Spinner'
import CreateProjectModal from '../../components/Modals/CreateProjectModal'
import { Project } from '../../types/project'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await api.get<Project[]>('/projects')
      setProjects(res.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (data: { name: string; description: string }) => {
    try {
      await api.post('/projects', data)
      setIsModalOpen(false)
      fetchProjects()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project')
    }
  }

  return (
    <PageWrapper>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your active projects and repositories.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          + New Project
        </button>
      </div>

      {error && <Alert message={error} className="mb-6" />}
      {loading && <Spinner />}

      {!loading && !error && projects.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
          <p className="text-gray-500 mb-4">You don't have any projects yet.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Create your first project
          </button>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow hover:border-blue-300"
            >
              <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">{project.name}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-10">
                {project.description || 'No description provided.'}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </PageWrapper>
  )
}
