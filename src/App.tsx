import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { TrainWithSchedule } from './lib/supabase';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import MyTicketsPage from './pages/MyTicketsPage';

type Page = 'search' | 'results' | 'tickets';

type SearchState = {
  source: string;
  destination: string;
  trains: TrainWithSchedule[];
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('search');
  const [authOpen, setAuthOpen] = useState(false);
  const [searchState, setSearchState] = useState<SearchState | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  function handleSearch(source: string, destination: string, trains: TrainWithSchedule[]) {
    setSearchState({ source, destination, trains });
    setPage('results');
  }

  async function handleRefresh() {
    if (!searchState) return;
    const { data } = await supabase
      .from('trains')
      .select('*, schedules(*)')
      .eq('source', searchState.source)
      .eq('destination', searchState.destination);
    if (data) {
      setSearchState(prev => prev ? { ...prev, trains: data as TrainWithSchedule[] } : prev);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setPage('search');
  }

  function handleNavigate(p: Page) {
    if (p === 'tickets' && !user) {
      setAuthOpen(true);
      return;
    }
    setPage(p);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header
        user={user}
        activePage={page}
        onNavigate={handleNavigate}
        onAuthClick={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {page === 'search' && (
        <SearchPage
          onSearch={handleSearch}
          onAuthRequired={() => setAuthOpen(true)}
          isAuthenticated={!!user}
        />
      )}

      {page === 'results' && searchState && (
        <ResultsPage
          source={searchState.source}
          destination={searchState.destination}
          trains={searchState.trains}
          user={user}
          onBack={() => setPage('search')}
          onAuthRequired={() => setAuthOpen(true)}
          onRefresh={handleRefresh}
        />
      )}

      {page === 'tickets' && user && (
        <MyTicketsPage user={user} />
      )}

      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} />
      )}
    </div>
  );
}
