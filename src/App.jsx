import React, { useState, useEffect } from 'react';
import { Home, PlusCircle, List } from 'lucide-react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Configure native status bar on mobile
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#0f172a' }).catch(() => {});
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

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">Expense Tracker</h1>
      </header>

      <main className="animate-slide-up">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'add' && <TransactionForm onSuccess={() => setActiveTab('dashboard')} />}
        {activeTab === 'list' && <TransactionList />}
      </main>

      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
          aria-label="Home Dashboard"
        >
          <Home size={24} />
          <span>Home</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => handleTabChange('add')}
          aria-label="Add Transaction"
        >
          <PlusCircle size={24} />
          <span>Add</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => handleTabChange('list')}
          aria-label="Transaction History"
        >
          <List size={24} />
          <span>History</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
