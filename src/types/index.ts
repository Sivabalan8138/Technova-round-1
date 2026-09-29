export interface Question {
  sNo: number;
  questionText: string;
  options?: {
    a?: string;
    b?: string;
    c?: string;
    d?: string;
  };
  time: number;
  imageUrl?: string;
  localImage?: string; // Data URL for uploaded image
}

export type ActivityType = 'QUICK_MIX' | 'EMOJI_DECODE' | 'ALL';

export interface EventState {
  questions: Question[];
  currentQuestionIndex: number;
  timerRemaining: number;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  activity: ActivityType;
}

export type SyncMessage =
  | { type: 'SYNC_STATE'; state: EventState }
  | { type: 'UPDATE_QUESTIONS'; questions: Question[] }
  | { type: 'START_ROUND' }
  | { type: 'PAUSE_ROUND' }
  | { type: 'RESUME_ROUND' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'RESTART_QUESTION' }
  | { type: 'RESTART_ROUND' }
  | { type: 'SET_ACTIVITY'; activity: ActivityType };
