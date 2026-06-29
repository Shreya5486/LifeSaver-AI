import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, CheckSquare, Square, Clipboard, Check, Play, 
  HelpCircle, Loader, ListChecks, FileText 
} from 'lucide-react';
import { Task, TaskStep } from '../types';

interface ExecutionPlannerProps {
  selectedTask: Task | null;
  onUpdateTaskPlan: (taskId: string, steps: TaskStep[], drafts: { title: string; content: string; }[]) => void;
  onToggleStepComplete: (taskId: string, stepId: string) => void;
}

export default function ExecutionPlanner({
  selectedTask,
  onUpdateTaskPlan,
  onToggleStepComplete,
}: ExecutionPlannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'drafts'>('checklist');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Auto-generate plan if a task is selected and has no plan yet
  useEffect(() => {
    if (selectedTask && (!selectedTask.executionSteps || selectedTask.executionSteps.length === 0)) {
      generatePlan();
    }
  }, [selectedTask?.id]);

  const generatePlan = async () => {
    if (!selectedTask) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: selectedTask }),
      });

      if (!response.ok) {
        throw new Error("Plan generation failed");
      }

      const data = await response.json();
      
      const formattedSteps: TaskStep[] = (data.steps || []).map((stepText: string, index: number) => ({
        id: `step-${index}-${Date.now()}`,
        text: stepText,
        isCompleted: false,
      }));

      onUpdateTaskPlan(selectedTask.id, formattedSteps, data.drafts || []);
      setActiveTab('checklist');
    } catch (error) {
      console.error("Error generating plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!selectedTask) {
    return (
      <div id="execution-planner-empty" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 mb-4 animate-pulse">
          <ListChecks className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 font-display">AI Execution Hub</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
          Select a task from your planner and click <span className="font-semibold text-indigo-600">Plan</span> to launch Gemini's interactive, stress-reducing execution roadmap.
        </p>
      </div>
    );
  }

  const steps = selectedTask.executionSteps || [];
  const drafts = selectedTask.executionDrafts || [];
  const completedSteps = steps.filter(s => s.isCompleted).length;
  const progressPercent = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  return (
    <div id="execution-planner-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">
            Active Roadmap
          </span>
          <h2 className="text-base font-bold text-slate-900 font-display tracking-tight mt-1.5">{selectedTask.title}</h2>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{selectedTask.description || "Subtask breakdown and starting templates"}</p>
        </div>
        <button
          onClick={generatePlan}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs border border-slate-200 hover:border-slate-400 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 self-start sm:self-center shrink-0"
        >
          {isLoading ? <Loader className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
          Regenerate Roadmap
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
          <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs font-bold text-slate-700 animate-pulse">Gemini is writing step-by-step roadmap...</p>
          <p className="text-[10px] text-slate-400 max-w-xs text-center">Formulating low-inertia checklists and helper drafts specifically for this assignment.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4">
          {/* Progress Bar */}
          {steps.length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1">
                  <ListChecks className="w-4 h-4 text-indigo-600" /> Progress to Completion
                </span>
                <span className="font-mono text-indigo-600 font-extrabold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-indigo-600 rounded-full"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {completedSteps} of {steps.length} inertia-breaking steps completed
              </span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'checklist' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Checklist Steps
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'drafts' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Pre-Written Drafts {drafts.length > 0 && `(${drafts.length})`}
            </button>
          </div>

          {/* Content panel */}
          <div className="flex-1 overflow-y-auto max-h-[350px] pr-1">
            {activeTab === 'checklist' ? (
              steps.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No steps available.</p>
                  <button onClick={generatePlan} className="text-xs text-indigo-600 underline mt-1 font-bold">Create them now</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {steps.map((step, idx) => (
                    <div 
                      key={step.id}
                      onClick={() => onToggleStepComplete(selectedTask.id, step.id)}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        step.isCompleted 
                          ? 'bg-slate-50/50 border-slate-150 opacity-60' 
                          : 'bg-white border-slate-200 hover:border-indigo-500/40 hover:bg-slate-50/20'
                      }`}
                    >
                      <button className="mt-0.5 shrink-0 transition-all text-slate-400 hover:text-indigo-600 cursor-pointer focus:outline-hidden">
                        {step.isCompleted ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-medium ${step.isCompleted ? 'line-through text-slate-400 font-normal' : 'text-slate-800'}`}>
                          {step.text}
                        </span>
                        {idx === 0 && !step.isCompleted && (
                          <span className="text-[9px] font-bold text-indigo-700 font-mono tracking-wide uppercase flex items-center gap-0.5 mt-0.5 animate-pulse">
                            ⚡ Low Inertia / Start Here
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              drafts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium font-sans">No drafts generated.</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1">Some tasks don't require starter documents. If needed, click Regenerate to suggest text templates.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {drafts.map((draft, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-900 font-sans">{draft.title}</h4>
                        <button
                          onClick={() => copyToClipboard(draft.content, idx)}
                          className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          title="Copy text to clipboard"
                        >
                          {copiedIndex === idx ? (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Copied!
                            </span>
                          ) : (
                            <Clipboard className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <pre className="bg-white p-3.5 border border-slate-150 rounded-lg text-[11px] text-slate-800 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[160px] shadow-2xs">
                        {draft.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
