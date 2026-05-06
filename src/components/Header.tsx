import { Brain as Train, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type Page = 'search' | 'results' | 'tickets';

type Props = {
  user: SupabaseUser | null;
  activePage: Page;
  onNavigate: (page: Page) => void;
  onAuthClick: () => void;
  onSignOut: () => void;
};

export default function Header({ user, activePage, onNavigate, onAuthClick, onSignOut }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('search')}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
              <Train className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Rail<span className="text-blue-600">Track</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePage === 'search'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Search Trains
            </button>
            {user && (
              <button
                onClick={() => onNavigate('tickets')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'tickets'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                My Tickets
              </button>
            )}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium max-w-[160px] truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2">
          <button
            onClick={() => { onNavigate('search'); setMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Search Trains
          </button>
          {user && (
            <button
              onClick={() => { onNavigate('tickets'); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              My Tickets
            </button>
          )}
          <div className="pt-2 border-t border-gray-100">
            {user ? (
              <button
                onClick={() => { onSignOut(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => { onAuthClick(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
