import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/axios'
import PageWrapper from '../../components/PageWrapper/PageWrapper'
import Alert from '../../components/Alert/Alert'
import Spinner from '../../components/Spinner/Spinner'
import CreateBranchModal from '../../components/Modals/CreateBranchModal'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import { useToast } from '../../context/ToastContext'

export default function RepositoryDetailsPage() {
    const { owner, repo } = useParams<{ owner: string; repo: string }>()
    const repoName = `${owner}/${repo}`

    const [branches, setBranches] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const toast = useToast()

    useEffect(() => {
        if (owner && repo) {
            fetchBranches()
        }
    }, [owner, repo])

    const fetchBranches = async () => {
        try {
            setLoading(true)
            const res = await api.get<string[]>(`/github/branches?repo_name=${repoName}`)
            setBranches(res.data)
            setError('')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch branches. Make sure the repository exists and the token is valid.')
            setBranches([])
        } finally {
            setLoading(false)
        }
    }

    const handleCreateBranch = async (newBranch: string, fromBranch: string) => {
        await api.post('/github/branches', {
            repo_name: repoName,
            new_branch: newBranch,
            from_branch: fromBranch
        })
        toast('Branch created successfully!', 'success')
        await fetchBranches()
    }

    const handleDeleteBranch = async (branchName: string) => {
        if (window.confirm(`Are you sure you want to delete the branch "${branchName}"?`)) {
            try {
                setLoading(true)
                await api.delete(`/github/branches?repo_name=${repoName}&branch_name=${branchName}`)
                toast(`Branch ${branchName} deleted successfully!`, 'success')
                await fetchBranches()
            } catch (err: any) {
                toast(err.response?.data?.message || 'Failed to delete branch.', 'error')
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <PageWrapper>
            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-8">
                    <Link to="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-6 transition-colors">
                        &larr; Back to Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                                <svg className="w-5 h-5 opacity-70" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                <span className="font-medium">{owner}</span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                {repo}
                            </h1>
                        </div>

                        <Button
                            onClick={() => setIsModalOpen(true)}
                            disabled={loading}
                        >
                            Create New Branch
                        </Button>
                    </div>
                </div>

                {error && <Alert message={error} className="mb-6" />}

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Spinner />
                    </div>
                ) : branches.length > 0 ? (
                    <Card padding="none" className="overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Repository Branches
                            </h3>
                        </div>
                        <ul className="divide-y divide-gray-100">
                            {branches.map(branch => (
                                <li key={branch} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        <span className="font-semibold text-gray-700">{branch}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteBranch(branch)}
                                        className="text-gray-400 hover:text-red-600"
                                        title="Delete Branch"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                                Total <span className="text-blue-600 font-bold">{branches.length}</span> branches
                            </p>
                        </div>
                    </Card>
                ) : (
                    <Card padding="lg" className="text-center bg-gray-50 border-dashed">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-lg font-bold">No branches found</p>
                        <p className="text-gray-400 mt-1 text-sm">Try refreshing or check your GitHub permissions.</p>
                    </Card>
                )}
            </div>

            <CreateBranchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateBranch}
                branches={branches}
            />
        </PageWrapper>
    )
}
