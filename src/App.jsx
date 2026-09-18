import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ReceiptText, 
  WalletCards,
  Wifi,
  WifiOff,
  LogOut,
  User,
  Database,
  Loader2
} from 'lucide-react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import api from './services/api';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import AuthModal from './components/AuthModal';

function App() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverOnline, setServerOnline] = useState(true);

  // Check health periodically
  useEffect(() => {
    const checkServer = async () => {
      try {
        await api.checkHealth();
        setServerOnline(true);
      } catch {
        setServerOnline(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Configure native status bar on mobile
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#090d16' }).catch(() => {});
    }

    // Handle hardware back button on Android
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      setActiveTab((currentTab) => {
        if (currentTab !== 'dashboard') {
          return 'dashboard';
        }
        if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
        return currentTab;
      });
    });

    return () => {
      backListener.then(l => l.remove()).catch(() => {});
    };
  }, []);

  const handleTabChange = async (tab) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    }
    logout();
  };

  if (authLoading) {
    return (
      <div className="app-container flex flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
        <Loader2 size={36} className="animate-spin text-muted mb-3" />
        <p className="text-secondary font-semibold">Validating session...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* App Header with Brand, Database/Auth Status & User Controls */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <WalletCards size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="app-title">VaultFlow</h1>
              <span 
                className="glass-pill px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1.5"
                style={{ 
                  color: serverOnline ? '#10b981' : '#f43f5e',
                  borderColor: serverOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
                  fontSize: '0.7rem'
                }}
                title={serverOnline ? 'Connected to PostgreSQL REST API' : 'Cannot reach backend REST API'}
              >
                <Database size={11} />
                <span>Prisma • Supabase</span>
              </span>
            </div>
            <p className="app-subtitle">Cloud-Synced Financial Manager</p>
          </div>
        </div>

        {/* User Info & Navigation */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user && (
            <div className="flex items-center gap-2">
              <div 
                className="glass-pill px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-secondary"
                style={{ background: 'rgba(255, 255, 255, 0.04)' }}
              >
                <div 
                  style={{ 
                    width: '22px', 
                    height: '22px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline">{user.name || user.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-outline btn-icon"
                title="Sign Out"
                aria-label="Sign Out"
                style={{ width: '34px', height: '34px' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="desktop-nav" aria-label="Desktop Navigation">
              <button 
                className={`desktop-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleTabChange('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              <button 
                className={`desktop-nav-item ${activeTab === 'add' ? 'active' : ''}`}
                onClick={() => handleTabChange('add')}
              >
                <PlusCircle size={18} />
                <span>New Entry</span>
              </button>
              <button 
                className={`desktop-nav-item ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => handleTabChange('list')}
              >
                <ReceiptText size={18} />
                <span>History</span>
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {!isAuthenticated ? (
        <AuthModal />
      ) : (
        <>
          <main className="animate-fade-in" key={activeTab}>
            {activeTab === 'dashboard' && (
              <Dashboard onNavigateToAdd={() => handleTabChange('add')} />
            )}
            {activeTab === 'add' && (
              <TransactionForm onSuccess={() => handleTabChange('dashboard')} />
            )}
            {activeTab === 'list' && (
              <TransactionList onNavigateToAdd={() => handleTabChange('add')} />
            )}
          </main>

          {/* Mobile Floating Bottom Navigation */}
          <nav className="bottom-nav" aria-label="Mobile Navigation">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleTabChange('dashboard')}
              aria-label="Dashboard"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => handleTabChange('add')}
              aria-label="Add Transaction"
            >
              <PlusCircle size={20} />
              <span>Add</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => handleTabChange('list')}
              aria-label="Transaction History"
            >
              <ReceiptText size={20} />
              <span>History</span>
            </button>
          </nav>
        </>
      )}
    </div>
  );
}

export default App;
