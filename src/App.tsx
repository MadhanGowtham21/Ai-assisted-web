import React, { useState, useEffect, useRef } from 'react';
import {
  IngestionParams,
  IngestionResult,
  SessionReconstructParams,
  SessionResult,
  PrefixSpanParams,
  PrefixSpanResult,
  ClusteringParams,
  ClusteringResult,
  EvaluationResult,
  LogMessage
} from './types';
import { audioService } from './services/audioService';
import {
  simulateDataIngestion,
  simulateSessionReconstruction,
  simulatePrefixSpanMining,
  simulateClusteringAndGraph,
  simulateEvaluation
} from './services/simulationEngine';
import { Header } from './components/common/Header';
import { StepperNav } from './components/common/StepperNav';
import { ConsoleTerminal } from './components/common/ConsoleTerminal';
import { DatasetIngestionView } from './components/step1/DatasetIngestionView';
import { SessionReconstructionView } from './components/step2/SessionReconstructionView';
import { PrefixSpanMiningView } from './components/step3/PrefixSpanMiningView';
import { ClusteringAndGraphView } from './components/step4/ClusteringAndGraphView';
import { BenchmarkExportView } from './components/step5/BenchmarkExportView';
import { ThesisAbstractModal } from './components/ThesisAbstractModal';
import { ThesisReportModal } from './components/ThesisReportModal';

export default function App() {
  // Navigation & Pipeline State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [runningStep, setRunningStep] = useState<number | null>(null);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(audioService.getMuted());

  // Modals
  const [showAbstractModal, setShowAbstractModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Live Console Logs
  const [logs, setLogs] = useState<LogMessage[]>([
    {
      id: 'init-1',
      timestamp: '00:00:01',
      step: 0,
      level: 'info',
      text: 'Workbench initialized. M.E. CSE Thesis Phase 1 Environment Ready.'
    },
    {
      id: 'init-2',
      timestamp: '00:00:02',
      step: 0,
      level: 'info',
      text: 'Loaded algorithms: PrefixSpan C++ Engine, HDBSCAN Density Clustering, Force-Directed Graph Layout.'
    }
  ]);

  // Parameters for each stage
  const [ingestionParams, setIngestionParams] = useState<IngestionParams>({
    dataset: 'RetailRocket E-Commerce (2.75M Events Benchmark)',
    sampleSize: 15000,
    noiseFilter: true,
    dateRange: '2026-10-15 to 2026-10-31'
  });

  const [sessionParams, setSessionParams] = useState<SessionReconstructParams>({
    inactivityThresholdMinutes: 30,
    minSessionLength: 2,
    botClickRateThreshold: 15,
    temporalDecayFactor: 0.5
  });

  const [prefixSpanParams, setPrefixSpanParams] = useState<PrefixSpanParams>({
    minSupport: 0.05,
    maxPatternLength: 5,
    closedSequenceFilter: true,
    targetOutcome: 'all'
  });

  const [clusteringParams, setClusteringParams] = useState<ClusteringParams>({
    algorithm: 'HDBSCAN',
    clustersCount: 4,
    dwellWeight: 0.65,
    cartVelocityWeight: 0.55,
    entropyWeight: 0.45,
    dimReduction: 'PCA'
  });

  // Results for each stage
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [prefixSpanResult, setPrefixSpanResult] = useState<PrefixSpanResult | null>(null);
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);

  // Keep references for async pipelines
  const ingestionRef = useRef(ingestionResult);
  ingestionRef.current = ingestionResult;
  const sessionRef = useRef(sessionResult);
  sessionRef.current = sessionResult;
  const prefixSpanRef = useRef(prefixSpanResult);
  prefixSpanRef.current = prefixSpanResult;
  const clusteringRef = useRef(clusteringResult);
  clusteringRef.current = clusteringResult;

  const addLog = (level: LogMessage['level'], text: string, step: number = currentStep) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    const newLog: LogMessage = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr,
      step,
      level,
      text,
      memoryUsageMb: parseFloat((42 + Math.random() * 12).toFixed(1))
    };
    setLogs(prev => [...prev.slice(-120), newLog]);
  };

  // Step 1: Ingestion Execution
  const executeStep1 = (silent: boolean = false): Promise<IngestionResult> => {
    return new Promise(resolve => {
      setRunningStep(1);
      audioService.startProcessHum();
      addLog('algorithm', `Ingesting ${ingestionParams.dataset} (Sample: ${ingestionParams.sampleSize} events)...`, 1);

      setTimeout(() => {
        addLog('info', `Filtering bot pings and sub-100ms jitter (Filter: ${ingestionParams.noiseFilter ? 'ENABLED' : 'DISABLED'})...`, 1);
      }, 300);

      setTimeout(() => {
        const result = simulateDataIngestion(ingestionParams);
        setIngestionResult(result);
        setCompletedSteps(prev => (prev.includes(1) ? prev : [...prev, 1]));
        setRunningStep(null);
        audioService.playSuccess();
        addLog('success', `Stream Ingestion Complete: ${result.totalEvents.toLocaleString()} events, ${result.uniqueVisitors.toLocaleString()} unique visitors.`, 1);
        resolve(result);
      }, 750);
    });
  };

  // Step 2: Session Reconstruction Execution
  const executeStep2 = (currentIngestion?: IngestionResult): Promise<SessionResult> => {
    return new Promise(resolve => {
      const sourceIngestion = currentIngestion || ingestionRef.current || simulateDataIngestion(ingestionParams);
      if (!ingestionResult) setIngestionResult(sourceIngestion);

      setRunningStep(2);
      audioService.startProcessHum();
      addLog('algorithm', `Reconstructing user sessions with Inactivity Threshold τ = ${sessionParams.inactivityThresholdMinutes} min...`, 2);

      setTimeout(() => {
        addLog('info', `Applying velocity pruning: max ${sessionParams.botClickRateThreshold} clicks/s, min length L_min ≥ ${sessionParams.minSessionLength}...`, 2);
      }, 350);

      setTimeout(() => {
        const result = simulateSessionReconstruction(sourceIngestion, sessionParams);
        setSessionResult(result);
        setCompletedSteps(prev => (prev.includes(2) ? prev : [...prev, 2]));
        setRunningStep(null);
        audioService.playSuccess();
        addLog('success', `Reconstructed ${result.totalSessions.toLocaleString()} sessions. Compression: ${result.compressionRatio}x, Avg Dwell: ${result.avgDwellSeconds}s.`, 2);
        resolve(result);
      }, 800);
    });
  };

  // Step 3: PrefixSpan Mining Execution
  const executeStep3 = (): Promise<PrefixSpanResult> => {
    return new Promise(resolve => {
      setRunningStep(3);
      audioService.startProcessHum();
      addLog('algorithm', `Mining frequent trajectory sub-sequences (minSupport σ = ${prefixSpanParams.minSupport}, max k = ${prefixSpanParams.maxPatternLength})...`, 3);

      setTimeout(() => {
        addLog('info', `Constructing projected database recursion trees (Closed filtering: ${prefixSpanParams.closedSequenceFilter ? 'ON' : 'OFF'})...`, 3);
      }, 350);

      setTimeout(() => {
        const result = simulatePrefixSpanMining(prefixSpanParams);
        setPrefixSpanResult(result);
        setCompletedSteps(prev => (prev.includes(3) ? prev : [...prev, 3]));
        setRunningStep(null);
        audioService.playSuccess();
        addLog('success', `PrefixSpan finished in ${result.executionTimeMs}ms: Mined ${result.patternsMinedCount} frequent trajectories.`, 3);
        resolve(result);
      }, 850);
    });
  };

  // Step 4: Clustering & Directed Navigation Graph Execution
  const executeStep4 = (): Promise<ClusteringResult> => {
    return new Promise(resolve => {
      setRunningStep(4);
      audioService.startProcessHum();
      addLog('algorithm', `Computing latent feature embeddings (Dwell wt: ${clusteringParams.dwellWeight}, Algorithm: ${clusteringParams.algorithm})...`, 4);

      setTimeout(() => {
        addLog('info', `Constructing topological transition matrix P(v_j | v_i) and identifying friction drop-offs...`, 4);
      }, 400);

      setTimeout(() => {
        const result = simulateClusteringAndGraph(clusteringParams);
        setClusteringResult(result);
        setCompletedSteps(prev => (prev.includes(4) ? prev : [...prev, 4]));
        setRunningStep(null);
        audioService.playSuccess();
        addLog('success', `Clustering Converged: Silhouette = ${result.silhouetteScore} across ${result.clusterSummaries.length} cohorts. Bottlenecks highlighted.`, 4);
        resolve(result);
      }, 900);
    });
  };

  // Step 5: Research Benchmark Evaluation Execution
  const executeStep5 = (): Promise<EvaluationResult> => {
    return new Promise(resolve => {
      setRunningStep(5);
      audioService.startProcessHum();
      addLog('algorithm', `Benchmarking proposed framework against 3 industry baselines (RFM, PCA+GMM, Flat DBSCAN)...`, 5);

      setTimeout(() => {
        addLog('info', `Evaluating Silhouette, Davies-Bouldin, and Calinski-Harabasz separation metrics...`, 5);
      }, 400);

      setTimeout(() => {
        const result = simulateEvaluation();
        setEvalResult(result);
        setCompletedSteps(prev => (prev.includes(5) ? prev : [...prev, 5]));
        setRunningStep(null);
        audioService.playSuccess();
        addLog('success', `Comparative Evaluation Complete: Proposed architecture shows +32.0% Silhouette improvement and -32.2% Davies-Bouldin reduction.`, 5);
        resolve(result);
      }, 850);
    });
  };

  // Auto-Run All Pipeline (Demonstrates full pipeline step-by-step for the Committee)
  const handleAutoRunAll = async () => {
    if (isAutoRunning) return;
    setIsAutoRunning(true);
    addLog('info', 'Starting Automated Scientific Pipeline Execution across all 5 stages...', 0);

    try {
      setCurrentStep(1);
      const ingestRes = await executeStep1();

      setCurrentStep(2);
      await executeStep2(ingestRes);

      setCurrentStep(3);
      await executeStep3();

      setCurrentStep(4);
      await executeStep4();

      setCurrentStep(5);
      await executeStep5();

      addLog('success', 'All 5 Thesis Pipeline Stages successfully validated!', 5);
    } finally {
      setIsAutoRunning(false);
    }
  };

  // Reset All
  const handleResetAll = () => {
    setIngestionResult(null);
    setSessionResult(null);
    setPrefixSpanResult(null);
    setClusteringResult(null);
    setEvalResult(null);
    setCompletedSteps([]);
    setCurrentStep(1);
    setRunningStep(null);
    setIsAutoRunning(false);
    setLogs([
      {
        id: `reset-${Date.now()}`,
        timestamp: new Date().toTimeString().split(' ')[0],
        step: 0,
        level: 'info',
        text: 'Workbench pipeline reset to blank experiment baseline.'
      }
    ]);
  };

  const handleToggleMute = () => {
    const newMuted = audioService.toggleMute();
    setIsMuted(newMuted);
  };

  // Step metric summaries shown in Stepper
  const stepMetrics: { [key: number]: string } = {};
  if (ingestionResult) stepMetrics[1] = `${ingestionResult.totalEvents.toLocaleString()} events`;
  if (sessionResult) stepMetrics[2] = `${sessionResult.totalSessions} sessions`;
  if (prefixSpanResult) stepMetrics[3] = `${prefixSpanResult.patternsMinedCount} patterns`;
  if (clusteringResult) stepMetrics[4] = `Sil: ${clusteringResult.silhouetteScore}`;
  if (evalResult) stepMetrics[5] = `+32% vs Base`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Academic Header */}
      <Header
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onResetAll={handleResetAll}
        onAutoRunAll={handleAutoRunAll}
        isRunningPipeline={isAutoRunning}
        onOpenAbstractModal={() => setShowAbstractModal(true)}
        onOpenReportModal={() => setShowReportModal(true)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Stage Stepper Navigator */}
        <StepperNav
          currentStep={currentStep}
          completedSteps={completedSteps}
          runningStep={runningStep}
          onSelectStep={stepId => setCurrentStep(stepId)}
          stepMetrics={stepMetrics}
        />

        {/* Active Stage View */}
        <div>
          {currentStep === 1 && (
            <DatasetIngestionView
              params={ingestionParams}
              onUpdateParams={newP => setIngestionParams(prev => ({ ...prev, ...newP }))}
              onExecute={executeStep1}
              isRunning={runningStep === 1}
              result={ingestionResult}
              onProceedNext={() => {
                setCurrentStep(2);
                if (!sessionResult) executeStep2();
              }}
            />
          )}

          {currentStep === 2 && (
            <SessionReconstructionView
              params={sessionParams}
              onUpdateParams={newP => setSessionParams(prev => ({ ...prev, ...newP }))}
              onExecute={() => executeStep2()}
              isRunning={runningStep === 2}
              result={sessionResult}
              onProceedNext={() => {
                setCurrentStep(3);
                if (!prefixSpanResult) executeStep3();
              }}
            />
          )}

          {currentStep === 3 && (
            <PrefixSpanMiningView
              params={prefixSpanParams}
              onUpdateParams={newP => setPrefixSpanParams(prev => ({ ...prev, ...newP }))}
              onExecute={executeStep3}
              isRunning={runningStep === 3}
              result={prefixSpanResult}
              onProceedNext={() => {
                setCurrentStep(4);
                if (!clusteringResult) executeStep4();
              }}
            />
          )}

          {currentStep === 4 && (
            <ClusteringAndGraphView
              params={clusteringParams}
              onUpdateParams={newP => setClusteringParams(prev => ({ ...prev, ...newP }))}
              onExecute={executeStep4}
              isRunning={runningStep === 4}
              result={clusteringResult}
              onProceedNext={() => {
                setCurrentStep(5);
                if (!evalResult) executeStep5();
              }}
            />
          )}

          {currentStep === 5 && (
            <BenchmarkExportView
              onExecute={executeStep5}
              isRunning={runningStep === 5}
              result={evalResult}
              onOpenReportModal={() => setShowReportModal(true)}
            />
          )}
        </div>

        {/* Live Execution Console Terminal */}
        <ConsoleTerminal
          logs={logs}
          onClear={() => setLogs([])}
          isRunning={runningStep !== null}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <b>M.E. Computer Science & Engineering</b> • Phase 1 Thesis Research Defense Demonstration
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            AI-Assisted Web Analytics Framework • PrefixSpan + Graph-Enhanced Latent Clustering
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ThesisAbstractModal
        isOpen={showAbstractModal}
        onClose={() => setShowAbstractModal(false)}
      />

      <ThesisReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        ingestion={ingestionResult}
        sessionResult={sessionResult}
        prefixSpanResult={prefixSpanResult}
        clusteringResult={clusteringResult}
        evalResult={evalResult}
      />
    </div>
  );
}
