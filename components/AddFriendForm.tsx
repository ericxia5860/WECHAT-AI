
import React, { useState } from 'react';
import { Scenario } from '../types';
import { PlusCircle, X, Sparkles, Type, FileText } from 'lucide-react';

interface AddFriendFormProps {
  onAdd: (scenario: Scenario) => void;
  onCancel: () => void;
}

const AddFriendForm: React.FC<AddFriendFormProps> = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !systemPrompt) return;

    const newScenario: Scenario = {
      id: `custom_${Date.now()}`,
      title: title,
      description: description || 'Custom Scenario',
      systemPrompt: systemPrompt,
      icon: 'User',
      isCustom: true
    };

    onAdd(newScenario);
  };

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col p-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-slate-800">
          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
            <PlusCircle size={20} />
          </div>
          <h3 className="font-bold text-lg">Create Custom Scenario</h3>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Title
          </label>
          <div className="relative">
            <Type className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tech Interviewer, Zombie Survival..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Description (Short)
          </label>
          <div className="relative">
             <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. A strict coding interview practice."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[200px]">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
            System Prompt / Instructions
            <Sparkles className="w-3 h-3 text-emerald-500" />
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Define exactly how the AI should behave.&#10;Example: 'You are a senior software engineer conducting a system design interview. Be rigorous but fair. Ask one question at a time.'"
            className="flex-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none leading-relaxed font-mono text-xs"
            required
          />
          <p className="text-[10px] text-slate-400 mt-1.5">
            This is the direct instruction sent to the model. Be specific about the role, tone, and rules.
          </p>
        </div>

        <button
          type="submit"
          className="mt-auto w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          Create Scenario
        </button>
      </form>
    </div>
  );
};

export default AddFriendForm;
