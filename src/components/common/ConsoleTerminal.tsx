import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Copy, Check, Trash2, ChevronDown, ChevronUp, Cpu, HardDrive } from 'lucide-react';
import { LogMessage } from '../../types';
import { audioService } from '../../services/audioService';

interface ConsoleTerminalProps {
  logs: LogMessage[];
  onClear: () => void;
  isRunning?: boolean;
}

export const ConsoleTerminal: React.FC<ConsoleTerminalProps> = ({
  logs,
  onClear,
  isRunning = false
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (isExpanded) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const handleCopy = () => {
    audioService.playClick();
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadge = (level: LogMessage['level']) => {
    switch (level) {
      case 'algorithm':
        return <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-indigo-500/15 text-indigo-700 border border-indigo-200">ALGO</span>;
      case 'success':
        return <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-teal-500/15 text-teal-700 border border-teal-200">DONE</span>;
      case 'warn':
        return <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-amber-500/15 text-amber-700 border border-amber-200">WARN</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-200 text-slate-700 border border-slate-300">INFO</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Header bar */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-700 tracking-wide">Live Algorithmic Execution Terminal</span>
          {isRunning && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-700 border border-indigo-200 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
              Computing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono mr-2 bg-slate-200/60 px-2 py-0.5 rounded text-slate-600">
            <Cpu className="w-3 h-3 text-slate-500" />
            <span>CPU 12%</span>
            <span className="text-slate-300">|</span>
            <HardDrive className="w-3 h-3 text-slate-500" />
            <span>Heap: 48.2 MB</span>
          </div>

          <button
            onClick={handleCopy}
            title="Copy Logs"
            className="p-1 hover:text-slate-800 hover:bg-slate-200/70 rounded transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => {
              audioService.playClick();
              onClear();
            }}
            title="Clear Logs"
            className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              audioService.playClick();
              setIsExpanded(!isExpanded);
            }}
            title={isExpanded ? 'Collapse Terminal' : 'Expand Terminal'}
            className="p-1 hover:text-slate-800 hover:bg-slate-200/70 rounded transition"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {isExpanded && (
        <div className="bg-slate-900 text-slate-100 p-3 font-mono text-xs max-h-52 min-h-24 overflow-y-auto space-y-1.5 select-text">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic py-4 text-center">
              // Scientific terminal initialized. Ready to execute pipeline modules...
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed hover:bg-slate-800/60 px-1 py-0.5 rounded transition">
                <span className="text-slate-500 text-[11px] shrink-0">{log.timestamp}</span>
                <span className="shrink-0">{getLevelBadge(log.level)}</span>
                <span className={`text-[12px] break-all ${
                  log.level === 'algorithm' ? 'text-indigo-300' :
                  log.level === 'success' ? 'text-teal-300' :
                  log.level === 'warn' ? 'text-amber-300' : 'text-slate-300'
                }`}>
                  {log.text}
                </span>
                {log.memoryUsageMb && (
                  <span className="text-[10px] text-slate-500 shrink-0 ml-auto font-mono">
                    [{log.memoryUsageMb}MB]
                  </span>
                )}
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
};
