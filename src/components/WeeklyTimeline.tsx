import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, X, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { Task, ScheduleSlot } from '../types';

interface WeeklyTimelineProps {
  tasks: Task[];
  slots: ScheduleSlot[];
  onAssignTaskToSlot: (taskId: string, slotId: string) => void;
  onClearSlot: (slotId: string) => void;
  onAutoSchedule: () => void;
  isScheduling: boolean;
}

export default function WeeklyTimeline({
  tasks,
  slots,
  onAssignTaskToSlot,
  onClearSlot,
  onAutoSchedule,
  isScheduling,
}: WeeklyTimelineProps) {
  const [activeSlotIdToAssign, setActiveSlotIdToAssign] = useState<string | null>(null);

  const pendingTasks = tasks.filter(t => !t.isCompleted && !slots.some(s => s.taskId === t.id));

  const handleSelectTask = (taskId: string) => {
    if (activeSlotIdToAssign) {
      onAssignTaskToSlot(taskId, activeSlotIdToAssign);
      setActiveSlotIdToAssign(null);
    }
  };

  return (
    <div id="weekly-timeline-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-display tracking-tight">Focus Timeline & Planner</h2>
          <p className="text-xs text-slate-500">Allocate tasks into hourly distraction-free blocks</p>
        </div>
        <button
          onClick={onAutoSchedule}
          disabled={isScheduling || pendingTasks.length === 0}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs hover:shadow cursor-pointer shrink-0"
        >
          {isScheduling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />}
          AI Auto-Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Today's Slots */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Today's Focus Blocks
          </span>

          <div className="flex flex-col gap-2.5">
            {slots.map(slot => {
              const assignedTask = tasks.find(t => t.id === slot.taskId);

              return (
                <div 
                  key={slot.id} 
                  className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    assignedTask 
                      ? 'bg-slate-50 border-slate-200/65 shadow-2xs' 
                      : activeSlotIdToAssign === slot.id 
                        ? 'border-dashed border-indigo-400 bg-indigo-50/20' 
                        : 'border-dashed border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Time Badge */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200/50 px-2.5 py-1 rounded-lg">
                      {slot.time}
                    </span>
                  </div>

                  {/* Slot Content */}
                  <div className="flex-1 min-w-0">
                    {assignedTask ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 truncate leading-snug">
                          {assignedTask.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {assignedTask.duration}m
                          <span className={`px-1.5 rounded text-[8px] uppercase font-bold ${
                            assignedTask.priority === 'panic' ? 'bg-rose-100 text-rose-700' :
                            assignedTask.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {assignedTask.priority}
                          </span>
                        </span>
                      </div>
                    ) : activeSlotIdToAssign === slot.id ? (
                      <span className="text-xs font-bold text-indigo-700 animate-pulse">
                        Select a pending task from the list...
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        Open focus block
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    {assignedTask ? (
                      <button
                        onClick={() => onClearSlot(slot.id)}
                        className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                        title="Clear Slot"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : activeSlotIdToAssign === slot.id ? (
                      <button
                        onClick={() => setActiveSlotIdToAssign(null)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer text-xs font-bold"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveSlotIdToAssign(slot.id)}
                        disabled={pendingTasks.length === 0}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-700 disabled:opacity-35 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        title="Assign Task"
                      >
                        <Plus className="w-3.5 h-3.5" /> Assign
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Unscheduled Task Reservoir */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Pending Task Reservoir
          </span>

          {activeSlotIdToAssign ? (
            <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-850 leading-relaxed font-semibold mb-1">
              Select one of the tasks below to lock it into the <span className="font-extrabold">{slots.find(s => s.id === activeSlotIdToAssign)?.time}</span> focus block.
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed mb-1 font-medium">
              Keep tasks in this pending reservoir, then assign them manually or run <span className="font-semibold text-slate-700">AI Auto-Schedule</span> to map them instantly.
            </div>
          )}

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px]">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">No pending unscheduled tasks.</p>
                <p className="text-[9px] text-slate-400 mt-0.5">All active tasks have been allocated to the timeline.</p>
              </div>
            ) : (
              pendingTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleSelectTask(task.id)}
                  disabled={!activeSlotIdToAssign}
                  className={`p-3 text-left rounded-xl border transition-all flex flex-col gap-1 ${
                    activeSlotIdToAssign 
                      ? 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer shadow-3xs hover:shadow-2xs' 
                      : 'border-slate-200 bg-slate-50/20 cursor-default'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      task.priority === 'panic' ? 'bg-rose-100 text-rose-700' :
                      task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {task.duration}m duration
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
