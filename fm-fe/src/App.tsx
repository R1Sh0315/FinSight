import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import HomePage from './pages/HomePage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import LoginPage from './pages/LoginPage';
import JournalPage from './pages/JournalPage';
import NewsPage from './pages/NewsPage';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store/store';
import type { RootState } from './store/store';
import { logout } from './store/authSlice';
import { LogOut, User as UserIcon, Moon, Sun } from 'lucide-react';
import React from 'react';
import { TickerTape } from "react-ts-tradingview-widgets";

// A wrapper to protect routes
function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = useSelector((state: RootState) => state.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

// The main layout with Nav and Dark mode toggle
function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  
  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-dash-bg text-dash-text-primary font-sans transition-colors duration-200">
      <header className="bg-dash-header border-b border-dash-border h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-dash-text-primary hover:text-blue-400 transition-colors">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              FinAI
            </Link>

            {user && (
              <div className="hidden sm:flex items-center gap-1 ml-4 border-l border-dash-border pl-6">
                <Link to="/" className="px-3 py-1.5 text-[14px] font-medium text-dash-text-secondary hover:text-dash-text-primary hover:bg-dash-elevated rounded-md transition-colors">Dashboard</Link>
                <Link to="/news" className="px-3 py-1.5 text-[14px] font-medium text-dash-text-secondary hover:text-dash-text-primary hover:bg-dash-elevated rounded-md transition-colors">News & Calendar</Link>
                <Link to="/journal" className="px-3 py-1.5 text-[14px] font-medium text-dash-text-secondary hover:text-dash-text-primary hover:bg-dash-elevated rounded-md transition-colors">Trade Journal</Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full text-dash-text-secondary hover:text-dash-text-primary hover:bg-dash-elevated transition-all"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            {user && (
              <div className="flex items-center gap-4 pl-4 border-l border-dash-border">
                <div className="flex items-center gap-2">
                  {user.picture ? (
                    <img src={user.picture} alt="Avatar" className="w-7 h-7 rounded-full border border-dash-border" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-dash-elevated flex items-center justify-center text-dash-text-secondary">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-medium text-[14px] text-dash-text-primary">{user.name}</span>
                </div>
                
                <button 
                  onClick={() => dispatch(logout())}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-dash-text-secondary hover:text-red-400 transition-colors ml-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <TickerTape 
        colorTheme={darkMode ? "dark" : "light"} 
        displayMode="adaptive"
        symbols={[
          { proName: "BSE:RELIANCE", title: "Reliance" },
          { proName: "BSE:TCS", title: "TCS" },
          { proName: "BSE:HDFCBANK", title: "HDFC" },
          { proName: "BSE:INFY", title: "Infosys" },
          { proName: "BSE:ICICIBANK", title: "ICICI" }
        ]} 
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-mockclientid.apps.googleusercontent.com';

  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="/journal" element={<PrivateRoute><JournalPage /></PrivateRoute>} />
              <Route path="/news" element={<PrivateRoute><NewsPage /></PrivateRoute>} />
              <Route path="/company/:symbol" element={<PrivateRoute><CompanyDetailsPage /></PrivateRoute>} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </Provider>
  );
}

export default App;
