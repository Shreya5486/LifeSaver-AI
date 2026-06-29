import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, HelpCircle, Play, 
  Mic, MicOff, Volume2, VolumeX, RefreshCw, Zap, Clock 
} from 'lucide-react';
import { ChatMessage, Task, Goal, Habit } from '../types';

interface AICompanionProps {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  onTriggerPrioritize: () => void;
  onApplyAIRecommendation: (focusTaskId: string) => void;
  isLoadingPriorities: boolean;
  prioritizationSummary: string;
  prioritizationAdvice: string[];
  suggestedFocusId: string | null;
}

export default function AICompanion({
  tasks,
  goals,
  habits,
  onTriggerPrioritize,
  onApplyAIRecommendation,
  isLoadingPriorities,
  prioritizationSummary,
  prioritizationAdvice,
  suggestedFocusId,
}: AICompanionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I'm your Last-Minute Life Saver. When deadlines are piling up and anxiety is high, I'm here to help you take the first step. Share what's on your mind, or let me diagnose your current workload!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // Set up Speech Recognition (browser native)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsRecording(true);
      rec.onend = () => setIsRecording(false);
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev ? prev + ' ' + transcript : transcript);
      };
      rec.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser or environment.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Speak text via browser native Speech Synthesis
  const speakText = (text: string) => {
    if (!isVoiceEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/[*#`_\-]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .substring(0, 300);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("TTS playback error", e);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const userText = textToSend.trim();
    if (!userText) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-10),
          tasks,
          habits,
          goals,
        }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.response || "I ran into a small error. Let's try that again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
      speakText(assistantMsg.text);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'assistant',
          text: "I'm having trouble connecting to my brain right now. Please verify your internet connection or try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const focusTask = tasks.find(t => t.id === suggestedFocusId);

  return (
    <div id="ai-companion-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display tracking-tight">AI Action Companion</h2>
            <p className="text-xs text-slate-500">Your stress-reducing strategic planning advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`p-2 rounded-lg transition-all duration-150 cursor-pointer ${isVoiceEnabled ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'}`}
            title={isVoiceEnabled ? "Mute AI Speech" : "Unmute AI Speech"}
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button 
            onClick={onTriggerPrioritize}
            disabled={isLoadingPriorities || tasks.length === 0}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-150 disabled:opacity-40 cursor-pointer"
            title="Scan deadlines"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingPriorities ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main split layout within container */}
      <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-150 overflow-hidden min-h-[480px]">
        
        {/* Left Focus Advisor */}
        <div className="w-full lg:w-5/12 p-5 bg-slate-50/50 overflow-y-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase">Strategic Focus</span>
            {tasks.length > 0 && !prioritizationSummary && (
              <button 
                onClick={onTriggerPrioritize}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 underline decoration-indigo-200"
              >
                Run AI Diagnostic
              </button>
            )}
          </div>

          {/* Core recommended action card */}
          {focusTask ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex flex-col gap-3"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700 mt-0.5">
                  <Zap className="w-4 h-4 fill-indigo-600 stroke-none animate-bounce" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest font-mono">Recommended focal point</h4>
                  <p className="text-xs font-bold text-slate-900 mt-1">{focusTask.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{focusTask.description || 'No description provided.'}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-indigo-100/70">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Est: {focusTask.duration}m
                </span>
                <button
                  onClick={() => onApplyAIRecommendation(focusTask.id)}
                  className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" /> Go to Steps
                </button>
              </div>
            </motion.div>
          ) : tasks.length > 0 ? (
            <div className="p-4 bg-white border border-slate-200 rounded-xl text-center py-6">
              <Sparkles className="w-5 h-5 text-indigo-500 mx-auto mb-2 animate-pulse" />
              <p className="text-xs font-bold text-slate-700">Need strategic direction?</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Run the AI Diagnostic. I will evaluate your workloads and extract the absolute best focal point to start.</p>
            </div>
          ) : (
            <div className="p-4 bg-white border border-slate-200 rounded-xl text-center py-6">
              <HelpCircle className="w-5 h-5 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Your planner is currently empty</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Add a task first in the Task Planner, then I can parse workloads and advice strategies.</p>
            </div>
          )}

          {/* AI Prioritized Text feedback */}
          {isLoadingPriorities ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mb-2" />
              <p className="text-xs text-slate-500 font-medium">Analyzing urgency metrics...</p>
            </div>
          ) : prioritizationSummary ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col gap-4"
            >
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-3xs">
                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono mb-1">AI Diagnostic Analysis</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{prioritizationSummary}</p>
              </div>

              {prioritizationAdvice && prioritizationAdvice.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">Strategic Steps Recommended</span>
                  <div className="flex flex-col gap-2">
                    {prioritizationAdvice.map((advice, idx) => (
                      <div key={idx} className="flex gap-2 p-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-700 shadow-3xs">
                        <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg h-fit">
                          0{idx + 1}
                        </span>
                        <p className="leading-relaxed font-medium">{advice}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </div>

        {/* Right Chat panel */}
        <div className="flex-1 flex flex-col h-full bg-white">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[350px]">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div 
                  className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-xs' 
                      : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200/50'
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            
            {isChatLoading && (
              <div className="flex items-center gap-1.5 mr-auto max-w-[85%] bg-slate-100 border border-slate-200 px-3.5 py-3 rounded-2xl rounded-bl-none text-xs text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1">Life Saver is analyzing metrics...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-150 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
            <button
              onClick={() => handleSendMessage("How can I beat procrastination today?")}
              className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 rounded-full transition-all shrink-0 cursor-pointer shadow-3xs"
            >
              💡 Beat procrastination
            </button>
            <button
              onClick={() => handleSendMessage("Help me design a study schedule.")}
              className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 rounded-full transition-all shrink-0 cursor-pointer shadow-3xs"
            >
              📅 Design a schedule
            </button>
            <button
              onClick={() => handleSendMessage("I am extremely anxious about a deadline today. What do I do?")}
              className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 rounded-full transition-all shrink-0 cursor-pointer shadow-3xs"
            >
              🚨 Panic management
            </button>
          </div>

          {/* Chat input controls */}
          <div className="p-3 border-t border-slate-150 bg-white flex items-center gap-2 shrink-0">
            <button
              onClick={toggleRecording}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isRecording 
                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title={isRecording ? "Stop voice input" : "Typing with voice input"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
              placeholder={isRecording ? "Listening... speak now." : "Command AI: 'Add task...'" }
              className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-hidden transition-all text-slate-900"
            />
            <button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isChatLoading}
              className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
