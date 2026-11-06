import React from 'react';
import {
  GraduationCap,
  Volume2,
  VolumeX,
  RotateCcw,
  PlayCircle,
  FileText,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { audioService } from '../../services/audioService';

interface HeaderProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onResetAll: () => void;
  onAutoRunAll: () => void;
  isRunningPipeline: boolean;
  onOpenAbstractModal: () => void;
  onOpenReportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isMuted,
  onToggleMute,
  onResetAll,
  onAutoRunAll,
  isRunningPipeline,
  onOpenAbstractModal,
  onOpenReportModal
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3.5 gap-4">
          {/* Left: Thesis Title and Academic Badge */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  M.E. CSE Thesis — Phase 1
                </span>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Algorithm Workbench v1.4
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight line-clamp-1 mt-0.5">
                AI-Assisted Web Analytics: Behavioural Discovery & Graph-Enhanced Sequence Mining
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Department of Computer Science & Engineering • Dynamic Inactivity Thresholding, PrefixSpan & HDBSCAN Latent Embeddings
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                onToggleMute();
                audioService.playClick();
              }}
              className={`p-2 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                isMuted
                  ? 'border-slate-200 text-slate-400 bg-slate-50 hover:bg-slate-100'
                  : 'border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
              }`}
              title={isMuted ? 'Unmute scientific sound synthesis' : 'Mute sound synthesis'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
              <span className="hidden md:inline">{isMuted ? 'Muted' : 'Sound ON'}</span>
            </button>

            {/* Research Abstract Modal */}
            <button
              onClick={() => {
                audioService.playClick();
                onOpenAbstractModal();
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
              title="View Thesis Abstract & Mathematical Formulation"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline">Thesis Abstract</span>
            </button>

            {/* Run Full Pipeline */}
            <button
              onClick={() => {
                audioService.playClick();
                onAutoRunAll();
              }}
              disabled={isRunningPipeline}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs ${
                isRunningPipeline
                  ? 'bg-indigo-300 text-white cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
              }`}
              title="Automatically execute all 5 pipeline phases for committee demonstration"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{isRunningPipeline ? 'Running Pipeline...' : 'Auto-Run All'}</span>
            </button>

            {/* Export Report */}
            <button
              onClick={() => {
                audioService.playClick();
                onOpenReportModal();
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
              title="Export formatted Phase 1 Thesis Dossier"
            >
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden md:inline">Export Report</span>
            </button>

            {/* Reset */}
            <button
              onClick={() => {
                audioService.playClick();
                onResetAll();
              }}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs transition"
              title="Reset All Workbench Stages"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
