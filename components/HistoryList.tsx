import React from 'react';
import { Session } from '../types';
import { Calendar, MessageSquare, Clock, ChevronRight } from 'lucide-react';

interface HistoryListProps {
  sessions: Session[];
  onSelectSession: (session: Session) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ sessions, onSelectSession }) => {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <Clock className="w-12 h-12 mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-slate-600">No History Yet</h3>
        <p className="text-sm max-w-xs mt-2">Complete a conversation to see it saved here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => onSelectSession(session)}
          className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {session.language.name}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(session.timestamp).toLocaleDateString()} • {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h4 className="font-semibold text-slate-800 truncate">{session.scenario.title}</h4>
            <p className="text-sm text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
               <MessageSquare className="w-3.5 h-3.5" />
               {session.messages.filter(m => m.role !== 'system').length} messages
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </button>
      ))}
    </div>
  );
};

export default HistoryList;
