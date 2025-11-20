import { Language, Scenario, Voice } from './types';

export const LANGUAGES: Language[] = [
  { id: 'es', name: 'Spanish', code: 'es-ES' },
  { id: 'fr', name: 'French', code: 'fr-FR' },
  { id: 'de', name: 'German', code: 'de-DE' },
  { id: 'jp', name: 'Japanese', code: 'ja-JP' },
  { id: 'zh', name: 'Mandarin Chinese', code: 'zh-CN' },
  { id: 'en', name: 'English (Advanced)', code: 'en-US' },
];

export const VOICES: Voice[] = [
  { id: 'Puck', name: 'Puck' },
  { id: 'Charon', name: 'Charon' },
  { id: 'Kore', name: 'Kore' },
  { id: 'Fenrir', name: 'Fenrir' },
  { id: 'Zephyr', name: 'Zephyr' },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'coffee_shop',
    title: 'Coffee Shop',
    description: 'Order a drink and a pastry.',
    systemPrompt: 'You are a barista at a busy coffee shop. The user is a customer. Interact with them to take their order. Be friendly but concise.',
    icon: 'Coffee'
  },
  {
    id: 'destiny_match',
    title: 'Destiny Matchmaker',
    description: 'Ba Zi & I Ching compatibility analysis.',
    systemPrompt: 'You are an elite AI Matchmaker for a high-end social platform (benchmarked against "She Said" and social WeChat mini-programs). You combine modern social psychology with ancient Chinese metaphysics: I Ching, Ba Zi (Four Pillars), and Zi Wei Dou Shu.\n\nYOUR METHODOLOGY:\n1. **Social Energy Analysis**: Analyze the user\'s personality to calculate their "Energy Profile" (Yin/Yang balance, Dominant Elements, Main Star in Life Palace).\n2. **Complementary Matching**: Propose matches based on "Energy Complementarity" (e.g., "You are strong Wood, you need a Water partner to nourish you, or a Metal partner to prune you").\n3. **Communication Economics**: Teach the user "Chat Transaction Mechanisms". Explain how to use conversation to exchange emotional value and incentivize the other party to cooperate (agree to a date).\n4. **Goal**: Help the user understand their "Social Destiny" and improve their "Conversion Rate" in dating through metaphysical insights.\n\nMaintain a tone that is professional, insightful, slightly mystical, and strategic.',
    icon: 'Heart'
  },
  {
    id: 'airport',
    title: 'Airport Check-in',
    description: 'Check in for your flight.',
    systemPrompt: 'You are an airline check-in agent. The user is a traveler. Ask for their passport, check their bags, and give them their boarding pass.',
    icon: 'Plane'
  },
  {
    id: 'market',
    title: 'Local Market',
    description: 'Buy fruits and vegetables.',
    systemPrompt: 'You are a vendor at a local market selling fresh produce. The user wants to buy ingredients. Negotiate prices slightly.',
    icon: 'ShoppingCart'
  },
  {
    id: 'interview',
    title: 'Job Interview',
    description: 'Answer basic interview questions.',
    systemPrompt: 'You are a hiring manager interviewing the user for a junior developer position. Ask about their background and strengths.',
    icon: 'Briefcase'
  },
  {
    id: 'freestyle',
    title: 'Freestyle Chat',
    description: 'Talk about anything you want.',
    systemPrompt: 'You are a helpful and patient language tutor. Correct the user\'s grammar gently if they make mistakes, but prioritize keeping the conversation flowing.',
    icon: 'User'
  }
];

export const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';