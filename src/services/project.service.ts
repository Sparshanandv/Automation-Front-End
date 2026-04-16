import api from "../utils/axios";

/** Must match backend multer `.single('...')` field name */
const README_FILE_FIELD = "file";

export const projectService = {
  async uploadRepoReadme(
    projectId: string,
    repoId: string,
    file: File,
    commitMessage?: string,
  ): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append(README_FILE_FIELD, file);
    if (commitMessage?.trim()) {
      formData.append("commitMessage", commitMessage.trim());
    }
    const res = await api.put<{ message: string }>(
      `/projects/${projectId}/repos/${repoId}/readme`,
      formData,
    );
    return res.data;
  },
};
