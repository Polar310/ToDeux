import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InputArea } from './components/InputArea';
import { TaskCard } from './components/TaskCard';
import { Task, CalendarType } from './types';
import { Check, ChevronDown, Home as HomeIcon, ListTodo } from 'lucide-react';

const App: React.FC = () => {
  type Page = 'home' | 'tasks';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [preferredCalendar, setPreferredCalendar] = useState<CalendarType>(CalendarType.GOOGLE);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<Page>('home');

  // Persist calendar preference
  useEffect(() => {
    const saved = localStorage.getItem('preferredCalendar');
    if (saved && Object.values(CalendarType).includes(saved as CalendarType)) {
      setPreferredCalendar(saved as CalendarType);
    }
  }, []);

  const handleCalendarChange = (type: CalendarType) => {
    setPreferredCalendar(type);
    localStorage.setItem('preferredCalendar', type);
    setIsDropdownOpen(false);
  };

  const calendarOptions = [
    { id: CalendarType.GOOGLE, label: 'Google Calendar' },
    { id: CalendarType.APPLE, label: 'Apple Calendar (.ics)' },
    { id: CalendarType.OUTLOOK, label: 'Outlook (.ics)' },
    { id: CalendarType.YAHOO, label: 'Yahoo Calendar' },
  ];

  const addTask = (title: string, date: string, time: string) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      date,
      time,
      createdAt: Date.now(),
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const navButtonClass = (page: Page) =>
    `
      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200
      ${activePage === page ? 'bg-warm-900 text-white shadow-sm' : 'text-warm-800/70 hover:bg-white/70 hover:text-warm-900'}
    `;

  return (
    <div className="app-shell min-h-screen font-sans text-warm-800 selection:bg-sage-100">
      {/* Header */}
      <header className="px-6 pt-10 pb-10 container-centered flex flex-col items-center gap-6">
        {/* Top Nav */}
        <div className="w-full max-w-5xl flex justify-center">
          <div className="flex items-center gap-2 bg-white/70 border border-warm-200/80 rounded-full p-1 shadow-soft backdrop-blur">
            <button className={navButtonClass('home')} onClick={() => setActivePage('home')}>
              <HomeIcon className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button className={navButtonClass('tasks')} onClick={() => setActivePage('tasks')}>
              <ListTodo className="w-4 h-4" />
              <span>Tasks</span>
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="brand-title mb-3 opacity-95">To Deux</h1>
          <p className="subtitle font-sans">Minimalist Scheduler</p>
        </div>

        {/* Calendar Selector */}
        {activePage === 'tasks' && (
          <div className="relative z-30">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="group inline-flex items-center gap-3 pl-4 pr-3 py-2 text-sm btn-ghost"
            >
              <span className="text-warm-800/60">Syncing to</span>
              <span className="brand-accent">{calendarOptions.find(c => c.id === preferredCalendar)?.label}</span>
              <ChevronDown
                className={`w-4 h-4 text-warm-800/40 transition-transform duration-300 ${
                  isDropdownOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'
                }`}
              />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-64 origin-top bg-white rounded-2xl shadow-xl shadow-warm-900/5 ring-1 ring-warm-900/5 overflow-hidden animate-slide-up z-40">
                  <div className="p-2 space-y-1">
                    {calendarOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleCalendarChange(option.id)}
                        className={`
                        flex w-full items-center justify-between px-4 py-3 text-sm rounded-xl transition-all duration-200
                        ${
                          preferredCalendar === option.id
                            ? 'bg-warm-50 text-warm-900 font-semibold'
                            : 'text-warm-800/70 hover:bg-warm-50/50 hover:text-warm-900'
                        }
                      `}
                      >
                        {option.label}
                        {preferredCalendar === option.id && <Check className="w-4 h-4 text-sage-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 w-[90vw] sm:w-[86vw] lg:w-[80vw] max-w-5xl mx-auto pb-24">
        {activePage === 'home' ? (
          <section className="card p-8 md:p-10 text-center space-y-6 animate-slide-up">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-warm-100 flex items-center justify-center border border-warm-200 shadow-inner">
                <HomeIcon className="w-7 h-7 text-warm-700" />
              </div>
            </div>
            <div className="space-y-4 max-w-3xl mx-auto text-left md:text-center">
              <h2 className="text-2xl font-semibold text-warm-900">Welcome home</h2>
              <p className="text-warm-700 leading-relaxed">
                Keep today tidy, sync to your calendar when you are ready, and jump back in from the Tasks tab anytime.
              </p>
              <div className="space-y-3 text-warm-700 leading-relaxed">
                <p>
                  Hey! If you get overwhelmed by walls of calendar enteries and long processes (same here), this is for you.
                </p>
                <p>
                  Here's a free, no-signup, no-ads, bare-bones task creator that links / downloads straight to your local calendar.
                  Create a task and it drops into your calendar—nothing else needed.
                </p>
                <p>
                  I'm keeping it simple to avoid extra costs or accounts. Just create, link, and move on. 
                  I Built it for myself as I hate how calendars look and just wanted the same feeling of writing on a blank sheet of paper but which auto syncs to my 
                  calendar, I hope this helps you & always open to feedback!! 
                </p>
                <p className="font-semibold text-warm-900">- Agastya</p>
                <p className="text-sm text-warm-700/80">AgastyaMudgal@outlook.com</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 text-left">
              <div className="bg-warm-50 border border-warm-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-warm-900">Plan fast</p>
                <p className="text-sm text-warm-700/80 mt-2">Add tasks in seconds with dates and optional times.</p>
              </div>
              <div className="bg-warm-50 border border-warm-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-warm-900">Stay flexible</p>
                <p className="text-sm text-warm-700/80 mt-2">Edit or clear time to mark something as all day.</p>
              </div>
              <div className="bg-warm-50 border border-warm-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-warm-900">Sync when ready</p>
                <p className="text-sm text-warm-700/80 mt-2">Export to Google, Apple/Outlook, or Yahoo calendars.</p>
              </div>
            </div>
            <button
              className="btn-primary px-6 py-3 text-sm font-bold rounded-xl"
              onClick={() => setActivePage('tasks')}
            >
              Go to tasks
            </button>
          </section>
        ) : (
          <>
            {/* Input Section */}
            <section className="mb-12 relative z-20">
              <InputArea onTaskSubmit={addTask} />
            </section>

            {/* Task List */}
            <section className="space-y-5">
              {tasks.length === 0 && (
                <div className="text-center py-20 opacity-50 rounded-3xl border border-dashed border-warm-200">
                  <p className="font-serif text-2xl italic text-warm-800/40">No tasks scheduled for today.</p>
                </div>
              )}

              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  preferredCalendar={preferredCalendar}
                  onUpdate={updateTask}
                  onRemove={removeTask}
                />
              ))}
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 text-center text-warm-800/30 text-[10px] uppercase tracking-[0.2em] font-medium">
        SimpleSync Todo
      </footer>
    </div>
  );
};

export default App;
