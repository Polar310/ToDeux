export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  createdAt: number;
}

export enum CalendarType {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE', // .ics (Outlook/Apple)
  OUTLOOK = 'OUTLOOK', // .ics (Outlook-specific button)
  YAHOO = 'YAHOO'
}

export interface ParsedEventData {
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  allDay: boolean;
}
