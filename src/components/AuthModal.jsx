import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  User, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const triggerHaptic = async (type = 'light') => {
    if (Capacitor.isNativePlatform()) {
      if (type === 'error') await Haptics.notification({ type: NotificationType.Error }).catch(() => {});
      else if (type === 'success') await Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      else await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all required fields.');
      triggerHaptic('error');
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Please enter your full name.');
      triggerHaptic('error');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      triggerHaptic('error');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      triggerHaptic('success');
      if (onClose) onClose();
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@vaultflow.app');
    setPassword('password123');
    setError('');
    setLoading(true);
    triggerHaptic('light');

    try {
      await login('demo@vaultflow.app', 'password123');
      triggerHaptic('success');
      if (onClose) onClose();
    } catch (err) {
      console.error('Demo login error:', err);
      setError('Could not connect to PostgreSQL backend. Ensure server is running.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 w-full max-w-md mx-auto animate-fade-in my-4">
      {/* Brand & Security Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div 
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)'
            }}
          >
            <ShieldCheck size={28} />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-1">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-xs text-muted">
          {isLogin 
            ? 'Sign in to access your PostgreSQL synced expenses' 
            : 'Get started with encrypted JWT authenticated tracking'}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="segmented-control mb-5">
        <button
          type="button"
          className={`segmented-btn ${isLogin ? 'active-income' : ''}`}
          onClick={() => {
            setIsLogin(true);
            setError('');
            triggerHaptic('light');
          }}
        >
          <LogIn size={16} />
          Sign In
        </button>
        <button
          type="button"
          className={`segmented-btn ${!isLogin ? 'active-income' : ''}`}
          onClick={() => {
            setIsLogin(false);
            setError('');
            triggerHaptic('light');
          }}
        >
          <UserPlus size={16} />
          Register
        </button>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div 
          className="p-3 mb-4 rounded-xl text-xs font-semibold text-expense text-center flex items-center justify-center gap-2"
          style={{ background: 'var(--accent-expense-bg)', border: '1px solid var(--accent-expense-border)' }}
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Auth Form */}
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User 
                size={18} 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail 
              size={18} 
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input
              type="email"
              className="form-input"
              style={{ paddingLeft: '44px' }}
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock 
              size={18} 
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input
              type="password"
              className="form-input"
              style={{ paddingLeft: '44px' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn w-full mt-2"
          style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
              <span>{isLogin ? 'Sign In' : 'Create Free Account'}</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Access Button */}
      <div className="mt-5 pt-4 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <p className="text-xs text-muted mb-2">Want to try without creating an account?</p>
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="btn btn-outline w-full"
          style={{ padding: '10px 16px', fontSize: '0.85rem' }}
        >
          <Sparkles size={16} style={{ color: '#f59e0b' }} />
          <span>One-Click Demo Login</span>
        </button>
      </div>
    </div>
  );
}
