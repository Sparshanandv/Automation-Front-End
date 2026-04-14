import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Icons } from '../../components/Icons/Icons'
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
                                <Icons.GitHub className="opacity-70" />
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
                                        <Icons.Branch className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                        <span className="font-semibold text-gray-700">{branch}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteBranch(branch)}
                                        className="text-gray-400 hover:text-red-600"
                                        title="Delete Branch"
                                    >
                                        <Icons.Trash className="w-5 h-5" />
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
                                <Icons.Branch size={32} />
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
