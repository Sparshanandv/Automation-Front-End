import { useEffect, useRef, useState, type ChangeEvent } from 'react'
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
import { useToast } from '../../context/ToastContext'
import { projectService } from '../../services/project.service'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const readmeInputRef = useRef<HTMLInputElement>(null)
  const pendingReadmeRepoIdRef = useRef<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [unlinkingRepoId, setUnlinkingRepoId] = useState<string | null>(null)
  const [unlinkError, setUnlinkError] = useState('')
  const [uploadingReadmeRepoId, setUploadingReadmeRepoId] = useState<string | null>(null)

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

  const handleUnlinkRepository = async (repoId: string) => {
    try {
      setUnlinkError('')
      await api.delete(`/projects/${id}/repos/${repoId}`)
      setUnlinkingRepoId(null)
      fetchProject()
    } catch (err: any) {
      setUnlinkError(err.response?.data?.message || 'Failed to unlink repository')
      setUnlinkingRepoId(null)
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

  const handleUploadReadmeClick = (repoId: string) => {
    pendingReadmeRepoIdRef.current = repoId
    readmeInputRef.current?.click()
  }

  const handleReadmeFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const repoId = pendingReadmeRepoIdRef.current
    pendingReadmeRepoIdRef.current = null
    e.target.value = ''
    if (!file || !repoId || !id) return

    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.md') && !lower.endsWith('.markdown')) {
      toast('Please choose a Markdown file (.md or .markdown).', 'error')
      return
    }

    try {
      setUploadingReadmeRepoId(repoId)
      await projectService.uploadRepoReadme(id, repoId, file)
      toast('README updated successfully.', 'success')
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to upload README.', 'error')
    } finally {
      setUploadingReadmeRepoId(null)
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
            <div className="flex items-center gap-3 max-w-[50vw]">
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

      {unlinkError && <Alert message={unlinkError} variant="error" className="mt-4" />}

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
                      {unlinkingRepoId === repo._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-500">Unlink this repo?</span>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleUnlinkRepository(repo._id)}
                          >
                            Yes, unlink
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUnlinkingRepoId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={uploadingReadmeRepoId === repo._id}
                            disabled={uploadingReadmeRepoId !== null && uploadingReadmeRepoId !== repo._id}
                            onClick={() => handleUploadReadmeClick(repo._id)}
                            aria-label={`Upload README for ${repo.repo_name}`}
                          >
                            Upload README
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setUnlinkError(''); setUnlinkingRepoId(repo._id) }}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50"
                            disabled={uploadingReadmeRepoId !== null}
                          >
                            Unlink
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <input
        ref={readmeInputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={handleReadmeFileChange}
      />

      <AddRepositoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={project._id}
        onSubmit={handleAddRepository}
      />
    </PageWrapper>
  )
}
