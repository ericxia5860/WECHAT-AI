import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { User, Bot } from 'lucide-react';

interface TranscriptProps {
  messages: ChatMessage[];
}

const Transcript: React.FC<TranscriptProps> = ({ messages }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <p className="text-sm">Conversation will appear here...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {messages.map((msg, index) => {
        // If it's not final, we might want to show it differently (e.g. grayed out)
        // For now, we only show if there is text
        if (!msg.text.trim()) return null;
        
        const isUser = msg.role === 'user';
        return (
          <div 
            key={msg.id + index} 
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div 
              className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                isUser 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              <p>{msg.text}</p>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
};

export default Transcript;