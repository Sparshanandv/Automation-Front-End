import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/axios'
import PageWrapper from '../../components/PageWrapper/PageWrapper'
import Alert from '../../components/Alert/Alert'
import Spinner from '../../components/Spinner/Spinner'
import CreateProjectModal from '../../components/Modals/CreateProjectModal'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import { Project } from '../../types/project'
import { stripHtml } from '../../utils/stringUtils'

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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your active projects and repositories.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            + New Project
          </Button>
        </div>
      </div>

      {error && <Alert message={error} className="mb-6" />}
      {loading && <Spinner />}

      {!loading && !error && projects.length === 0 && (
        <Card padding="lg" className="text-center border-dashed bg-gray-50">
          <p className="text-gray-500 mb-4">You don't have any projects yet.</p>
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            Create your first project
          </Button>
        </Card>
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="block hover:shadow-md transition-shadow"
            >
              <Card className="h-full hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">{project.name}</h3>
                  {project.projectKey && (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-2 shrink-0">
                      {project.projectKey}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-10">
                  {project.description ? stripHtml(project.description) : 'No description provided.'}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </Card>
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
