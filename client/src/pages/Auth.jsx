import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShieldCheck, Zap, Lock, Activity } from 'lucide-react';
import API from '../api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Pick the right endpoint based on if they are logging in or registering
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await API.post(endpoint, formData);

      // Save token and user data to browser storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Teleport the user to the dashboard!
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 flex-col justify-between p-12 overflow-hidden">
        {/* decorative glow */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Heart className="h-4.5 w-4.5 text-white" fill="white" />
          </div>
          <span className="text-white font-bold text-[15px]">AI Medical Triage</span>
        </div>

        <div className="relative">
          <h1 className="text-white text-[34px] font-bold leading-[1.15] tracking-tight mb-4">
            Understand your symptoms in seconds, not hours.
          </h1>
          <p className="text-indigo-100 text-[15px] leading-relaxed max-w-sm">
            Describe how you're feeling and get instant, evidence-informed guidance on what to
            do next — clearly explained, always private.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Zap, text: 'AI-guided follow-up questions, not a static form' },
              { icon: ShieldCheck, text: 'Grounded in public health guidelines' },
              { icon: Lock, text: 'Your data is encrypted and never sold' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-indigo-50 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-indigo-200 text-xs">
          Not a substitute for professional medical advice or emergency care.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 bg-[#F7F8FC]">
        <div className="w-full max-w-sm mx-auto">
          {/* mobile-only logo since brand panel is hidden below lg */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Activity className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-[15px] text-slate-900">AI Medical Triage</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 mb-8">
            {isLogin ? 'Sign in to continue to your dashboard.' : 'Start getting instant symptom guidance.'}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required={!isLogin}
                  className="block w-full border border-slate-200 rounded-xl shadow-sm py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                className="block w-full border border-slate-200 rounded-xl shadow-sm py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                {isLogin && (
                  <span className="text-xs font-semibold text-indigo-600 cursor-pointer hover:text-indigo-700">
                    Forgot password?
                  </span>
                )}
              </div>
              <input
                type="password"
                required
                className="block w-full border border-slate-200 rounded-xl shadow-sm py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm font-medium text-center bg-red-50 border border-red-100 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
