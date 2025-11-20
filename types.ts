
export interface Language {
  id: string;
  name: string;
  code: string; // Not used directly by API but useful for UI
}

export interface Voice {
  id: string;
  name: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  systemPrompt: string;
  icon: string;
  isCustom?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  isFinal?: boolean;
}

export interface Session {
  id: string;
  timestamp: number;
  language: Language;
  scenario: Scenario;
  messages: ChatMessage[];
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface AudioVolumeState {
  input: number; // 0-100
  output: number; // 0-100
}
