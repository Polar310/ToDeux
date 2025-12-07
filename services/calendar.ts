import { Task } from "../types";

const formatGoogleDate = (date: string, time: string): string => {
  // Google format: YYYYMMDDTHHmmSS
  const cleanDate = date.replace(/-/g, '');
  const cleanTime = time ? time.replace(/:/g, '') + '00' : '';
  return time ? `${cleanDate}T${cleanTime}` : cleanDate;
};

const calculateEnd = (date: string, time: string): string => {
    // Default to 1 hour duration for simplicity
    if (!time) return date; // All day event, end is same day (Google handles this as all day if start/end match mostly, or next day)
    
    const [h, m] = time.split(':').map(Number);
    const d = new Date(date);
    d.setHours(h + 1);
    d.setMinutes(m);
    
    const nextH = d.getHours().toString().padStart(2, '0');
    const nextM = d.getMinutes().toString().padStart(2, '0');
    
    // If it crossed midnight, simplistic approach: just return time. 
    // Ideally we handle date rollover but for a simple todo list, let's keep it scoped.
    return `${nextH}:${nextM}`;
};

export const generateGoogleCalendarUrl = (task: Task): string => {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const action = "TEMPLATE";
  
  const startStr = formatGoogleDate(task.date, task.time);
  
  // Calculate end time (1 hour later)
  let endStr = "";
  if (task.time) {
      const endTime = calculateEnd(task.date, task.time);
      endStr = formatGoogleDate(task.date, endTime);
  } else {
      // For all day, Google expects YYYYMMDD / YYYYMMDD (next day usually for inclusive, but same day works for single day)
      // Actually for single day all-day event, start=end is fine or end=start+1
      // Let's just use startStr/startStr for simplicity, Google usually adapts.
      // Better: YYYYMMDD/YYYYMMDD
      endStr = startStr;
  }

  const dates = `${startStr}/${endStr}`;
  
  const params = new URLSearchParams({
    action,
    text: task.title,
    dates,
    details: "Created with SimpleSync",
  });

  return `${baseUrl}?${params.toString()}`;
};

export const generateYahooCalendarUrl = (task: Task): string => {
    const st = formatGoogleDate(task.date, task.time) + (task.time ? "" : ""); // Yahoo might want Z or local
    // Yahoo uses very similar structure but sometimes tricky with timezones.
    
    const params = new URLSearchParams({
        v: "60",
        title: task.title,
        st: st,
        desc: "Created with SimpleSync",
    });

    return `https://calendar.yahoo.com/?${params.toString()}`;
}

export const downloadIcsFile = (task: Task) => {
  const formatIcsDate = (d: string, t: string) => {
    const cleanDate = d.replace(/-/g, '');
    if (!t) {
        return `;VALUE=DATE:${cleanDate}`;
    }
    const cleanTime = t.replace(/:/g, '') + '00';
    return `:${cleanDate}T${cleanTime}`;
  };

  const now = new Date().toISOString().replace(/-|:|\.\d\d\d/g, "");
  
  // Calc end time for ICS
  let endTimeStr = task.time;
  if (task.time) {
      endTimeStr = calculateEnd(task.date, task.time);
  }

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SimpleSync//Todo App//EN",
    "BEGIN:VEVENT",
    `UID:${task.id}@simplesync.app`,
    `DTSTAMP:${now}`,
    `DTSTART${formatIcsDate(task.date, task.time)}`,
    `DTEND${formatIcsDate(task.date, endTimeStr)}`,
    `SUMMARY:${task.title}`,
    `DESCRIPTION:Created with SimpleSync`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${task.title.replace(/\s+/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Create an event directly in the user's Google Calendar using Google Calendar API.
 * Note: This requires an OAuth2 access token with scope `https://www.googleapis.com/auth/calendar.events`.
 * Use this helper from your UI after obtaining an access token via Google OAuth flow.
 */
export const createGoogleEvent = async (task: Task, accessToken: string) => {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  // For timed events use dateTime; for all-day use `date` and set end to next day
  let eventBody: any;
  if (task.time) {
    const start = `${task.date}T${task.time}:00`;
    // naive 1-hour end
    const [h, m] = task.time.split(':').map(Number);
    const endDate = new Date(task.date);
    endDate.setHours(h + 1, m, 0, 0);
    const end = `${endDate.getFullYear().toString().padStart(4,'0')}-${(endDate.getMonth()+1).toString().padStart(2,'0')}-${endDate.getDate().toString().padStart(2,'0')}T${endDate.getHours().toString().padStart(2,'0')}:${endDate.getMinutes().toString().padStart(2,'0')}:00`;

    eventBody = {
      summary: task.title,
      description: 'Created with SimpleSync',
      start: { dateTime: start },
      end: { dateTime: end }
    };
  } else {
    // all-day event: Google's API expects end date to be the day AFTER the event (exclusive)
    const startDate = task.date;
    const d = new Date(task.date);
    d.setDate(d.getDate() + 1);
    const endDate = `${d.getFullYear().toString().padStart(4,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
    eventBody = {
      summary: task.title,
      description: 'Created with SimpleSync',
      start: { date: startDate },
      end: { date: endDate }
    };
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventBody)
  });

  if (!resp.ok) throw new Error(`Google API error: ${resp.status} ${await resp.text()}`);
  return resp.json();
};
