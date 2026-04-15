import api from "../utils/axios";
import { QAGenerationResponse } from "../types";

export const qaService = {
  async generateTestCases(featureId: string): Promise<QAGenerationResponse> {
    const res = await api.post<QAGenerationResponse>(
      `/ai/qa/generate/${featureId}`,
    );
    return res.data;
  },
};
