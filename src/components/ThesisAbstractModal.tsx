import React from 'react';
import { X, BookOpen, GraduationCap, CheckCircle2, ChevronRight, Binary } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ThesisAbstractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThesisAbstractModal: React.FC<ThesisAbstractModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
                M.E. CSE Thesis Defense Documentation
              </span>
              <h2 className="text-base font-bold text-slate-800">
                Phase 1 Research Abstract & Mathematical Foundations
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              audioService.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 leading-relaxed">
          {/* Title box */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
            <h3 className="text-sm font-bold text-indigo-950 mb-1">
              "AI-Assisted Web Analytics System for Discovering Hidden User Behaviour Patterns: Phase 1 — Behavioural Discovery & Graph-Enhanced Sequence Mining"
            </h3>
            <p className="text-[11px] text-slate-500">
              Department of Computer Science and Engineering • Postgraduate Research Programme
            </p>
          </div>

          {/* Abstract */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              1. Research Abstract
            </h4>
            <p>
              Contemporary web analytics platforms rely predominantly on static, aggregate metrics (such as page views, bounce rate, and recency-frequency-monetary models) that obliterate the temporal and topological ordering of user interactions. This thesis introduces a novel hybrid framework combining dynamic temporal inactivity thresholding, prefix-projected sequential pattern mining (PrefixSpan), and multi-modal latent embedding clustering with directed navigation graph analysis. In Phase 1, we establish mathematical formulations for session boundary detection without rigid heuristic truncation, discover statistically significant navigational motifs, and pinpoint critical friction bottlenecks with sub-200ms algorithmic latency.
            </p>
          </div>

          {/* Mathematical Formulations */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
              <Binary className="w-4 h-4 text-teal-600" />
              2. Core Mathematical Formulations
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1 font-sans">
                  Temporal Session Boundary Formulation
                </span>
                <code className="text-indigo-700 block bg-white p-2 rounded border border-slate-200">
                  S_k = ⟨e_1, e_2, ..., e_m⟩<br/>
                  where t(e_&#123;i+1&#125;) - t(e_i) ≤ τ
                </code>
                <p className="text-[10px] text-slate-500 mt-1 font-sans">
                  Prevents session fragmentation by dynamically thresholding user inactivity τ.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1 font-sans">
                  PrefixSpan Sequential Support Metric
                </span>
                <code className="text-teal-700 block bg-white p-2 rounded border border-slate-200">
                  Supp(S) = |&#123;s ∈ D | S ⊑ s&#125;| / |D| ≥ σ
                </code>
                <p className="text-[10px] text-slate-500 mt-1 font-sans">
                  Extracts frequent trajectory motifs without exponential candidate explosion.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1 font-sans">
                  Directed Transition Probability
                </span>
                <code className="text-indigo-700 block bg-white p-2 rounded border border-slate-200">
                  P(v_j | v_i) = C(v_i → v_j) / ∑ C(v_i → v_k)
                </code>
                <p className="text-[10px] text-slate-500 mt-1 font-sans">
                  Models stochastic trajectory pathways across the web topology.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1 font-sans">
                  HDBSCAN Mutual Reachability Distance
                </span>
                <code className="text-teal-700 block bg-white p-2 rounded border border-slate-200">
                  d_&#123;mreach-k&#125;(a, b) = max(core_k(a), core_k(b), d(a, b))
                </code>
                <p className="text-[10px] text-slate-500 mt-1 font-sans">
                  Density-based separation robust against non-spherical user clusters.
                </p>
              </div>
            </div>
          </div>

          {/* Phase 1 Deliverables */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              3. Phase 1 Deliverables & Empirical Objectives
            </h4>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Empirical validation on benchmark datasets (RetailRocket 2.75M events & RecSys-15).</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Demonstration of +32% Silhouette improvement over standard RFM and DBSCAN baselines.</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Interactive Workbench enabling committee review panel demonstration with real-time telemetry.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-end">
          <button
            onClick={() => {
              audioService.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
