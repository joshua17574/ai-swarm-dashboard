import React, { useState } from 'react';
import api from '../services/api';

export default function AuthScreen({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (isRegister) {
        data = await api.register(username, email, password);
      } else {
        data = await api.login(username, password);
      }
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center grid-bg hex-pattern relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--neon-blue), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--neon-purple), transparent)', filter: 'blur(100px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, var(--neon-cyan), transparent)', filter: 'blur(120px)' }} />
      </div>

      <div className="w-full max-w-md mx-4 animate-fade-in-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 animate-pulse-glow"
            style={{ background: 'rgba(0, 240, 255, 0.1)', border: '2px solid rgba(0, 240, 255, 0.3)' }}>
            <svg className="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-wider neon-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            SWARM CONTROL
          </h1>
          <p className="text-gray-400 mt-2 text-sm tracking-widest uppercase">
            AI Agent Command Center
          </p>
        </div>

        {/* Form */}
        <div className="glass-panel rounded-2xl p-8">
          <div className="flex mb-6 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0, 240, 255, 0.2)' }}>
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2.5 text-sm font-semibold tracking-wider transition-all ${!isRegister ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-gray-300'}`}
            >
              LOGIN
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2.5 text-sm font-semibold tracking-wider transition-all ${isRegister ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-gray-300'}`}
            >
              REGISTER
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-neon"
                placeholder="Enter username"
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-neon"
                  placeholder="Enter email"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-neon"
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm tracking-wider transition-all duration-300 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                color: '#00f0ff',
              }}
              onMouseOver={e => e.target.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(168, 85, 247, 0.2)'}
              onMouseOut={e => e.target.style.boxShadow = 'none'}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  {isRegister ? 'INITIALIZING...' : 'AUTHENTICATING...'}
                </span>
              ) : (
                isRegister ? 'INITIALIZE ACCOUNT' : 'ACCESS DASHBOARD'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 tracking-wider">
          SECURE QUANTUM-ENCRYPTED AUTHENTICATION
        </p>
      </div>
    </div>
  );
}
