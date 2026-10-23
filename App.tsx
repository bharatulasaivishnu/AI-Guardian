import { useState, useEffect } from 'react';
import { Sidebar, MobileNav, ModuleHeader } from '@/components/Layout';
import type { Route } from '@/components/Layout';
import { Home } from '@/components/Home';
import { CyberGuardian } from '@/components/CyberGuardian';
import { PersonalSafety } from '@/components/PersonalSafety';
import { StudentSafety } from '@/components/StudentSafety';
import { FamilyGuardian } from '@/components/FamilyGuardian';
import { SettingsPage, AboutPage } from '@/components/SettingsAbout';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AuthGate } from '@/components/AuthGate';
import { DataProvider } from '@/lib/dataContext';
import { migrateLocalStorage } from '@/lib/useUserData';

function AppContent() {
  const { user } = useAuth();
  const [route, setRoute] = useState<Route>(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const valid: Route[] = ['home', 'cyber', 'personal', 'student', 'family', 'settings', 'about'];
    return (valid.includes(hash as Route) ? hash : 'home') as Route;
  });

  useEffect(() => {
    window.location.hash = `/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  // Migrate localStorage data once per user on first sign-in.
  useEffect(() => {
    if (!user) return;
    migrateLocalStorage(user.id).catch(() => {
      // migration is best-effort; failures don't block the app
    });
  }, [user]);

  function navigate(r: Route) {
    setRoute(r);
  }

  return (
    <div className="flex min-h-screen bg-navy-gradient">
      <Sidebar route={route} navigate={navigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav route={route} navigate={navigate} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mb-5 md:hidden">
            <ModuleHeader route={route} navigate={navigate} />
          </div>
          <div className="animate-fade-in-up">
            {route === 'home' && <Home navigate={navigate} />}
            {route === 'cyber' && <CyberGuardian />}
            {route === 'personal' && <PersonalSafety />}
            {route === 'student' && <StudentSafety />}
            {route === 'family' && <FamilyGuardian />}
            {route === 'settings' && <SettingsPage />}
            {route === 'about' && <AboutPage />}
          </div>
        </main>
        <footer className="border-t border-white/10 px-4 py-4 text-center text-[11px] text-slate-600 sm:px-6 lg:px-10">
          AI Guardian · Risk assessments can be incorrect · Not a substitute for
          emergency services
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthGate>
    </AuthProvider>
  );
}

export default App;
