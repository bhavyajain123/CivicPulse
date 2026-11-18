
import { api } from "./api";

export type AnalyzeIncidentInput = {
  description: string;
  location?: {
    latitude: number;
    longitude: number;
  };
};

export type IncidentAnalysis = {
  category: "fire" | "accident" | "medical" | "crime" | "other";
  priority: "low" | "medium" | "high" | "critical";
  summary: string;
  recommendedAction: string;
  confidence: number;
  advisory: boolean;
  locationProvided: boolean;
};

type AnalyzeIncidentResponse = {
  success: boolean;
  message: string;
  analysis: IncidentAnalysis;
};

export type DuplicateIncident = {
  id: string;
  title: string;
  category: string;
  status: string;
  distanceKm: number;
  similarity: number;
  reason: string;
  createdAt: string;
};

export type DuplicateCheckResult = {
  checked: boolean;
  possibleDuplicates: DuplicateIncident[];
  message: string;
};

type DuplicateCheckResponse = {
  success: boolean;
  message: string;
  checked: boolean;
  possibleDuplicates: DuplicateIncident[];
};

export const aiService = {
  analyzeIncident: async (
    data: AnalyzeIncidentInput
  ): Promise<IncidentAnalysis> => {
    const response = await api<AnalyzeIncidentResponse>(
      "/ai/analyze",
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );

    if (!response.success) {
      throw new Error(
        response.message || "AI incident analysis failed"
      );
    }

    return response.analysis;
  },

  checkDuplicates: async (data: {
    title: string;
    description: string;
    category: "fire" | "accident" | "medical" | "crime" | "other";
    location: {
      latitude: number;
      longitude: number;
    };
  }): Promise<DuplicateCheckResult> => {
    const response = await api<DuplicateCheckResponse>(
      "/ai/check-duplicates",
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );

    if (!response.success) {
      throw new Error(
        response.message || "Duplicate detection failed."
      );
    }

    return {
      checked: response.checked,
      possibleDuplicates: response.possibleDuplicates,
      message: response.message
    };
  },
recommendTeams: async (data: {
  title: string;
  description: string;
  category: "fire" | "accident" | "medical" | "crime" | "other";
  priority: "low" | "medium" | "high" | "critical";
  location: {
    latitude: number;
    longitude: number;
  };
}): Promise<TeamRecommendationResult> => {
  const response = await api<TeamRecommendationResponse>(
    "/ai/recommend-teams",
    {
      method: "POST",
      body: JSON.stringify(data)
    }
  );

  if (!response.success) {
    throw new Error(
      response.message || "Team recommendation failed."
    );
  }

  return {
    recommendations: response.recommendations,
    message: response.message
  };
}

};


export type TeamRecommendation = {
  teamId: string;
  teamName: string;
  departmentName: string;
  distanceKm: number;
  membersCount: number;
  score: number;
  reason: string;
  role: "primary" | "support";
};

export type TeamRecommendationResult = {
  recommendations: TeamRecommendation[];
  message: string;
};

type TeamRecommendationResponse = {
  success: boolean;
  message: string;
  recommendations: TeamRecommendation[];
};


export type MLComplaintPrediction = {
  category: string;
  confidence: number;
  probabilities: Record<string, number>;
  priority: string;
  priority_reason: string;
  model_version: string;
  advisory: string;
};

type MLPredictionResponse = { success: boolean; message?: string; prediction: MLComplaintPrediction };

export const mlAiService = {
  predict: async (text: string): Promise<MLComplaintPrediction> => {
    const response = await api<MLPredictionResponse>("/ai/ml/predict", {
      method: "POST", body: JSON.stringify({ text })
    });
    if (!response.success || !response.prediction) throw new Error(response.message || "ML complaint prediction failed");
    return response.prediction;
  }
};
