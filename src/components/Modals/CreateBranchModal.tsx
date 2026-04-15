import { useEffect, useState } from "react";
import { Icons } from "../Icons/Icons";
import Button from "../Button/Button";
import Input from "../Input/Input";
import Alert from "../Alert/Alert";

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newBranch: string, fromBranch: string) => Promise<void>;
  branches: string[];
}

export default function CreateBranchModal({
  isOpen,
  onClose,
  onSubmit,
  branches,
}: CreateBranchModalProps) {
  const [newBranch, setNewBranch] = useState("");
  const [fromBranch, setFromBranch] = useState(branches[0] || "main");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (branches.length > 0 && !fromBranch) {
      setFromBranch(branches[0]);
    }
  }, [branches, fromBranch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.trim()) {
      setError("Branch name is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit(newBranch, fromBranch);
      setNewBranch("");
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Create New Branch</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icons.Close />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <Alert message={error} className="mb-2" />}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              From Branch (Parent)
            </label>
            <select
              value={fromBranch}
              onChange={(e) => setFromBranch(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all outline-none text-sm"
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Select the existing branch to create your new branch from.
            </p>
          </div>

          <Input
            label="New Branch Name"
            placeholder="e.g. feature/new-page"
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            required
            autoFocus
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={loading}
            >
              Create Branch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
