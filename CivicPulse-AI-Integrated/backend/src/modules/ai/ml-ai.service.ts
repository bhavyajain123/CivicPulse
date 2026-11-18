import Incident from "../incidents/incident.model";

const AI_SERVICE_URL = (process.env.ML_AI_SERVICE_URL || "http://127.0.0.1:8001").replace(/\/$/, "");

async function callAI<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const detail = typeof payload.detail === "string" ? payload.detail : `ML AI service returned ${response.status}`;
    throw new Error(detail);
  }
  return payload as T;
}

export type MLComplaintPrediction = {
  category: string; confidence: number; probabilities: Record<string, number>;
  priority: string; priority_reason: string; model_version: string; advisory: string;
};

export const predictComplaintWithML = async (text: string) =>
  callAI<MLComplaintPrediction>("/api/v1/predict", { text });

export const getMLModelInfo = async () => callAI<Record<string, unknown>>("/api/v1/model-info");

export const findMLDuplicateCandidates = async (text: string) => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = await Incident.find({ createdAt: { $gte: cutoff } })
    .select("_id title description")
    .sort({ createdAt: -1 }).limit(200).lean();
  return callAI<{ matches: Array<{ complaint_id: string; similarity: number }>; threshold: number; advisory: string }>(
    "/api/v1/duplicates",
    { text, existing_complaints: recent.map((item) => ({
      complaint_id: item._id.toString(),
      text: `${item.title || ""} ${item.description || ""}`.trim()
    })).filter((item) => item.text.length >= 5) }
  );
};
