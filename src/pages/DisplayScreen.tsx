import { useEffect, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { useEventContext } from '../store/EventContext';

export default function DisplayScreen() {
  const { state } = useEventContext();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (state.questions.length === 0) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white p-8 circuit-pattern">
        <h1 className="text-6xl font-bold tracking-widest text-brand-accent mb-6 animate-pulse">TECHNOVA</h1>
        <h2 className="text-3xl font-light mb-12">ROUND 1 — SPARK START</h2>
        <div className="text-xl text-gray-400">Waiting for coordinator to load questions...</div>
      </div>
    );
  }

  if (state.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white p-8 circuit-pattern text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-secondary/10 to-transparent"></div>
        <div className="z-10">
          <h1 className="text-8xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-secondary tracking-widest">
            ROUND COMPLETED
          </h1>
          <h2 className="text-5xl mb-16 flex items-center justify-center">
            <span className="w-6 h-6 rounded-full bg-blue-500 mr-4 shadow-[0_0_20px_rgba(59,130,246,0.8)]"></span>
            SPARK START
          </h2>
          <h3 className="text-4xl font-light mb-24">Thank You!</h3>

          <div className="mt-12 opacity-80 space-y-2">
            <h4 className="text-3xl font-bold text-brand-accent tracking-widest mb-4">TECHNOVA</h4>
            <p className="text-xl">Organized by Electrical Club</p>
            <p className="text-xl">Department of Electrical and Electronics Engineering</p>
            <p className="text-xl">VSB Engineering College, Karur</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = state.questions[state.currentQuestionIndex];
  const hasImage = !!(currentQ?.localImage || currentQ?.imageUrl);
  const isEmojiDecode = state.activity === 'EMOJI_DECODE' || (hasImage && state.activity === 'ALL');
  
  // Timer Warning: blink red if 5 seconds or less remaining and status is running
  const isTimeWarning = state.timerRemaining <= 5 && state.timerRemaining > 0 && state.status === 'RUNNING';

  return (
    <div className="h-screen w-screen bg-brand-dark text-white flex flex-col overflow-hidden circuit-pattern relative">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-secondary/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-accent/10 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-4 md:px-8 md:py-6 flex justify-between items-start z-10 shrink-0">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-widest text-brand-accent mb-1">TECHNOVA</h1>
          <h2 className="text-xl md:text-3xl font-light tracking-wide text-gray-200">ROUND 1 — SPARK START</h2>
        </div>

        <div className={`
          border-4 rounded-xl px-6 py-3 md:px-10 md:py-4 font-mono text-4xl md:text-6xl font-bold shadow-2xl transition-colors duration-300
          ${isTimeWarning ? 'border-red-500 text-red-500 animate-pulse bg-red-900/20' : 'border-brand-accent text-brand-accent bg-black/40'}
        `}>
          {formatTime(state.timerRemaining)}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 z-10 w-full max-w-[1600px] mx-auto overflow-hidden">
        {isEmojiDecode && hasImage ? (
          // EMOJI DECODE / IMAGE FULL-SCREEN MODE
          <div className="w-full h-full flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
             {/* Note: The user requested image to occupy almost the entire screen and options ONLY if specified by coordinator (but generally not shown for Emoji Decode) */}
            <div className="w-full h-[60vh] md:h-[70vh] rounded-2xl bg-black/60 border border-gray-800/50 p-4 md:p-8 shadow-2xl backdrop-blur-sm flex items-center justify-center">
              <img 
                src={currentQ.localImage || currentQ.imageUrl} 
                alt="Puzzle" 
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
              />
            </div>
            {/* Show question text below image if it exists and isn't just "Emoji Decode" */}
            {currentQ.questionText && currentQ.questionText.toLowerCase() !== 'emoji decode' && (
              <h3 className="mt-8 text-2xl md:text-4xl text-center font-medium max-w-4xl text-gray-200">
                {currentQ.questionText}
              </h3>
            )}
          </div>
        ) : (
          // QUICK MIX MODE
          <div className="w-full flex flex-col justify-center items-center h-full max-h-full animate-[fadeIn_0.5s_ease-out]">
            <div className="mb-6 md:mb-10 text-center flex-shrink-0">
              <div className="inline-block bg-brand-secondary/20 border border-brand-secondary/50 text-brand-secondary px-6 py-2 rounded-full text-lg md:text-xl font-bold tracking-widest mb-4 md:mb-6">
                QUESTION {String(state.currentQuestionIndex + 1).padStart(2, '0')}
              </div>
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight max-w-6xl mx-auto drop-shadow-lg px-4">
                {currentQ?.questionText}
              </h3>
            </div>

            {currentQ?.options && (currentQ.options.a || currentQ.options.b || currentQ.options.c || currentQ.options.d) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-6xl mx-auto w-full px-4 flex-shrink min-h-0 overflow-y-auto custom-scrollbar pb-4">
                {['a', 'b', 'c', 'd'].map((opt) => {
                  const optText = currentQ.options?.[opt as keyof typeof currentQ.options];
                  if (!optText) return null;
                  return (
                    <div key={opt} className="bg-[#0f111a]/80 backdrop-blur-md border border-gray-700 p-4 md:p-6 lg:p-8 rounded-2xl shadow-xl flex items-center transform transition-transform">
                      <span className="text-3xl md:text-4xl font-bold text-brand-accent mr-4 md:mr-6 uppercase">
                        {opt}.
                      </span>
                      <span className="text-2xl md:text-3xl font-medium text-gray-100">
                        {optText}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Branding (Subtle) */}
      <footer className="p-4 opacity-40 text-center z-10 text-xs md:text-sm tracking-widest uppercase shrink-0">
        Organized by Electrical Club | VSB Engineering College
      </footer>

      {/* Floating Controls (Hidden in presentation, visible on hover) */}
      <div className="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity z-50">
        <button 
          onClick={toggleFullscreen}
          className="bg-black/50 p-3 rounded-full border border-gray-700 hover:bg-brand-secondary/50 transition-colors"
          title="Toggle Fullscreen (F)"
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>
    </div>
  );
}
