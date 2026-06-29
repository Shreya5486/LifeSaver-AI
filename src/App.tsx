import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Calendar, Clock, AlertTriangle, 
  CheckCircle, ListChecks, Heart, ShieldAlert, Zap,
  LayoutDashboard, CalendarDays, Award, CheckSquare, BrainCircuit,
  MessageSquare, Layers, Menu, X
} from 'lucide-react';

// Types
import { Task, Goal, Habit, ScheduleSlot, TaskStep } from './types';

// Components
import AICompanion from './components/AICompanion';
import TaskManager from './components/TaskManager';
import ExecutionPlanner from './components/ExecutionPlanner';
import WeeklyTimeline from './components/WeeklyTimeline';
import GoalsHabits from './components/GoalsHabits';
import AIRescueHub from './components/AIRescueHub';

const INITIAL_SLOTS: ScheduleSlot[] = [
  { id: 's9', day: 'Today', time: '09:00', taskId: null },
  { id: 's10', day: 'Today', time: '10:00', taskId: null },
  { id: 's11', day: 'Today', time: '11:00', taskId: null },
  { id: 's12', day: 'Today', time: '12:00', taskId: null },
  { id: 's13', day: 'Today', time: '13:00', taskId: null },
  { id: 's14', day: 'Today', time: '14:00', taskId: null },
  { id: 's15', day: 'Today', time: '15:00', taskId: null },
  { id: 's16', day: 'Today', time: '16:00', taskId: null },
  { id: 's17', day: 'Today', time: '17:00', taskId: null },
];

export default function App() {
  // Global State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>(INITIAL_SLOTS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // AI Priorities Diagnostics State
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [prioritizationSummary, setPrioritizationSummary] = useState('');
  const [prioritizationAdvice, setPrioritizationAdvice] = useState<string[]>([]);
  const [suggestedFocusId, setSuggestedFocusId] = useState<string | null>(null);

  // Tab selections
  const [leftTab, setLeftTab] = useState<'tasks' | 'goals'>('tasks');
  const [rightTab, setRightTab] = useState<'chat' | 'timeline' | 'plan' | 'rescue'>('chat');
  const [focusSwitchesCount, setFocusSwitchesCount] = useState(0);

  // Track task switching behavior
  useEffect(() => {
    if (selectedTaskId) {
      setFocusSwitchesCount(prev => prev + 1);
    }
  }, [selectedTaskId]);
  
  // Mobile UI controls
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [focusTimerSeconds, setFocusTimerSeconds] = useState(2462); // 41:02 fallback ticker
  
  // Loader for general timeline scheduling action
  const [isScheduling, setIsScheduling] = useState(false);

  // Simulated countdown for active focus task to match design HTML visual excellence
  useEffect(() => {
    const interval = setInterval(() => {
      setFocusTimerSeconds(prev => (prev > 0 ? prev - 1 : 2462));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('saver_tasks');
    const savedGoals = localStorage.getItem('saver_goals');
    const savedHabits = localStorage.getItem('saver_habits');
    const savedSlots = localStorage.getItem('saver_slots');
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Pre-seed some beautiful, realistic starting tasks to make the app immediate
      const seedTasks: Task[] = [
        {
          id: 'seed-t1',
          title: 'Prepare project pitch outline and research slides',
          description: 'Break down main business metrics, core market research, and create the basic structure for the slideshow.',
          deadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString().split('T')[0], // 18 hours from now
          priority: 'panic',
          duration: 45,
          tags: ['work', 'pitch', 'investors'],
          isCompleted: false,
        },
        {
          id: 'seed-t2',
          title: 'Review quarterly tax filing options',
          description: 'Locate bank statements, expense summaries, and organize key tax form templates.',
          deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
          priority: 'medium',
          duration: 30,
          tags: ['finance', 'admin'],
          isCompleted: false,
        }
      ];
      setTasks(seedTasks);
    }

    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    } else {
      const seedGoals: Goal[] = [
        {
          id: 'seed-g1',
          title: 'Complete Quarter 2 Business Milestones',
          target: 'Acquire 3 new advisory clients',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: 40,
          isCompleted: false,
        }
      ];
      setGoals(seedGoals);
    }

    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      const seedHabits: Habit[] = [
        {
          id: 'seed-h1',
          name: '15-minute daily planning review',
          streak: 3,
          lastCompleted: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          history: [],
        }
      ];
      setHabits(seedHabits);
    }

    if (savedSlots) {
      setSlots(JSON.parse(savedSlots));
    }
  }, []);

  // Save state to localStorage whenever modified
  useEffect(() => {
    localStorage.setItem('saver_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('saver_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('saver_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('saver_slots', JSON.stringify(slots));
  }, [slots]);

  // Handle addition of tasks
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'isCompleted'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      isCompleted: false,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleToggleComplete = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.isCompleted;
        // If completed, clear scheduling slot assignment
        if (nextState) {
          setSlots(currentSlots => currentSlots.map(s => s.taskId === id ? { ...s, taskId: null } : s));
        }
        return { ...t, isCompleted: nextState };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSlots(currentSlots => currentSlots.map(s => s.taskId === id ? { ...s, taskId: null } : s));
    if (selectedTaskId === id) setSelectedTaskId(null);
    if (suggestedFocusId === id) setSuggestedFocusId(null);
  };

  // Add long-term goal
  const handleAddGoal = (newGoalData: Omit<Goal, 'id' | 'isCompleted'>) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: `goal-${Date.now()}`,
      isCompleted: false,
    };
    setGoals(prev => [newGoal, ...prev]);
  };

  const handleUpdateGoalProgress = (id: string, progress: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g));
  };

  const handleToggleGoalComplete = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, isCompleted: !g.isCompleted, progress: g.isCompleted ? 0 : 100 } : g));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Habit trigger logging
  const handleAddHabit = (newHabitData: Omit<Habit, 'id' | 'streak' | 'history'>) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: `habit-${Date.now()}`,
      streak: 0,
      history: [],
    };
    setHabits(prev => [newHabit, ...prev]);
  };

  const handleTriggerHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        if (h.lastCompleted === today) {
          // Toggle off for today (undo completion)
          return {
            ...h,
            lastCompleted: undefined,
            streak: Math.max(0, h.streak - 1),
            history: h.history.filter(d => d !== today)
          };
        } else {
          // Log complete today
          return {
            ...h,
            lastCompleted: today,
            streak: h.streak + 1,
            history: [...h.history, today]
          };
        }
      }
      return h;
    }));
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Update a task with an AI generated execution roadmap
  const handleUpdateTaskPlan = (taskId: string, steps: TaskStep[], drafts: { title: string; content: string; }[]) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, executionSteps: steps, executionDrafts: drafts } : t));
  };

  // Toggle state of action roadmap checklist item
  const handleToggleStepComplete = (taskId: string, stepId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.executionSteps) {
        const updatedSteps = t.executionSteps.map(step => 
          step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
        );
        return { ...t, executionSteps: updatedSteps };
      }
      return t;
    }));
  };

  // Handle Manual Slot Assignment
  const handleAssignTaskToSlot = (taskId: string, slotId: string) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, taskId } : s));
  };

  const handleClearSlot = (slotId: string) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, taskId: null } : s));
  };

  // Trigger AI Auto-Prioritizer Scan
  const triggerAIPrioritizeScan = async () => {
    if (tasks.length === 0) return;
    setIsPrioritizing(true);
    try {
      const response = await fetch('/api/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, goals }),
      });

      if (!response.ok) {
        throw new Error("Diagnostics scan failed");
      }

      const data = await response.json();
      
      setPrioritizationSummary(data.summary || "All set! Priorities analyzed cleanly.");
      setPrioritizationAdvice(data.advice || []);
      
      if (data.suggestedFocusId && tasks.some(t => t.id === data.suggestedFocusId)) {
        setSuggestedFocusId(data.suggestedFocusId);
      } else {
        // Fallback to highest priority unscheduled item
        const topUnscheduled = tasks.find(t => !t.isCompleted);
        if (topUnscheduled) setSuggestedFocusId(topUnscheduled.id);
      }
    } catch (error) {
      console.error("Prioritizer error:", error);
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Handle suggestion selection from AI recommended focal point
  const handleApplyAIRecommendation = (focusTaskId: string) => {
    setSelectedTaskId(focusTaskId);
    setRightTab('plan'); // Automatically swap user view directly into the step-by-step executor!
  };

  const selectTaskForPlanning = (id: string) => {
    setSelectedTaskId(id);
    setRightTab('plan'); // Direct shortcut tab trigger
  };

  // Trigger AI Auto-Scheduler allocation
  const triggerAIAutoSchedule = async () => {
    const unscheduledTasks = tasks.filter(t => !t.isCompleted && !slots.some(s => s.taskId === t.id));
    if (unscheduledTasks.length === 0) return;

    setIsScheduling(true);
    try {
      const response = await fetch('/api/auto-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: unscheduledTasks, slots }),
      });

      if (!response.ok) {
        throw new Error("Timeline scheduling failed");
      }

      const data = await response.json();
      
      if (data.assignments && Array.isArray(data.assignments)) {
        setSlots(prev => {
          let updated = [...prev];
          data.assignments.forEach((assignment: { taskId: string; slotId: string }) => {
            const slotIndex = updated.findIndex(s => s.id === assignment.slotId);
            if (slotIndex !== -1 && !updated[slotIndex].taskId) {
              updated[slotIndex] = { ...updated[slotIndex], taskId: assignment.taskId };
            }
          });
          return updated;
        });
      }
    } catch (error) {
      console.error("Auto scheduling error:", error);
    } finally {
      setIsScheduling(false);
    }
  };

  // Gather currently selected task object
  const activeSelectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Highest priority pending task to show in "Currently Executing" / Focus hero area
  const currentExecutingTask = activeSelectedTask || 
    tasks.find(t => t.id === suggestedFocusId && !t.isCompleted) || 
    tasks.find(t => t.priority === 'panic' && !t.isCompleted) ||
    tasks.find(t => !t.isCompleted) || 
    null;

  // Setup sidebar quick action state toggling to bind view dynamically
  const selectCommandCenter = () => {
    setLeftTab('tasks');
    setRightTab('chat');
    setIsSidebarOpen(false);
  };

  const selectExecutionSchedule = () => {
    setLeftTab('tasks');
    setRightTab('timeline');
    setIsSidebarOpen(false);
  };

  const selectProductivityInsight = () => {
    setLeftTab('goals');
    setRightTab('chat');
    setIsSidebarOpen(false);
  };

  const selectRoadmap = () => {
    setLeftTab('tasks');
    setRightTab('plan');
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden antialiased">
      
      {/* SIDEBAR NAVIGATION (Permanent on Desktop, Drawer on Mobile) */}
      <aside className="w-64 bg-slate-900 shrink-0 hidden md:flex flex-col text-slate-300 border-r border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-md">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white font-display">LIFESAVER<span className="text-indigo-400">.AI</span></span>
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={selectCommandCenter}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                leftTab === 'tasks' && rightTab === 'chat'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              Command Center
            </button>
            
            <button 
              onClick={selectExecutionSchedule}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                leftTab === 'tasks' && rightTab === 'timeline'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              Execution Schedule
            </button>

            <button 
              onClick={selectRoadmap}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                leftTab === 'tasks' && rightTab === 'plan'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              Execution Roadmap
            </button>

            <button 
              onClick={() => {
                setLeftTab('tasks');
                setRightTab('rescue');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                leftTab === 'tasks' && rightTab === 'rescue'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Rescue & Diagnostics
            </button>

            <button 
              onClick={selectProductivityInsight}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                leftTab === 'goals'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Award className="w-4 h-4 text-indigo-400" />
              Milestones & Habits
            </button>
          </nav>
        </div>

        {/* AI status container inside sidebar */}
        <div className="mt-auto p-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/60 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">AI Status: Active</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              {prioritizationSummary ? `"${prioritizationSummary.substring(0, 100)}..."` : `"I've optimized your next focus block. Start the recommended task now."`}
            </p>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/80 z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 w-64 bg-slate-900 z-50 p-6 flex flex-col text-slate-300 border-r border-slate-800 md:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                    <Zap className="w-4 h-4 fill-white" />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-white font-display">LIFESAVER<span className="text-indigo-400">.AI</span></span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                <button onClick={selectCommandCenter} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800/40">
                  <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                  Command Center
                </button>
                <button onClick={selectExecutionSchedule} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800/40">
                  <CalendarDays className="w-4 h-4 text-indigo-400" />
                  Execution Schedule
                </button>
                <button onClick={selectRoadmap} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800/40">
                  <BrainCircuit className="w-4 h-4 text-indigo-400" />
                  Execution Roadmap
                </button>
                <button 
                  onClick={() => {
                    setLeftTab('tasks');
                    setRightTab('rescue');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                    leftTab === 'tasks' && rightTab === 'rescue'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Rescue & Diagnostics
                </button>
                <button onClick={selectProductivityInsight} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800/40">
                  <Award className="w-4 h-4 text-indigo-400" />
                  Milestones & Habits
                </button>
              </nav>

              <div className="mt-auto">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">AI Active</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed italic">"Ready to plan your day."</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* HEADER */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest font-display">
              Mission Control / <span className="text-slate-900 font-bold">Today's Strategy</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              {tasks.some(t => t.priority === 'panic' && !t.isCompleted) ? (
                <>
                  <div className="text-sm font-extrabold text-rose-600 uppercase tracking-tighter flex items-center gap-1 justify-end">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    Priority Warning
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Critical overload triggered</div>
                </>
              ) : (
                <>
                  <div className="text-sm font-extrabold text-indigo-600 uppercase tracking-tighter">Status Optimal</div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Schedule is fully optimized</div>
                </>
              )}
            </div>
            
            <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-white shadow-md flex items-center justify-center text-indigo-700 font-bold tracking-tight">
              JD
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT BODY */}
        <main className="p-4 md:p-8 flex flex-col gap-8 max-w-[1500px] mx-auto w-full flex-1">
          
          {/* TOP SECTION: CURRENT FOCUS HERO BANNER */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Currently Executing Task Area */}
            <div className={`lg:col-span-8 bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[250px] transition-all hover:shadow-md relative overflow-hidden ${
              currentExecutingTask && currentExecutingTask.priority === 'panic' 
                ? 'border-rose-200/80 bg-linear-to-br from-white to-rose-50/10' 
                : 'border-slate-200 bg-white'
            }`}>
              {/* Subtle top decoration */}
              {currentExecutingTask && currentExecutingTask.priority === 'panic' && (
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-rose-500 via-amber-400 to-rose-500 animate-pulse" />
              )}
              
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 z-10">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider font-mono ${
                      currentExecutingTask?.priority === 'panic' 
                        ? 'bg-rose-500 text-white animate-pulse' 
                        : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {currentExecutingTask?.priority === 'panic' ? '🚨 EMERGENCY ACTION FOCUS' : 'Currently Executing'}
                    </span>
                    {currentExecutingTask?.tags && currentExecutingTask.tags.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        #{currentExecutingTask.tags[0]}
                      </span>
                    )}
                  </div>
                  
                  {currentExecutingTask ? (
                    <>
                      <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight font-display leading-tight">
                        {currentExecutingTask.title}
                      </h2>
                      <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                        {currentExecutingTask.description || "No specific instructions provided. Tackle this step-by-step to lock in your success."}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl md:text-2xl font-extrabold text-slate-950 tracking-tight font-display">
                        Cockpit Operational & Clear
                      </h2>
                      <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                        Your agenda is fully clear of urgent fires. Start by creating a task or running an AI Diagnostic scan to identify the next high-impact goal.
                      </p>
                    </>
                  )}
                </div>

                {currentExecutingTask && (
                  <div className="text-left sm:text-right shrink-0 bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md">
                    <div className="text-3xl md:text-4xl font-mono font-extrabold text-emerald-400 tracking-tight flex items-center justify-center gap-1">
                      <Clock className="w-5 h-5 text-rose-400 animate-pulse" />
                      {formatTimer(focusTimerSeconds)}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono mt-1 text-center">
                      Focus Session active
                    </div>
                  </div>
                )}
              </div>

              {currentExecutingTask ? (
                <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 mt-4 z-10">
                  <button 
                    onClick={() => handleToggleComplete(currentExecutingTask.id)}
                    className="px-4.5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold tracking-wider uppercase rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    COMPLETE ACTIVE BLOCK
                  </button>
                  <button 
                    onClick={() => selectTaskForPlanning(currentExecutingTask.id)}
                    className="px-4.5 py-2.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    AI BREAKDOWN
                  </button>
                  
                  <div className="ml-auto hidden md:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Calibrated Focus Active
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 border-t border-slate-100 pt-5 mt-4 text-xs text-slate-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>💡 Pro-tip: Keep regular focus cycles of 25-45 minutes to maximize hackathon productivity.</span>
                </div>
              )}
            </div>

            {/* Indigo AI Scheduling Insight Card */}
            <div className="lg:col-span-4 bg-linear-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-2xl p-6 shadow-md text-white flex flex-col justify-between transition-all hover:shadow-lg relative overflow-hidden">
              {/* Subtle visual ambient circle decorator */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-90 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" /> AI Strategic Scaffolder
                  </h3>
                  <span className="text-[9px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full text-indigo-200">ACTIVE</span>
                </div>
                
                <div className="mb-4 space-y-1">
                  <div className="text-[9px] uppercase font-bold tracking-wider opacity-75 font-mono">Real-time Strategy recommendation</div>
                  <p className="text-sm md:text-base leading-snug font-extrabold text-indigo-50 font-display">
                    "{prioritizationAdvice[0] || "No urgent stress vectors detected. Let's design an intentional micro-milestone sequence."}"
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-indigo-500/50">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-100">
                  <span className="opacity-80">Work Continuity Strength:</span>
                  <span className="font-mono bg-indigo-500/30 px-2 py-0.5 rounded text-white text-[10px]">98% (Strong)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-100">
                  <span className="opacity-80">Cognitive Load Warning:</span>
                  <span className="font-mono bg-indigo-500/30 px-2 py-0.5 rounded text-white text-[10px]">Optimal</span>
                </div>
                
                <button 
                  onClick={triggerAIPrioritizeScan}
                  disabled={isPrioritizing || tasks.length === 0}
                  className="w-full py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 transition-colors rounded-xl text-xs font-extrabold tracking-wider uppercase mt-2 cursor-pointer shadow-md disabled:opacity-40"
                >
                  {isPrioritizing ? "SCANNING WORK COGNITION..." : "RE-EVALUATE COGNITIVE STRATEGY"}
                </button>
              </div>
            </div>
          </section>

          {/* TWO-COLUMN WORKSPACE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: THE INTUITIVE PLANNER */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Tabs Controller */}
              <div className="flex bg-slate-200/60 p-1 rounded-xl self-start">
                <button
                  onClick={() => setLeftTab('tasks')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    leftTab === 'tasks' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Task Planner
                </button>
                <button
                  onClick={() => setLeftTab('goals')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    leftTab === 'goals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Milestones & Habits
                </button>
              </div>

              <AnimatePresence mode="wait">
                {leftTab === 'tasks' ? (
                  <motion.div
                    key="tasks-panel"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <TaskManager
                      tasks={tasks}
                      onAddTask={handleAddTask}
                      onToggleComplete={handleToggleComplete}
                      onDeleteTask={handleDeleteTask}
                      onSelectTaskForPlan={selectTaskForPlanning}
                      selectedTaskId={selectedTaskId}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="goals-panel"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <GoalsHabits
                      goals={goals}
                      habits={habits}
                      onAddGoal={handleAddGoal}
                      onAddHabit={handleAddHabit}
                      onUpdateGoalProgress={handleUpdateGoalProgress}
                      onToggleGoalComplete={handleToggleGoalComplete}
                      onDeleteGoal={handleDeleteGoal}
                      onTriggerHabit={handleTriggerHabit}
                      onDeleteHabit={handleDeleteHabit}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT COLUMN: AI SUITE */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* AI Suite Selector Tabs */}
              <div className="flex bg-slate-200/60 p-1 rounded-xl self-start">
                <button
                  onClick={() => setRightTab('chat')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    rightTab === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  AI Companion
                </button>
                <button
                  onClick={() => setRightTab('timeline')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    rightTab === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Focus Timeline
                </button>
                <button
                  onClick={() => setRightTab('plan')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    rightTab === 'plan' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Execution Roadmap {activeSelectedTask && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                </button>
                <button
                  onClick={() => setRightTab('rescue')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    rightTab === 'rescue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Rescue Hub {tasks.some(t => t.priority === 'panic' && !t.isCompleted) && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {rightTab === 'chat' && (
                  <motion.div
                    key="chat-tab"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    <AICompanion
                      tasks={tasks}
                      goals={goals}
                      habits={habits}
                      onTriggerPrioritize={triggerAIPrioritizeScan}
                      onApplyAIRecommendation={handleApplyAIRecommendation}
                      isLoadingPriorities={isPrioritizing}
                      prioritizationSummary={prioritizationSummary}
                      prioritizationAdvice={prioritizationAdvice}
                      suggestedFocusId={suggestedFocusId}
                    />
                  </motion.div>
                )}

                {rightTab === 'timeline' && (
                  <motion.div
                    key="timeline-tab"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <WeeklyTimeline
                      tasks={tasks}
                      slots={slots}
                      onAssignTaskToSlot={handleAssignTaskToSlot}
                      onClearSlot={handleClearSlot}
                      onAutoSchedule={triggerAIAutoSchedule}
                      isScheduling={isScheduling}
                    />
                  </motion.div>
                )}

                {rightTab === 'plan' && (
                  <motion.div
                    key="plan-tab"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ExecutionPlanner
                      selectedTask={activeSelectedTask}
                      onUpdateTaskPlan={handleUpdateTaskPlan}
                      onToggleStepComplete={handleToggleStepComplete}
                    />
                  </motion.div>
                )}

                {rightTab === 'rescue' && (
                  <motion.div
                    key="rescue-tab"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <AIRescueHub
                      tasks={tasks}
                      goals={goals}
                      focusSwitchesCount={focusSwitchesCount}
                      onSelectTask={selectTaskForPlanning}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </main>

        {/* FOOTER */}
        <footer className="px-6 md:px-8 py-12 mt-auto border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 bg-white">
          <p>© 2026 Last-Minute Life Saver. All victories pre-planned.</p>
          <p className="flex items-center gap-1 font-medium text-slate-500">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for beat-the-clock focus.
          </p>
        </footer>
      </div>
    </div>
  );
}
