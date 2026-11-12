import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface EngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EngineModal: React.FC<EngineModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Fund Compass AI Architecture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-800">LLM Inference:</span>
              <span className="font-mono text-emerald-700">Groq (openai/gpt-oss-120b, T=0.0)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-800">Vector Embeddings:</span>
              <span className="font-mono text-slate-700">ChromaDB + all-MiniLM-L6-v2</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-800">Backend Gateway:</span>
              <span className="font-mono text-slate-700">FastAPI REST on Railway</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-800">Fallback Engine:</span>
              <span className="font-mono text-slate-700">Deterministic Rule-based RAG</span>
            </div>
          </div>

          <p>
            The RAG pipeline prioritizes <strong>accuracy over intelligence</strong>. Even if the Groq LLM API is unavailable, the deterministic fallback engine serves 100% verified facts from normalized JSON records.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

