import { LogOut, Activity, AlertCircle, Clock, Loader2, Heart, Plus, Send, ShieldCheck, Lock, ClipboardList, Home, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import ClinicMap from '../components/ClinicMap.jsx';


export default function Dashboard() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeCheckId, setActiveCheckId] = useState(null);
  const navigate = useNavigate();

  // Safely get user data from local storage
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // Fetch history as soon as the dashboard loads
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await API.get('/triage/history');
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);

    try {
      const { data } = await API.post('/triage/analyze', {
        symptoms,
        checkId: activeCheckId
      });
      setResult(data);
      setActiveCheckId(data._id); //save the ID so the next message updates this same check!
      setSymptoms(''); // Clear input after successful analysis
      fetchHistory(); // Refresh the history sidebar
    } catch (err) {
      alert(err.response?.data?.message || 'Error analyzing symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    setActiveCheckId(null);
    setResult(null);
    setSymptoms('');
  };

  // Helper function to color-code the urgency levels dynamically
  const getUrgencyColor = (level) => {
    const colors = {
      low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      emergency: 'bg-red-50 text-red-700 border-red-300 font-bold animate-pulse',
    };
    return colors[level?.toLowerCase()] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getUrgencyDot = (level) => {
    const colors = {
      low: 'bg-emerald-500',
      medium: 'bg-amber-500',
      high: 'bg-orange-500',
      emergency: 'bg-red-500',
    };
    return colors[level?.toLowerCase()] || 'bg-slate-400';
  };

  // Derived, real stats from the history we already fetched — no fake numbers
  const totalChecks = history.length;
  const lowRiskCount = history.filter((h) => h.urgencyLevel?.toLowerCase() === 'low').length;
  const lowRiskPct = totalChecks > 0 ? Math.round((lowRiskCount / totalChecks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F7F8FC] font-sans text-slate-900">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Heart className="h-4.5 w-4.5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 leading-tight">AI Medical Triage</h1>
              <p className="text-[11px] text-slate-500 leading-tight">Your health, our priority</p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold bg-indigo-50 text-indigo-600">
              <Home className="h-3.5 w-3.5" /> Dashboard
            </span>
          </nav>

          <div className="flex items-center gap-5">
            <span className="text-sm font-medium text-slate-600 hidden sm:inline">Hello, {user?.name || 'User'}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-semibold transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">

        {/* Left Column: Symptom Input & AI Results */}
        <div className="space-y-5">

          {/* Input Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-[15px] font-bold mb-4 text-slate-900">How are you feeling today?</h2>
            <form onSubmit={handleSubmit}>
              <textarea
                rows="4"
                className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none text-slate-700"
                placeholder={activeCheckId ? "Answer the AI's follow-up questions here..." : "Describe your symptoms in detail..."}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={loading || !symptoms.trim()}
                  className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      AI is thinking...
                    </>
                  ) : (
                    activeCheckId ? 'Send Reply' : 'Analyze Symptoms'
                  )}
                </button>

                {activeCheckId && (
                  <button
                    type="button"
                    onClick={handleStartNew}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <Plus className="h-4 w-4" /> Start New
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* AI Result Card (Only shows after analysis) */}
          {result && (
            <div className={`p-6 rounded-xl shadow-sm border ${getUrgencyColor(result.urgencyLevel)} animate-fade-in`}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-9 w-9 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-[15px] font-bold uppercase tracking-wide">
                  Urgency: {result.urgencyLevel}
                </h2>
              </div>

              <div className="space-y-5">
                <div className="bg-white/70 p-4 rounded-xl">
                  <h3 className="font-bold mb-1.5 text-slate-900 text-[13px] uppercase tracking-wide">Recommended Action</h3>
                  <p className="text-slate-800 text-sm leading-relaxed">{result.recommendedAction}</p>
                </div>

                {result.possibleConditions?.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2 text-slate-900 text-[13px] uppercase tracking-wide">Possible Conditions</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.possibleConditions.map((condition, idx) => (
                        <span key={idx} className="text-[12.5px] bg-white/70 border border-black/5 rounded-full px-3 py-1 text-slate-800">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.followUpQuestions?.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2 text-slate-900 text-[13px] uppercase tracking-wide">Questions to Consider</h3>
                    <ul className="space-y-1.5">
                      {result.followUpQuestions.map((q, idx) => (
                        <li key={idx} className="text-sm text-slate-800 flex gap-2">
                          <span className="text-slate-400">•</span> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* NEW: Render the Map if urgency is Medium or higher */}
          {result && ['medium', 'high', 'emergency'].includes(result.urgencyLevel?.toLowerCase()) && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 animate-fade-in">
              <ClinicMap />
            </div>
          )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: User History + Summary */}
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm max-h-[65vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-4 w-4 text-slate-400" />
              <h2 className="text-[14px] font-bold text-slate-900">Your Check History</h2>
            </div>

            {history.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No symptom history yet.
              </p>
            ) : (
              <div className="space-y-1">
                {history.map((item) => (
                  <div key={item._id} className="py-3 border-t border-slate-50 first:border-0 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${getUrgencyDot(item.urgencyLevel)}`} />
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-600 line-clamp-2 italic">"{item.symptoms}"</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider whitespace-nowrap border ${getUrgencyColor(item.urgencyLevel)}`}>
                      {item.urgencyLevel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalChecks > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-[14px] font-bold text-slate-900 mb-4">Health Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center mx-auto mb-1.5">
                    <ClipboardList className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <div className="text-base font-bold text-slate-900">{totalChecks}</div>
                  <div className="text-[10px] text-slate-500">Total Checks</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto mb-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="text-base font-bold text-slate-900">{lowRiskPct}%</div>
                  <div className="text-[10px] text-slate-500">Low Risk</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 text-center">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-2.5">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <div className="text-[13px] font-bold text-slate-900 mb-1">Your data is safe</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              We follow strict security standards to protect your health information.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}