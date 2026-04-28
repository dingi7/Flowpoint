export interface GetGenkitServicePayload {
  apiKey: string;
}

export interface ExecutePromptPayload {
  prompt: string;
}

export interface GenkitService {
  executePrompt(payload: ExecutePromptPayload): Promise<string>;
}
