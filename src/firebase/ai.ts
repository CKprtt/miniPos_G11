import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "./config";

const ai = getAI(app, {
  backend: new GoogleAIBackend(),
});

export const aiModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-lite",
});