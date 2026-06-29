import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, CheckCircle, Plus, Calendar, 
  Trash2, Zap 
} from 'lucide-react';
import { Goal, Habit } from '../types';

interface GoalsHabitsProps {
  goals: Goal[];
  habits: Habit[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'isCompleted'>) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'streak' | 'history'>) => void;
  onUpdateGoalProgress: (id: string, progress: number) => void;
  onToggleGoalComplete: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  onTriggerHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

export default function GoalsHabits({
  goals,
  habits,
  onAddGoal,
  onAddHabit,
  onUpdateGoalProgress,
  onToggleGoalComplete,
  onDeleteGoal,
  onTriggerHabit,
  onDeleteHabit,
}: GoalsHabitsProps) {
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);

  // Goal Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  // Habit Form State
  const [habitName, setHabitName] = useState('');

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    onAddGoal({
      title: goalTitle.trim(),
      deadline: goalDeadline || new Date().toISOString().split('T')[0],
      target: goalTarget.trim() || 'Achieve milestone',
      progress: 0,
    });
    setGoalTitle('');
    setGoalDeadline('');
    setGoalTarget('');
    setIsGoalFormOpen(false);
  };

  const handleAddHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    onAddHabit({
      name: habitName.trim(),
    });
    setHabitName('');
    setIsHabitFormOpen(false);
  };

  // Helper to determine if habit was already completed today
  const isHabitCompletedToday = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    return habit.lastCompleted === today;
  };

  return (
    <div id="goals-habits-panel" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* GOAL TRACKER PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display tracking-tight">Milestones & Goals</h2>
            <p className="text-xs text-slate-500">Track and build high-impact targets</p>
          </div>
          <button
            onClick={() => setIsGoalFormOpen(!isGoalFormOpen)}
            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Goal Add Form */}
        <AnimatePresence>
          {isGoalFormOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddGoalSubmit}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-3 overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">Goal Name</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Finish final exam prep"
                  className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-2.5 py-1.5 outline-hidden text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">Target / Metric</label>
                  <input
                    type="text"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="e.g. Study 30 hours"
                    className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-2.5 py-1.5 outline-hidden text-slate-900"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">Target Deadline</label>
                  <input
                    type="date"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-2 py-1 outline-hidden text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer mt-1"
              >
                Create Goal
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Goals List */}
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px]">
          {goals.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <Trophy className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">No active milestones created.</p>
              <p className="text-[9px] text-slate-400">Map long-term visions alongside short deadlines.</p>
            </div>
          ) : (
            goals.map(goal => (
              <div 
                key={goal.id} 
                className={`p-3.5 rounded-xl border flex flex-col gap-3 transition-all ${
                  goal.isCompleted 
                    ? 'border-slate-100 bg-slate-50/50 opacity-65' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => onToggleGoalComplete(goal.id)}
                      className="mt-0.5 focus:outline-hidden cursor-pointer shrink-0"
                    >
                      {goal.isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 hover:border-indigo-500 flex items-center justify-center transition-all">
                          <div className="w-2 h-2 rounded-full bg-slate-400 opacity-0 hover:opacity-20" />
                        </div>
                      )}
                    </button>
                    <div>
                      <h4 className={`text-xs font-bold text-slate-900 leading-snug ${goal.isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {goal.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        Target: <span className="font-semibold text-slate-600">{goal.target}</span> • Deadline: <span className="font-mono">{goal.deadline}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1 hover:bg-slate-100 text-slate-300 hover:text-slate-500 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress bar controller */}
                {!goal.isCompleted && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Progress</span>
                      <span className="font-bold text-indigo-600">{goal.progress}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={goal.progress}
                        onChange={(e) => onUpdateGoalProgress(goal.id, Number(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* DAILY HABIT TRACKER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display tracking-tight">Consistent Habits</h2>
            <p className="text-xs text-slate-500">Form daily micro-habits and track consistency</p>
          </div>
          <button
            onClick={() => setIsHabitFormOpen(!isHabitFormOpen)}
            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Habit Add Form */}
        <AnimatePresence>
          {isHabitFormOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddHabitSubmit}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-3 overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">Habit Name</label>
                <input
                  type="text"
                  required
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g. 15 minutes planning review"
                  className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-2.5 py-1.5 outline-hidden text-slate-900 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer mt-1"
              >
                Track Habit
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Habits List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[300px]">
          {habits.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <Flame className="w-6 h-6 text-slate-300 mx-auto mb-1.5 animate-pulse" />
              <p className="text-xs text-slate-500 font-medium">No active daily habits.</p>
              <p className="text-[9px] text-slate-400">Consistency beats procrastination. Build small daily wins.</p>
            </div>
          ) : (
            habits.map(habit => {
              const completedToday = isHabitCompletedToday(habit);

              return (
                <div 
                  key={habit.id} 
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    completedToday 
                      ? 'border-emerald-100 bg-emerald-50/10' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => onTriggerHabit(habit.id)}
                      className="focus:outline-hidden cursor-pointer"
                    >
                      {completedToday ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 hover:border-indigo-500 flex items-center justify-center transition-all">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-400 opacity-0 hover:opacity-20" />
                        </div>
                      )}
                    </button>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold text-slate-900 leading-snug truncate ${completedToday ? 'text-slate-400 line-through' : ''}`}>
                        {habit.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-sans">
                          {completedToday ? 'Logged for today' : 'Log daily victory'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Streak Indicator */}
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-amber-700 font-mono text-[11px] font-bold">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{habit.streak}d</span>
                    </div>

                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1 hover:bg-slate-100 text-slate-300 hover:text-slate-500 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
