import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import localforage from 'localforage';
import type { EventState, Question, ActivityType } from '../types';

interface EventContextProps {
  state: EventState;
  updateQuestions: (questions: Question[]) => void;
  startRound: () => void;
  pauseRound: () => void;
  resumeRound: () => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  restartQuestion: () => void;
  restartRound: () => void;
  setActivity: (activity: ActivityType) => void;
  clearData: () => void;
  defaultTime: number;
  setDefaultTime: (time: number) => void;
}

const initialState: EventState = {
  questions: [],
  currentQuestionIndex: 0,
  timerRemaining: 20,
  status: 'IDLE',
  activity: 'ALL',
};

const EventContext = createContext<EventContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'technova_event_data';
const CHANNEL_NAME = 'technova_sync_channel';

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<EventState>(initialState);
  const [defaultTime, setDefaultTime] = useState(20);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Load from localforage on mount
  useEffect(() => {
    localforage.getItem(LOCAL_STORAGE_KEY).then((saved) => {
      if (saved) {
        try {
          const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
          setState(prev => ({
            ...prev,
            questions: parsed.questions || [],
          }));
        } catch (e) {
          console.error('Failed to parse local storage', e);
        }
      }
    }).catch(err => console.error(err));

    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current.onmessage = (event) => {
      if (event.data && event.data.type === 'SYNC_STATE') {
        setState(event.data.state);
      }
    };

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Sync state across tabs
  const broadcastState = (newState: EventState) => {
    setState(newState);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'SYNC_STATE', state: newState });
    }
  };

  // Timer logic
  useEffect(() => {
    // ONLY run the interval on the admin tab to prevent multiple tabs 
    // decrementing the timer and broadcasting simultaneously (which makes it run 2x fast).
    const isDisplayScreen = window.location.pathname.includes('/display');
    
    if (state.status === 'RUNNING' && !isDisplayScreen) {
      lastUpdateRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastUpdateRef.current) / 1000);
        
        if (delta >= 1) {
          lastUpdateRef.current = now;
          setState(prev => {
            if (prev.status !== 'RUNNING') return prev;
            
            const newTime = prev.timerRemaining - 1;
            if (newTime <= 0) {
              // Time's up, go to next question automatically
              const nextIndex = prev.currentQuestionIndex + 1;
              if (nextIndex >= prev.questions.length) {
                // Round completed
                const completedState = { ...prev, status: 'COMPLETED' as const, timerRemaining: 0 };
                if (channelRef.current) channelRef.current.postMessage({ type: 'SYNC_STATE', state: completedState });
                return completedState;
              } else {
                // Next question
                const nextQuestion = prev.questions[nextIndex];
                const nextTime = nextQuestion?.time || defaultTime;
                const nextState = { ...prev, currentQuestionIndex: nextIndex, timerRemaining: nextTime };
                if (channelRef.current) channelRef.current.postMessage({ type: 'SYNC_STATE', state: nextState });
                return nextState;
              }
            }
            const updatedState = { ...prev, timerRemaining: newTime };
            // Broadcast every second so display is in sync
            if (channelRef.current) channelRef.current.postMessage({ type: 'SYNC_STATE', state: updatedState });
            return updatedState;
          });
        }
      }, 100); // Check frequently for accuracy
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, defaultTime, state.questions.length]); // Intentionally omitting state.currentQuestionIndex and timerRemaining to avoid resetting interval

  const updateQuestions = (questions: Question[]) => {
    localforage.setItem(LOCAL_STORAGE_KEY, { questions }).catch(err => console.error(err));
    const newState = { ...state, questions, currentQuestionIndex: 0, status: 'IDLE' as const };
    if (questions.length > 0) {
      newState.timerRemaining = questions[0].time || defaultTime;
    }
    broadcastState(newState);
  };

  const clearData = () => {
    localforage.removeItem(LOCAL_STORAGE_KEY).catch(err => console.error(err));
    broadcastState({ ...initialState });
  };

  const startRound = () => {
    if (state.questions.length === 0) return;
    broadcastState({ ...state, status: 'RUNNING' });
  };

  const pauseRound = () => {
    broadcastState({ ...state, status: 'PAUSED' });
  };

  const resumeRound = () => {
    if (state.status === 'PAUSED') {
      broadcastState({ ...state, status: 'RUNNING' });
    }
  };

  const nextQuestion = () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      const nextIndex = state.currentQuestionIndex + 1;
      const nextQ = state.questions[nextIndex];
      broadcastState({
        ...state,
        currentQuestionIndex: nextIndex,
        timerRemaining: nextQ?.time || defaultTime,
      });
    } else {
      broadcastState({ ...state, status: 'COMPLETED', timerRemaining: 0 });
    }
  };

  const previousQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      const prevIndex = state.currentQuestionIndex - 1;
      const prevQ = state.questions[prevIndex];
      broadcastState({
        ...state,
        currentQuestionIndex: prevIndex,
        timerRemaining: prevQ?.time || defaultTime,
        status: state.status === 'COMPLETED' ? 'PAUSED' : state.status
      });
    }
  };

  const restartQuestion = () => {
    const currentQ = state.questions[state.currentQuestionIndex];
    broadcastState({
      ...state,
      timerRemaining: currentQ?.time || defaultTime,
    });
  };

  const restartRound = () => {
    const firstQ = state.questions[0];
    broadcastState({
      ...state,
      currentQuestionIndex: 0,
      timerRemaining: firstQ?.time || defaultTime,
      status: 'IDLE',
    });
  };

  const setActivity = (activity: ActivityType) => {
    broadcastState({ ...state, activity });
  };

  return (
    <EventContext.Provider
      value={{
        state,
        updateQuestions,
        startRound,
        pauseRound,
        resumeRound,
        nextQuestion,
        previousQuestion,
        restartQuestion,
        restartRound,
        setActivity,
        clearData,
        defaultTime,
        setDefaultTime
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};
