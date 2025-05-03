export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  apiEndpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  theme: {
    primaryColor: string;
    darkMode?: boolean;
    fontSize?: number;
    messageSpacing?: number;
  };
  username?: string;
  autoSave?: boolean;
  privacyMode?: boolean;
} 