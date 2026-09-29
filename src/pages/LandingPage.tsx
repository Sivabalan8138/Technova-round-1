import { useNavigate } from 'react-router-dom';
import { Settings, MonitorPlay, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center text-center px-4">
        {/* Icon */}
        <div className="mb-6 text-[#00f0ff]">
          <Zap size={48} strokeWidth={2.5} />
        </div>

        {/* College & Dept Info */}
        <div className="space-y-3 mb-10 tracking-widest text-sm md:text-base font-semibold text-gray-300">
          <p>V.S.B. ENGINEERING COLLEGE, KARUR</p>
          <p className="text-[#00f0ff]">DEPARTMENT OF ELECTRICAL AND ELECTRONICS ENGINEERING</p>
          <p className="text-gray-400">ELECTRICAL CLUB</p>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-black mb-16 tracking-wide leading-tight">
          TECHNOVA <br />
          <span className="text-4xl md:text-6xl text-gray-100">ROUND 1 — SPARK START</span>
        </h1>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg mx-auto">
          <button 
            onClick={() => navigate('/admin')}
            className="flex-1 py-4 px-6 rounded-lg border border-gray-600 bg-transparent hover:bg-gray-800 transition-all flex items-center justify-center font-bold text-gray-200 uppercase tracking-wider"
          >
            <Settings className="mr-3" size={20} /> ADMIN PANEL
          </button>
          
          <button 
            onClick={() => navigate('/display')}
            className="flex-1 py-4 px-6 rounded-lg bg-[#0088ff] hover:bg-[#0077ee] transition-all flex items-center justify-center font-bold text-white uppercase tracking-wider shadow-[0_0_20px_rgba(0,136,255,0.4)]"
          >
            <MonitorPlay className="mr-3" size={20} /> DISPLAY MODE
          </button>
        </div>
      </div>
    </div>
  );
}
