#!/bin/bash
cat << 'REPLACE_EOF' > scratch/layout.tsx
function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  
  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { name: 'Paper Trading', path: '/paper-trading', icon: <Activity className="w-5 h-5 shrink-0" /> },
    { name: 'Forex', path: '/forex', icon: <Globe className="w-5 h-5 shrink-0" /> },
    { name: 'News & Calendar', path: '/news', icon: <Newspaper className="w-5 h-5 shrink-0" /> },
    { name: 'Trade Journal', path: '/journal', icon: <BookOpen className="w-5 h-5 shrink-0" /> }
  ];

  return (
    <div className="flex h-screen bg-dash-bg text-dash-text-primary font-sans transition-colors duration-200 overflow-hidden">
      
      {/* Sidebar */}
      {user && (
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-dash-header border-r border-dash-border flex flex-col transition-all duration-300 z-10 shrink-0`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-dash-border shrink-0">
            {isSidebarOpen ? (
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-dash-text-primary hover:text-blue-400 transition-colors whitespace-nowrap overflow-hidden">
                <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
                FinSight
              </Link>
            ) : (
              <Link to="/" className="flex items-center justify-center w-full">
                <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
              </Link>
            )}
          </div>

          <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
            {navLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-dash-text-secondary hover:text-dash-text-primary hover:bg-dash-elevated transition-colors ${isSidebarOpen ? '' : 'justify-center'}`}
                title={!isSidebarOpen ? link.name : undefined}
              >
                {link.icon}
                {isSidebarOpen && <span className="font-medium text-[14px] whitespace-nowrap">{link.name}</span>}
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-dash-border flex flex-col gap-4 shrink-0">
            {isSidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  {user.picture ? (
                    <img src={user.picture} alt="Avatar" className="w-8 h-8 rounded-full border border-dash-border shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-dash-elevated flex items-center justify-center text-dash-text-secondary shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-medium text-[14px] text-dash-text-primary truncate">{user.name}</span>
                </div>
                <button 
                  onClick={() => dispatch(logout())}
                  className="text-dash-text-secondary hover:text-red-400 transition-colors p-1 shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {user.picture ? (
                  <img src={user.picture} alt="Avatar" className="w-8 h-8 rounded-full border border-dash-border shrink-0" title={user.name} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-dash-elevated flex items-center justify-center text-dash-text-secondary shrink-0" title={user.name}>
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <button 
                  onClick={() => dispatch(logout())}
                  className="text-dash-text-secondary hover:text-red-400 transition-colors p-1 shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-dash-header border-b border-dash-border h-16 shrink-0 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {user && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 -ml-2 rounded-lg text-dash-text-secondary hover:text-dash-text-primary hover:bg-dash-elevated transition-colors"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {!user && (
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-dash-text-primary hover:text-blue-400 transition-colors">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
                FinSight
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-5">
            <MarketStatus />
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full text-dash-text-secondary hover:text-dash-text-primary hover:bg-dash-elevated transition-all"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
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

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
REPLACE_EOF
