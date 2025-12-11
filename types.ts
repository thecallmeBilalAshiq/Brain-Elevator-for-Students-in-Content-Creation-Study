import { FunctionDeclaration } from "@google/genai";

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    webkitAudioContext: typeof AudioContext;
    aistudio?: AIStudio;
  }
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  image?: string;
  grounding?: any[];
  timestamp: number;
}

export enum ViewType {
  STUDY_LAB = 'STUDY_LAB',
  CREATOR_HUB = 'CREATOR_HUB',
  AUTOFLOW = 'AUTOFLOW',
  LIVE_TUTOR = 'LIVE_TUTOR',
  GENERATE_VIDEO = 'GENERATE_VIDEO',
}

export interface ContentFormat {
  id: string;
  title: string;
  icon: any;
  gradient: string;
  description: string;
  category: 'Video' | 'Social' | 'Study Tools' | 'Written' | 'All';
  promptTemplate: string;
}

export interface ToolConfig {
  googleSearch?: boolean;
  googleMaps?: boolean;
  thinking?: boolean;
  fast?: boolean;
}

export interface GeneratedContent {
  id: string;
  formatId: string;
  content: string;
  timestamp: Date;
  status: 'generating' | 'ready' | 'error';
}