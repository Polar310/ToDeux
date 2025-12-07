import React, { useState } from 'react';
import { Task, CalendarType } from '../types';
import { Calendar, Clock, Edit2, X, Save, Trash2 } from 'lucide-react';
import { generateGoogleCalendarUrl, downloadIcsFile, generateYahooCalendarUrl, createGoogleEvent } from '../services/calendar';
import { signInWithGoogle, getStoredGoogleAccessToken } from '../services/oauth';

interface TaskCardProps {
  task: Task;
  preferredCalendar: CalendarType;
  onUpdate: (id: string, data: Partial<Task>) => void;
  onRemove: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDate, setEditDate] = useState(task.date);
  const [editTime, setEditTime] = useState(task.time);

  const displayDate = new Date(task.date).toLocaleDateString('en-US', { 
      weekday: 'long', month: 'short', day: 'numeric' 
  });
  
  const displayTime = task.time 
    ? new Date(`2000-01-01T${task.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase() 
    : 'All Day';

  const handleSave = () => {
    if (!editTitle.trim() || !editDate) return;
    onUpdate(task.id, {
        title: editTitle,
        date: editDate,
        time: editTime
    });
    setIsEditing(false);
  };

  const handleSync = (type: CalendarType) => {
      switch (type) {
          case CalendarType.GOOGLE: {
              // Try to use stored token to create event directly; otherwise open prefill as fallback
              const token = getStoredGoogleAccessToken();
              if (token) {
                createGoogleEvent(task, token)
                  .then(() => alert('Event created in your Google Calendar'))
                  .catch(async (err) => {
                    console.error('Google create event failed', err);
                    // If token expired or failed, attempt sign-in flow
                    try {
                      await signInWithGoogle();
                      const t2 = getStoredGoogleAccessToken();
                      if (t2) await createGoogleEvent(task, t2);
                      alert('Event created in your Google Calendar');
                    } catch (e) {
                      // fallback to open prefilled URL
                      console.warn('Fallback to open prefilled Google URL', e);
                      window.open(generateGoogleCalendarUrl(task), '_blank');
                    }
                  });
              } else {
                // no token: start OAuth flow, then create event
                signInWithGoogle()
                  .then(({ access_token }) => createGoogleEvent(task, access_token))
                  .then(() => alert('Event created in your Google Calendar'))
                  .catch((err) => {
                    console.error('Google OAuth/create failed', err);
                    // fallback: open prefilled URL
                    window.open(generateGoogleCalendarUrl(task), '_blank');
                  });
              }
              break;
          }
          case CalendarType.APPLE:
              downloadIcsFile(task); // .ics import works for Apple Calendar
              break;
          case CalendarType.OUTLOOK:
              downloadIcsFile(task); // .ics import works for Outlook
              break;
          case CalendarType.YAHOO:
               window.open(generateYahooCalendarUrl(task), '_blank');
               break;
      }
  };

  if (isEditing) {
      return (
        <div className="bg-white border border-warm-200 rounded-2xl p-6 shadow-soft animate-slide-up">
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-sage-500 uppercase tracking-widest">Editing Task</label>
                    <button onClick={() => setIsEditing(false)} className="text-warm-300 hover:text-warm-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xl font-semibold text-warm-900 bg-warm-50 border border-warm-200 p-3 rounded-xl focus:outline-none focus:border-warm-400 focus:bg-white transition-all"
                    autoFocus
                />
                
                <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                        <label className="text-[10px] font-bold text-warm-800/40 uppercase tracking-wider">Date</label>
                        <input 
                            type="date" 
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="bg-white border border-warm-200 text-warm-900 text-sm font-medium rounded-lg p-2.5 focus:outline-none focus:border-warm-400 w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                         <label className="text-[10px] font-bold text-warm-800/40 uppercase tracking-wider">Time (Optional)</label>
                         <div className="flex items-center gap-2">
                            <input 
                                type="time" 
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="bg-white border border-warm-200 text-warm-900 text-sm font-medium rounded-lg p-2.5 focus:outline-none focus:border-warm-400 w-full"
                            />
                            {editTime && (
                                <button 
                                    onClick={() => setEditTime('')}
                                    title="Clear time (All Day)"
                                    className="p-2.5 text-warm-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                         </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-warm-100">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-2 text-sm font-medium text-warm-500 hover:text-warm-700 hover:bg-warm-50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-warm-900 text-white text-sm font-bold rounded-lg hover:bg-black shadow-sm hover:shadow-md transition-all"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
             </div>
        </div>
      )
  }

  return (
    <div className="card p-6 transition-all animate-slide-up group relative">
      
      {/* Actions (Hover) */}
      <div className="absolute top-5 right-5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button onClick={() => setIsEditing(true)} className="p-2 text-warm-300 hover:text-warm-800 hover:bg-warm-50 rounded-lg transition-colors" title="Edit Task">
                <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => onRemove(task.id)} className="p-2 text-warm-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Task">
                <Trash2 className="w-4 h-4" />
            </button>
      </div>

      {/* Header */}
      <div className="mb-4 pr-16">
          <h3 className="text-xl font-medium text-warm-900 leading-snug break-words tracking-tight font-sans">
            {task.title}
          </h3>
      </div>

      {/* Meta Data */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider pill-meta">
            <Calendar className="w-3.5 h-3.5 text-warm-400" />
            {displayDate}
        </div>
        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider pill-meta ${!task.time ? 'text-warm-400' : 'text-warm-600'}`}>
            <Clock className="w-3.5 h-3.5 text-warm-400" />
            {displayTime}
        </div>
      </div>

      {/* Action Area - 3 Equal Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 action-buttons">
          <button 
            onClick={() => handleSync(CalendarType.GOOGLE)}
            className="flex items-center justify-center gap-2 px-2 py-3 btn-ghost"
          >
            <span className="font-bold text-xs tracking-wide">Google</span>
          </button>

          <button 
            onClick={() => handleSync(CalendarType.APPLE)}
            className="flex items-center justify-center gap-2 px-2 py-3 btn-ghost"
          >
            <span className="font-bold text-xs tracking-wide">Apple</span>
          </button>

          <button 
            onClick={() => handleSync(CalendarType.OUTLOOK)}
            className="flex items-center justify-center gap-2 px-2 py-3 btn-ghost"
          >
            <span className="font-bold text-xs tracking-wide">Outlook</span>
          </button>

          <button 
            onClick={() => handleSync(CalendarType.YAHOO)}
            className="flex items-center justify-center gap-2 px-2 py-3 btn-ghost"
          >
            <span className="font-bold text-xs tracking-wide">Yahoo</span>
          </button>
      </div>
    </div>
  );
};
