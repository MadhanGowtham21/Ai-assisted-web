import React from 'react';
import {
  Database,
  Layers,
  GitBranch,
  Network,
  Award,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { audioService } from '../../services/audioService';

interface StepMeta {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const STEPS: StepMeta[] = [
  {
    id: 1,
    title: '1. Ingest & Validate',
    subtitle: 'Benchmark Clickstreams',
    icon: Database
  },
  {
    id: 2,
    title: '2. Session Reconstruction',
    subtitle: 'Temporal Gap (Δt > τ)',
    icon: Layers
  },
  {
    id: 3,
    title: '3. PrefixSpan Mining',
    subtitle: 'Frequent Trajectories',
    icon: GitBranch
  },
  {
    id: 4,
    title: '4. Clustering & Graph',
    subtitle: 'Latent Space & Bottlenecks',
    icon: Network
  },
  {
    id: 5,
    title: '5. Benchmark & Defense',
    subtitle: 'Thesis Evaluation & Export',
    icon: Award
  }
];

interface StepperNavProps {
  currentStep: number;
  completedSteps: number[];
  runningStep: number | null;
  onSelectStep: (stepId: number) => void;
  stepMetrics: {
    [key: number]: string;
  };
}

export const StepperNav: React.FC<StepperNavProps> = ({
  currentStep,
  completedSteps,
  runningStep,
  onSelectStep,
  stepMetrics
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-2 sm:p-3 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[700px] gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isRunning = runningStep === step.id;
          const canClick = isCompleted || step.id === 1 || completedSteps.includes(step.id - 1) || isRunning;
          const metric = stepMetrics[step.id];

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => {
                  if (canClick) {
                    audioService.playClick();
                    onSelectStep(step.id);
                  }
                }}
                disabled={!canClick}
                className={`flex-1 flex items-center gap-3 p-2.5 rounded-lg text-left transition border ${
                  isActive
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    : canClick
                    ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-slate-50/40 border-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                {/* Step indicator icon */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition ${
                    isRunning
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-teal-600 text-white'
                      : canClick
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-slate-100 text-slate-300'
                  }`}
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCompleted && !isActive ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Text & metric */}
                <div className="overflow-hidden min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-indigo-950 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{step.subtitle}</div>

                  {metric && (
                    <div className="mt-0.5">
                      <span className="inline-block px-1.5 py-0.2 text-[10px] font-mono font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 truncate max-w-full">
                        {metric}
                      </span>
                    </div>
                  )}
                </div>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  className={`w-4 h-0.5 shrink-0 ${
                    completedSteps.includes(step.id) ? 'bg-teal-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
