import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Calendar, Clock, AlertCircle, CheckCircle, 
  Trash2, ChevronUp, Sparkles, Tag
} from 'lucide-react';
import { Task, Priority } from '../types';

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'isCompleted'>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectTaskForPlan: (id: string) => void;
  selectedTaskId: string | null;
}

export default function TaskManager({
  tasks,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  onSelectTaskForPlan,
  selectedTaskId,
}: TaskManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<Priority>('medium');
  const [duration, setDuration] = useState(30);
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag !== '');

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      deadline,
      priority,
      duration: Number(duration) || 30,
      tags: parsedTags,
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setDeadline(new Date().toISOString().split('T')[0]);
    setPriority('medium');
    setDuration(30);
    setTagsInput('');
    setIsFormOpen(false);
  };

  // Categorize tasks
  const isLastMinute = (task: Task) => {
    if (task.isCompleted) return false;
    
    // If priority is 'panic', it's always last minute
    if (task.priority === 'panic') return true;

    // Check if due in <= 24 hours
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.deadline);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 1 || task.priority === 'high';
  };

  const panicTasks = tasks.filter(t => !t.isCompleted && isLastMinute(t));
  const regularTasks = tasks.filter(t => t.isCompleted || !isLastMinute(t));

  const getPriorityStyle = (p: Priority) => {
    switch (p) {
      case 'panic':
        return 'bg-rose-50 border-rose-200 text-rose-700 font-bold';
      case 'high':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'medium':
        return 'bg-slate-50 border-slate-200 text-slate-700';
      case 'low':
        return 'bg-emerald-50 border-emerald-100 text-emerald-700';
    }
  };

  return (
    <div id="task-manager-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-display tracking-tight">Intelligent Priority Queue</h2>
          <p className="text-xs text-slate-500">Track and plan critical upcoming assignments</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
        >
          {isFormOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          Add Task
        </button>
      </div>

      {/* Task Creation Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-3.5 overflow-hidden shadow-inner"
          >
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Draft slide deck for pitch meeting"
                className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-3 py-2 outline-hidden text-slate-900 font-medium transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe details, references, or key blockers..."
                rows={2}
                className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-3 py-2 outline-hidden text-slate-900 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Deadline Date</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-2.5 py-2 outline-hidden text-slate-900 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Est. Duration (mins)</label>
                <input
                  type="number"
                  min={5}
                  max={480}
                  required
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-2.5 py-2 outline-hidden text-slate-900 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Priority Urgency</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-2.5 py-2 outline-hidden text-slate-900 font-medium transition-all"
                >
                  <option value="low">🌱 Low Focus</option>
                  <option value="medium">⚡ Medium Focus</option>
                  <option value="high">🔥 High Deadline</option>
                  <option value="panic">🚨 LAST-MINUTE PANIC</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Tags / Category (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. work, pitch, finance"
                className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-3 py-2 outline-hidden text-slate-900 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer mt-1"
            >
              Add to Schedule
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* PANIC ALERT SECTION */}
      {panicTasks.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 p-3 px-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl">
            <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wide font-display">Last-Minute Panics (🚨 Immediate Action)</span>
            <span className="ml-auto text-[10px] font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">{panicTasks.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {panicTasks.map(task => (
              <motion.div
                key={task.id}
                layoutId={`task-${task.id}`}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden ${
                  selectedTaskId === task.id 
                    ? 'border-rose-300 bg-linear-to-br from-white to-rose-50/20 ring-2 ring-rose-100/50 shadow-sm' 
                    : 'border-slate-200 bg-linear-to-r from-white to-rose-50/5 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Visual indicator left border */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                
                <div className="flex items-start gap-3 pl-2">
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className="mt-0.5 text-rose-500 hover:text-rose-600 transition-colors focus:outline-hidden cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-rose-300 hover:border-rose-500 flex items-center justify-center transition-all bg-white">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h3>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 max-w-xl">{task.description}</p>
                    )}
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100 font-mono tracking-wider">
                        🚨 CRITICAL DEADLINE
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" /> {task.deadline}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        <Clock className="w-3 h-3 text-slate-400" /> {task.duration}m
                      </span>
                      {task.tags.map(t => (
                        <span key={t} className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                          <Tag className="w-2.5 h-2.5" /> {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:self-center ml-8 md:ml-0 shrink-0">
                  <button
                    onClick={() => onSelectTaskForPlan(task.id)}
                    className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" /> Road-map
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* REGULAR AND COMPLETED TASKS */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">
          {panicTasks.length > 0 ? "Standard Scheduled Tasks" : "All Scheduled Tasks"}
        </span>

        {regularTasks.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">No other tasks on your list.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Click "Add Task" to record any standard assignments.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {regularTasks.map(task => (
              <motion.div
                key={task.id}
                layoutId={`task-${task.id}`}
                className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 relative overflow-hidden ${
                  task.isCompleted 
                    ? 'border-slate-100 bg-slate-50/50 opacity-60' 
                    : selectedTaskId === task.id 
                      ? 'border-indigo-400 bg-linear-to-r from-indigo-50/10 to-transparent shadow-xs ring-1 ring-indigo-500/10' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {/* Visual marker left border */}
                {!task.isCompleted && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    task.priority === 'high' ? 'bg-amber-400' :
                    task.priority === 'medium' ? 'bg-indigo-400' :
                    'bg-emerald-400'
                  }`} />
                )}

                <div className="flex items-start gap-3 pl-2">
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className="mt-0.5 transition-colors focus:outline-hidden cursor-pointer shrink-0"
                  >
                    {task.isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-indigo-500 flex items-center justify-center transition-all bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </button>
                  <div className="flex flex-col gap-1">
                    <h3 className={`text-xs font-bold text-slate-900 leading-snug ${task.isCompleted ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`text-[11px] leading-normal ${task.isCompleted ? 'text-slate-400' : 'text-slate-500'} line-clamp-1`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      {!task.isCompleted && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getPriorityStyle(task.priority)} font-mono uppercase tracking-wider`}>
                          {task.priority} Focus
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-100/50 px-1.5 py-0.5 rounded">
                        <Calendar className="w-3 h-3 text-slate-400" /> {task.deadline}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-100/50 px-1.5 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-slate-400" /> {task.duration}m
                      </span>
                      {task.tags.map(t => (
                        <span key={t} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                          <Tag className="w-2.5 h-2.5" /> {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:self-center ml-8 md:ml-0 shrink-0">
                  {!task.isCompleted && (
                    <button
                      onClick={() => onSelectTaskForPlan(task.id)}
                      className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" /> Plan
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
