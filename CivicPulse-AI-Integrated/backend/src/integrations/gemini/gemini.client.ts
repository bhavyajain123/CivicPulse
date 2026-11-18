import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

const MAX_ATTEMPTS = 3;

const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error
    ? error.message
    : String(error);
};

const isTemporaryError = (message: string): boolean => {
  return /503|429|500|overloaded|high demand|temporarily unavailable|service unavailable|RESOURCE_EXHAUSTED/i.test(
    message
  );
};

const isOverloadedError = (message: string): boolean => {
  return /503|UNAVAILABLE|overloaded|high demand|service unavailable/i.test(
    message
  );
};

const generateFromModel = async (
  modelName: string,
  prompt: string
): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: modelName
  });

  const result = await model.generateContent(prompt);

  const response = result.response.text();

  if (!response.trim()) {
    throw new Error("AI returned an empty response");
  }

  return response;
};

export const generateAIResponse = async (
  prompt: string
): Promise<string> => {
  let lastError = "";

 
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(
        `[Gemini] ${PRIMARY_MODEL} attempt ${attempt}/${MAX_ATTEMPTS}`
      );

      return await generateFromModel(PRIMARY_MODEL, prompt);

    } catch (error) {
      lastError = getErrorMessage(error);

      console.error(
        `[Gemini] Primary model failed:`,
        lastError
      );

      if (!isTemporaryError(lastError)) {
        throw new Error(
          "AI analysis failed. Please check the AI service configuration."
        );
      }

      if (attempt < MAX_ATTEMPTS) {
     
        const waitTime =
          1500 * Math.pow(2, attempt - 1) +
          Math.floor(Math.random() * 500);

        console.log(
          `[Gemini] Retrying after ${waitTime}ms`
        );

        await delay(waitTime);
      }
    }
  }

  
  if (isOverloadedError(lastError)) {
    try {
      console.warn(
        `[Gemini] Switching to fallback model: ${FALLBACK_MODEL}`
      );

      return await generateFromModel(FALLBACK_MODEL, prompt);

    } catch (fallbackError) {
      console.error(
        "[Gemini] Fallback model failed:",
        getErrorMessage(fallbackError)
      );
    }
  }

  throw new Error(
    "AI service is temporarily unavailable. Please try again later."
  );
};

export default genAI;