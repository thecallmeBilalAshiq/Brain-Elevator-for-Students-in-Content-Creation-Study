import { GoogleGenAI, Modality, Type } from "@google/genai";

// Helper to check and get key for Veo/High-Res features
export const ensureApiKey = async (): Promise<string | undefined> => {
  // 1. Try Window/AIStudio selection (Best for Veo billing)
  if (window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (hasKey) {
      // If we can get it from here, great, otherwise fall through
      return undefined; 
    }
  }
  
  // 2. Try Process Env
  if (process.env.API_KEY) return process.env.API_KEY;

  console.error("API_KEY environment variable is missing.");
  throw new Error("API Key is missing. Please set the API_KEY environment variable.");
};

const getClient = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// Chat with Tools & Thinking
export const generateChatResponse = async (
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  message: string,
  config: { googleSearch?: boolean; googleMaps?: boolean; thinking?: boolean; fast?: boolean },
  file?: { data: string; mimeType: string }
) => {
  const ai = getClient();
  
  // Model Selection Logic
  let modelId = 'gemini-3-pro-preview'; // Default for complex tasks
  if (config.fast) modelId = 'gemini-2.5-flash-lite';
  if (config.googleSearch || config.googleMaps) modelId = 'gemini-2.5-flash';
  if (config.thinking) modelId = 'gemini-3-pro-preview';
  
  const tools: any[] = [];
  if (config.googleSearch) tools.push({ googleSearch: {} });
  if (config.googleMaps) tools.push({ googleMaps: {} });

  const generationConfig: any = {
    tools: tools.length > 0 ? tools : undefined,
  };

  if (config.thinking) {
    generationConfig.thinkingConfig = { thinkingBudget: 32768 };
  }

  if (config.googleMaps) {
     try {
      const pos: GeolocationPosition = await new Promise((resolve, reject) => 
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      generationConfig.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }
        }
      }
     } catch (e) {
       console.warn("Could not get location for Maps", e);
     }
  }

  const chat = ai.chats.create({
    model: modelId,
    history: history,
    config: generationConfig,
  });

  // Construct message content
  let msgContent: any = [{ text: message }];
  if (file) {
    msgContent.push({ inlineData: { data: file.data, mimeType: file.mimeType } });
  }

  const result = await chat.sendMessage({
    message: msgContent
  });
  
  return {
    text: result.text,
    grounding: result.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

// Image Generation
export const generateImage = async (prompt: string, size: "1K" | "2K" | "4K", aspectRatio: string) => {
  await ensureApiKey();
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: aspectRatio as any,
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// Image Editing
export const editImage = async (prompt: string, base64Image: string, mimeType: string) => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image edited");
};

// Google Veo Video Generation
export const generateVideo = async (
  prompt: string, 
  aspectRatio: "16:9" | "9:16", 
  image?: { data: string, mimeType: string }
) => {
  const key = process.env.API_KEY;
  if (!key) {
     throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: key });
  const model = 'veo-3.1-fast-generate-preview';
  
  let requestObj: any = {
    model,
    prompt: prompt || "A video",
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio,
    }
  };

  if (image) {
    requestObj.image = {
      imageBytes: image.data,
      mimeType: image.mimeType,
    };
  }

  try {
    let operation = await ai.models.generateVideos(requestObj);

    // Poll for completion
    const pollInterval = 5000;
    const maxRetries = 60;
    let attempts = 0;

    while (!operation.done && attempts < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      try {
        operation = await ai.operations.getVideosOperation({ operation });
      } catch (pollError: any) {
        console.warn("Polling error (might be transient):", pollError);
        // Continue polling despite transient errors
      }
      attempts++;
    }

    if (!operation.done) {
        throw new Error("Video generation timed out.");
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI in response");
    
    return `${videoUri}&key=${key}`;

  } catch (e: any) {
    console.error("Veo Error:", e);
    if (e.message?.includes('404')) {
        throw new Error("Veo model not found. Ensure your project has access to 'veo-3.1-fast-generate-preview' and billing is enabled.");
    }
    throw e;
  }
};

// Kie.ai Veo Generation
export const generateVideoKie = async (prompt: string, apiKey: string) => {
  if (!apiKey) throw new Error("Kie.ai API Key is required");

  // 1. Start Generation
  const response = await fetch('https://api.kie.ai/api/v1/veo/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'veo3_fast',
      prompt: prompt,
      aspectRatio: '16:9'
    })
  });

  const data = await response.json();
  if (data.code !== 200 || !data.data?.taskId) {
     throw new Error(`Kie.ai Error: ${data.msg || 'Unknown error'}`);
  }

  const taskId = data.data.taskId;

  // 2. Poll for Status
  const pollInterval = 3000;
  const maxRetries = 100;
  let attempts = 0;

  while (attempts < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    const statusRes = await fetch(`https://api.kie.ai/api/v1/veo/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const statusData = await statusRes.json();
    
    // Check for success based on typical async task response
    // Assuming status field is 'status' or 'state'
    const taskStatus = statusData.data?.status; // Adjust based on actual response if needed
    
    if (taskStatus === 'SUCCEEDED' || taskStatus === 'SUCCESS') {
       // Look for video URL
       const videoUrl = statusData.data?.results?.video_url || statusData.data?.videoUrl || statusData.data?.result;
       if (videoUrl) return videoUrl;
    } else if (taskStatus === 'FAILED') {
       throw new Error(`Kie.ai generation failed: ${statusData.data?.error || 'Unknown'}`);
    }

    attempts++;
  }
  
  throw new Error("Video generation timed out");
};

// Audio Generation (TTS)
export const generateSpeech = async (text: string) => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: {
      parts: [{ text }],
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64) throw new Error("No audio generated");
  return base64;
};

// Audio Transcription
export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
       parts: [
         { inlineData: { data: base64Audio, mimeType } },
         { text: "Transcribe this audio exactly." }
       ]
    }
  });
  return response.text || "No transcription available.";
};

// Analyze Media (Multimodal)
export const analyzeMedia = async (file: File, prompt: string) => {
  const ai = getClient();
  
  // Convert File to Base64
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: file.type } },
        { text: prompt }
      ]
    }
  });

  return response.text || "No analysis available.";
};

// Generate Content from Notes (Creator Hub)
export const generateContentFromNotes = async (notes: string, formatTitle: string, promptTemplate: string) => {
  const ai = getClient();
  const prompt = `
    CONTEXT:
    ${notes}

    TASK:
    ${promptTemplate}
    
    FORMAT:
    ${formatTitle}

    Create high-quality, engaging content based ONLY on the notes provided.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [{ text: prompt }]
    }
  });

  return response.text || "Failed to generate content.";
};

// Batch Content Generation
export const generateBatchContent = async (topic: string, notes: string) => {
  const ai = getClient();
  const prompt = `
    Generate content in ALL 10 formats from these study notes.
    TOPIC: ${topic}
    NOTES: ${notes.substring(0, 10000)}

    Respond with a JSON object containing keys for: tiktok, youtube, instagram, twitter, flashcards, quiz, blog, podcast, guide, summary.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      responseMimeType: 'application/json'
    }
  });

  if (!response.text) throw new Error("No response");
  
  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("JSON Parse Error", e);
    throw new Error("Failed to parse batch response");
  }
};

// Suggest Workflows
export const suggestWorkflows = async (profile: any, notes: string) => {
  const ai = getClient();
  const prompt = `
    Based on this student's profile: ${JSON.stringify(profile)}
    And these notes: ${notes.substring(0, 500)}...
    
    Suggest personalized automation workflows.
    Respond with JSON: { recommended_workflows: [], quick_wins: [] }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      responseMimeType: 'application/json'
    }
  });

  if (!response.text) throw new Error("No response");
  return JSON.parse(response.text);
};