import { useState, useEffect } from 'react';
import { useEventContext } from '../store/EventContext';
import * as XLSX from 'xlsx';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Monitor, RefreshCw, Upload, Download, Image as ImageIcon, Trash2 } from 'lucide-react';
import type { Question } from '../types';

export default function AdminPanel() {
  const {
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
  } = useEventContext();

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;

      switch (e.key) {
        case ' ': // Space
          e.preventDefault(); // prevent scrolling
          if (state.status === 'IDLE' || state.status === 'PAUSED') {
            state.status === 'IDLE' ? startRound() : resumeRound();
          } else if (state.status === 'RUNNING') {
            pauseRound();
          }
          break;
        case 'ArrowRight':
          nextQuestion();
          break;
        case 'ArrowLeft':
          previousQuestion();
          break;
        case 'r':
        case 'R':
          restartQuestion();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.status, startRound, resumeRound, pauseRound, nextQuestion, previousQuestion, restartQuestion]);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'S.NO': 1, 'Question': 'What is the SI unit of current?', 'Option A': 'Volt', 'Option B': 'Ampere', 'Option C': 'Ohm', 'Option D': 'Watt', 'Time': 20, 'Image URL': '' },
      { 'S.NO': 2, 'Question': 'What does CPU stand for?', 'Option A': 'Central Processing Unit', 'Option B': 'Control Power Unit', 'Option C': 'Computer Processing Unit', 'Option D': 'Central Program Unit', 'Time': 20, 'Image URL': '' },
      { 'S.NO': 3, 'Question': 'Emoji Decode', 'Option A': '', 'Option B': '', 'Option C': '', 'Option D': '', 'Time': 20, 'Image URL': 'Q3.png' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "Technova_SparkStart_Template.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const parsedQuestions: Question[] = [];
        let errorMsg = '';

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const sNo = parseInt(row['S.NO']);
          if (!sNo || isNaN(sNo)) {
            errorMsg = `Row ${i + 2}: S.NO is missing or invalid.`;
            break;
          }
          if (!row['Question'] || String(row['Question']).trim() === '') {
            errorMsg = `Row ${i + 2}: Question is missing.`;
            break;
          }
          
          let time = defaultTime;
          if (row['Time'] !== undefined && row['Time'] !== '') {
            const parsedTime = parseInt(row['Time']);
            if (isNaN(parsedTime)) {
              errorMsg = `Row ${i + 2}: Time must be a number.`;
              break;
            }
            time = parsedTime;
          }

          parsedQuestions.push({
            sNo,
            questionText: String(row['Question']).trim(),
            options: {
              a: row['Option A'] ? String(row['Option A']).trim() : undefined,
              b: row['Option B'] ? String(row['Option B']).trim() : undefined,
              c: row['Option C'] ? String(row['Option C']).trim() : undefined,
              d: row['Option D'] ? String(row['Option D']).trim() : undefined,
            },
            time,
            imageUrl: row['Image URL'] ? String(row['Image URL']).trim() : undefined
          });
        }

        if (errorMsg) {
          setMessage({ text: errorMsg, type: 'error' });
        } else if (parsedQuestions.length > 0) {
          // If we already have localImages, try to keep them matched by S.NO
          const questionsWithImages = parsedQuestions.map(q => {
            const existing = state.questions.find(eq => eq.sNo === q.sNo);
            if (existing && existing.localImage) {
              return { ...q, localImage: existing.localImage };
            }
            return q;
          });
          
          updateQuestions(questionsWithImages);
          setMessage({ text: `Excel uploaded successfully — ${parsedQuestions.length} questions imported.`, type: 'success' });
        } else {
          setMessage({ text: 'Excel file is empty or invalid.', type: 'error' });
        }
      } catch (err) {
        console.error(err);
        setMessage({ text: 'Error parsing Excel file.', type: 'error' });
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = '';
  };

  const handleImageFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (state.questions.length === 0) {
      setMessage({ text: 'Please upload the Excel file with questions first.', type: 'error' });
      return;
    }

    let matchCount = 0;
    const updatedQuestions = [...state.questions];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      // Extract number from filename (e.g., Q1.png, 1.png, image-2.jpg)
      const match = file.name.match(/\d+/);
      if (match) {
        const qNum = parseInt(match[0]);
        const qIndex = updatedQuestions.findIndex(q => q.sNo === qNum);
        if (qIndex !== -1) {
          // Read file as data URL
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
          });
          updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], localImage: dataUrl };
          matchCount++;
        }
      }
    }

    if (matchCount > 0) {
      updateQuestions(updatedQuestions);
      setMessage({ text: `Successfully matched ${matchCount} images to questions.`, type: 'success' });
    } else {
      setMessage({ text: 'No matching images found for the uploaded questions. (Naming format: Q1.png, 2.jpg, etc.)', type: 'info' });
    }
  };

  const openDisplay = () => {
    window.open('/display', 'TechnovaDisplay', 'width=1280,height=720');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to remove all imported questions and images?")) {
      clearData();
      setMessage({ text: 'All event data cleared.', type: 'info' });
    }
  };

  return (
    <div className="min-h-screen p-8 circuit-pattern relative">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-wider text-brand-accent mb-2">TECHNOVA</h1>
          <h2 className="text-2xl font-semibold mb-2">ROUND 1 — SPARK START</h2>
          <p className="text-gray-400">Organized by Electrical Club</p>
          <p className="text-gray-400">Department of Electrical and Electronics Engineering</p>
          <p className="text-gray-400">VSB Engineering College, Karur</p>
        </header>

        {message && (
          <div className={`p-4 mb-6 rounded-lg border flex items-center justify-center transition-all ${
            message.type === 'error' ? 'bg-red-900/30 border-red-500 text-red-200' : 
            message.type === 'success' ? 'bg-green-900/30 border-green-500 text-green-200' : 
            'bg-blue-900/30 border-blue-500 text-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center text-brand-accent">
                <Upload className="mr-2" size={20} /> Data Import
              </h3>
              
              <div className="space-y-4">
                <button 
                  onClick={downloadTemplate}
                  className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 transition flex items-center justify-center rounded-lg border border-gray-700"
                >
                  <Download className="mr-2" size={18} /> DOWNLOAD EXCEL TEMPLATE
                </button>

                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleExcelUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="excel-upload"
                  />
                  <button className="w-full py-3 px-4 bg-brand-secondary hover:bg-purple-600 transition flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(112,0,255,0.3)]">
                    <Upload className="mr-2" size={18} /> UPLOAD EXCEL
                  </button>
                </div>

                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    // @ts-ignore - webkitdirectory is non-standard but widely supported
                    webkitdirectory="true"
                    directory=""
                    multiple
                    onChange={handleImageFolderUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="image-folder-upload"
                  />
                  <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 transition flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                    <ImageIcon className="mr-2" size={18} /> UPLOAD IMAGE FOLDER
                  </button>
                </div>
                
                <button 
                  onClick={handleClearData}
                  className="w-full py-3 px-4 mt-4 bg-red-900/50 hover:bg-red-800 transition flex items-center justify-center rounded-lg border border-red-700/50 text-red-200"
                >
                  <Trash2 className="mr-2" size={18} /> CLEAR EVENT DATA
                </button>
              </div>
            </div>

            <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-brand-accent">Event Configuration</h3>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Activity Mode</label>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => setActivity('QUICK_MIX')}
                    className={`py-2 px-3 rounded border transition ${state.activity === 'QUICK_MIX' ? 'bg-brand-secondary border-brand-secondary' : 'border-gray-700 hover:bg-gray-800'}`}
                  >
                    🧠 QUICK MIX
                  </button>
                  <button 
                    onClick={() => setActivity('EMOJI_DECODE')}
                    className={`py-2 px-3 rounded border transition ${state.activity === 'EMOJI_DECODE' ? 'bg-brand-secondary border-brand-secondary' : 'border-gray-700 hover:bg-gray-800'}`}
                  >
                    😂 EMOJI DECODE
                  </button>
                  <button 
                    onClick={() => setActivity('ALL')}
                    className={`py-2 px-3 rounded border transition ${state.activity === 'ALL' ? 'bg-brand-secondary border-brand-secondary' : 'border-gray-700 hover:bg-gray-800'}`}
                  >
                    ALL QUESTIONS
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Default Timer</label>
                <select 
                  value={defaultTime} 
                  onChange={(e) => setDefaultTime(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-brand-accent"
                >
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                  <option value={15}>15 seconds</option>
                  <option value={20}>20 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Control Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#12121a] border border-brand-accent/30 rounded-xl p-6 shadow-[0_0_30px_rgba(0,240,255,0.05)]">
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                <h3 className="text-2xl font-bold flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-3"></span>
                  Live Controls
                </h3>
                <button 
                  onClick={openDisplay}
                  className="py-2 px-6 bg-brand-light text-brand-dark font-bold hover:bg-white transition flex items-center rounded shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                >
                  <Monitor className="mr-2" size={18} /> FULL SCREEN DISPLAY
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {state.status === 'IDLE' || state.status === 'PAUSED' ? (
                  <button onClick={state.status === 'IDLE' ? startRound : resumeRound} className="py-4 bg-green-600 hover:bg-green-500 rounded-lg flex flex-col items-center justify-center font-bold text-lg shadow-lg">
                    <Play size={24} className="mb-1" /> {state.status === 'IDLE' ? 'START' : 'RESUME'}
                  </button>
                ) : (
                  <button onClick={pauseRound} className="py-4 bg-yellow-600 hover:bg-yellow-500 rounded-lg flex flex-col items-center justify-center font-bold text-lg shadow-lg">
                    <Pause size={24} className="mb-1" /> PAUSE
                  </button>
                )}
                
                <button onClick={previousQuestion} className="py-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex flex-col items-center justify-center font-bold shadow-lg border border-gray-700">
                  <SkipBack size={24} className="mb-1" /> PREVIOUS
                </button>
                
                <button onClick={nextQuestion} className="py-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex flex-col items-center justify-center font-bold shadow-lg border border-gray-700">
                  <SkipForward size={24} className="mb-1" /> NEXT
                </button>
                
                <button onClick={restartQuestion} className="py-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex flex-col items-center justify-center font-bold shadow-lg border border-gray-700">
                  <RotateCcw size={24} className="mb-1" /> RESTART Q.
                </button>
              </div>

              <div className="flex justify-center mb-6">
                <button onClick={restartRound} className="py-2 px-8 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 text-sm">
                  <RefreshCw size={16} className="mr-2" /> RESTART ROUND
                </button>
              </div>

              {/* Status and Current Question Preview */}
              <div className="bg-black/50 rounded-xl border border-gray-800 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-brand-dark border-b border-l border-gray-800 px-4 py-2 font-mono text-xl text-brand-accent font-bold rounded-bl-lg z-10">
                  {formatTime(state.timerRemaining)}
                </div>
                
                <div className="text-sm text-gray-500 mb-2 font-mono uppercase tracking-widest">
                  Status: <span className={`font-bold ${state.status === 'RUNNING' ? 'text-green-400' : state.status === 'PAUSED' ? 'text-yellow-400' : 'text-gray-400'}`}>{state.status}</span>
                  <span className="mx-2">|</span>
                  Questions: {state.questions.length}
                </div>

                {state.questions.length > 0 ? (
                  <>
                    <h4 className="text-xl font-bold text-brand-light mb-4 mt-2">
                      QUESTION {String(state.currentQuestionIndex + 1).padStart(2, '0')}
                    </h4>
                    
                    <div className="text-lg mb-6 leading-relaxed">
                      {state.questions[state.currentQuestionIndex].questionText}
                    </div>

                    {(state.questions[state.currentQuestionIndex].localImage || state.questions[state.currentQuestionIndex].imageUrl) ? (
                      <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800 flex items-center">
                        <ImageIcon className="text-blue-400 mr-3" />
                        <span className="text-sm">
                          Image: {state.questions[state.currentQuestionIndex].localImage ? 'Local Upload' : state.questions[state.currentQuestionIndex].imageUrl}
                        </span>
                        {state.questions[state.currentQuestionIndex].localImage && (
                          <img 
                            src={state.questions[state.currentQuestionIndex].localImage} 
                            className="h-16 ml-auto rounded border border-gray-700 object-cover" 
                            alt="preview" 
                          />
                        )}
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['a', 'b', 'c', 'd'].map(opt => {
                        const val = state.questions[state.currentQuestionIndex].options?.[opt as keyof typeof state.questions[0]['options']];
                        if (!val) return null;
                        return (
                          <div key={opt} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                            <span className="font-bold text-brand-accent uppercase mr-2">{opt}.</span> {val}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No questions loaded. Please upload an Excel file.
                  </div>
                )}
              </div>
            </div>
            
            {/* Image Previews */}
            {state.questions.some(q => q.localImage) && (
              <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-300">Image Previews</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {state.questions.filter(q => q.localImage).map(q => (
                    <div key={q.sNo} className="bg-gray-900 rounded border border-gray-800 p-2 text-center">
                      <div className="h-24 flex items-center justify-center bg-black rounded mb-2 overflow-hidden">
                        <img src={q.localImage} alt={`Q${q.sNo}`} className="max-h-full object-contain" />
                      </div>
                      <div className="text-xs font-mono text-gray-400">Q{q.sNo}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
