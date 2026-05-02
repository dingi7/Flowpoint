export interface GetGenkitServicePayload {
  apiKey: string;
}

export interface ExecutePromptPayload {
  prompt: string;
}

export interface ExecuteMultimodalPromptPayload {
  prompt: string;
  media: {
    url: string;
    contentType: string;
  };
}

export interface ExecuteImageEditPayload {
  prompt: string;
  referenceImage: {
    dataUrl: string;
    contentType: string;
  };
}

export interface GenkitService {
  executePrompt(payload: ExecutePromptPayload): Promise<string>;
  executeMultimodalPrompt(payload: ExecuteMultimodalPromptPayload): Promise<string>;
  executeImageEdit(payload: ExecuteImageEditPayload): Promise<string>;
}
