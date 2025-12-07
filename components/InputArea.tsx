import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface InputAreaProps {
  onTaskSubmit: (title: string, date: string, time: string) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ onTaskSubmit }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState("");
  // default date to today so users don't have to click 'Today'
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !date) return;

    onTaskSubmit(title, date, time);
    setTitle("");
    setDate("");
    setTime("");
  };

  const setToday = () => setDate(todayStr);

  return (
    <div className="w-full card p-6 md:p-8 transition-all duration-300 focus-within:border-warm-300 focus-within:ring-4 focus-within:ring-warm-100/50">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Description Input */}
        <div className="w-full">
          <label htmlFor="task-title" className="sr-only">Task Description</label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need to get done?"
            className="w-full bg-transparent text-2xl text-warm-900 placeholder-warm-300 outline-none font-medium font-sans tracking-tight input-large"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-4 border-t border-warm-100">
          <div className="flex flex-wrap items-end gap-4">
             {/* Date Input Group */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-warm-800/40 uppercase tracking-widest pl-1">When</label>
                <div className="flex items-center gap-2 bg-warm-50 border border-warm-200/80 rounded-xl p-1.5 pr-3 hover:border-warm-300 transition-colors">
                    <button 
                        type="button"
                        onClick={setToday}
                        className="px-3 py-1.5 text-xs font-bold text-warm-800 bg-white border border-warm-200 rounded-lg shadow-sm hover:bg-warm-50 hover:text-warm-900 transition-all uppercase tracking-wider"
                    >
                        Today
                    </button>
                    <div className="h-5 w-px bg-warm-200/60 mx-1"></div>
                    <input 
                        type="date" 
                        required
                        min={todayStr}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent text-sm font-medium text-warm-900 focus:outline-none font-sans uppercase tracking-wide cursor-pointer"
                    />
                </div>
            </div>
            
            {/* Time Input */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-warm-800/40 uppercase tracking-widest pl-1">Time (Optional)</label>
                <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-warm-50 border border-warm-200/80 text-sm font-medium text-warm-900 rounded-xl px-3 py-2.5 focus:outline-none focus:border-warm-300 focus:bg-white transition-all font-sans min-w-[110px] cursor-pointer"
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim() || !date}
            className={`
              flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 mt-2 sm:mt-0
              ${!title.trim() || !date 
                ? 'bg-warm-100 text-warm-300 cursor-not-allowed' 
                : 'btn-primary'}
            `}
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </form>
    </div>
  );
};