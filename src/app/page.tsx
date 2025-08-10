'use client';

import { useState, useEffect, useCallback } from 'react';
import LanguageSelector from '@/components/LanguageSelector';
import DateLaneComponent, { type DateLane } from '@/components/DateLane';
import CreateSessionForm from '@/components/CreateSessionForm';
import { GameSession, Signup } from '@/generated/prisma';
import { Locale, t, getInitialLocale, formatDateForLane } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import LoginModal from '@/components/LoginModal';
import EventSelector from '@/components/EventSelector';

// Extended type to include signups
type GameSessionWithSignups = GameSession & {
  signups: Signup[];
};

interface Event {
  id: string;
  name: string;
  finished: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sessions: number;
  };
}

// Prevent hydration errors by ensuring consistent rendering
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

// Helper function to group sessions by date
const groupSessionsByDate = (sessions: GameSessionWithSignups[], locale: Locale): DateLane[] => {
  const lanes: { [key: string]: DateLane } = {};
  
  // Add sessions to lanes
  if (!Array.isArray(sessions)) {
    console.warn('groupSessionsByDate: sessions is not an array:', sessions);
    return [];
  }
  
  // Create special lane for sessions without date (first)
  const unscheduledLane: DateLane = {
    date: 'unscheduled',
    dateLabel: locale === 'cs' ? 'Bez data' : 'Unscheduled',
    sessions: []
  };
  
  sessions.forEach(session => {
    if (!session.scheduledAt) {
      unscheduledLane.sessions.push(session);
      return;
    }
    
    const sessionDate = new Date(session.scheduledAt);
    const dateKey = sessionDate.toDateString();
    
    if (!lanes[dateKey]) {
      const dateLabel = formatDateForLane(sessionDate, locale);
      
      lanes[dateKey] = {
        date: dateKey,
        dateLabel,
        sessions: []
      };
    }
    
    lanes[dateKey].sessions.push(session);
  });
  
  // Add empty lanes for next 7 days if no sessions exist
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const dateKey = futureDate.toDateString();
    
    if (!lanes[dateKey]) {
      const dateLabel = formatDateForLane(futureDate, locale);
      
      lanes[dateKey] = {
        date: dateKey,
        dateLabel,
        sessions: []
      };
    }
  }
  
  // Sort lanes by date and sessions within each lane by time
  const sortedLanes = Object.values(lanes)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(lane => ({
      ...lane,
      sessions: lane.sessions.sort((a, b) => 
        new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()
      )
    }));
  
  // Add unscheduled lane at the beginning if it has sessions
  if (unscheduledLane.sessions.length > 0) {
    return [unscheduledLane, ...sortedLanes];
  }
  
  return sortedLanes;
};

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const isClient = useIsClient();
  const [locale, setLocale] = useState<Locale>('en');
  // Helper functions for event persistence
  const getStoredEvent = (): Event | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('boardgame-selected-event');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const storeEvent = (event: Event | null) => {
    if (typeof window === 'undefined') return;
    if (event) {
      localStorage.setItem('boardgame-selected-event', JSON.stringify(event));
    } else {
      localStorage.removeItem('boardgame-selected-event');
    }
  };

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Load selected event from localStorage on client mount
  useEffect(() => {
    if (isClient) {
      const storedEvent = getStoredEvent();
      if (storedEvent) {
        setSelectedEvent(storedEvent);
      }
    }
  }, [isClient]);
  const [activeSessions, setActiveSessions] = useState<GameSessionWithSignups[]>([]);
  const [retiredSessions, setRetiredSessions] = useState<GameSessionWithSignups[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'retired'>('active');
  const [pendingAction, setPendingAction] = useState<'create' | null>(null);

  useEffect(() => {
    if (isClient) {
      setLocale(getInitialLocale());
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && locale) {
      fetchSessions();
    }
  }, [isClient, locale, selectedEvent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserDropdown && !target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const fetchSessions = useCallback(async () => {
    try {
      // If we have a selected event, validate it still exists
      if (selectedEvent) {
        const eventsResponse = await fetch('/api/events?includeFinished=true');
        if (eventsResponse.ok) {
          const allEvents = await eventsResponse.json();
          const eventExists = allEvents.some((event: Event) => event.id === selectedEvent.id);
          
          if (!eventExists) {
            console.log('Stored event no longer exists, clearing selection');
            setSelectedEvent(null);
            storeEvent(null);
            setLoading(false);
            return;
          }
        }
      }
      
      const activeUrl = selectedEvent ? `/api/sessions?eventId=${selectedEvent.id}` : '/api/sessions';
      const retiredUrl = selectedEvent ? `/api/sessions/retired?eventId=${selectedEvent.id}` : '/api/sessions/retired';
      
      console.log('Fetching sessions:', { selectedEvent: selectedEvent?.name, activeUrl, retiredUrl });
      
      const [activeResponse, retiredResponse] = await Promise.all([
        fetch(activeUrl),
        fetch(retiredUrl)
      ]);
      
      const activeData = await activeResponse.json();
      const retiredData = await retiredResponse.json();
      
      // Ensure we always set arrays, even if the API returns unexpected data
      console.log('Active sessions data:', activeData);
      console.log('Retired sessions data:', retiredData);
      console.log('Setting sessions:', { active: Array.isArray(activeData) ? activeData.length : 0, retired: Array.isArray(retiredData) ? retiredData.length : 0 });
      setActiveSessions(Array.isArray(activeData) ? activeData : []);
      setRetiredSessions(Array.isArray(retiredData) ? retiredData : []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      // Set empty arrays on error to prevent forEach errors
      setActiveSessions([]);
      setRetiredSessions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent]);

  // Group sessions by date
  const activeLanes = groupSessionsByDate(activeSessions, locale);
  const retiredLanes = groupSessionsByDate(retiredSessions, locale).filter(lane => lane.sessions.length > 0);

  // Show event selector if no event is selected
  const [showEventSelector, setShowEventSelector] = useState(false);
  
  if (showEventSelector || !selectedEvent) {
    return <EventSelector onEventSelect={(event) => {
      setSelectedEvent(event);
      storeEvent(event);
      setShowEventSelector(false);
    }} locale={locale} onLocaleChange={handleLocaleChange} />;
  }

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-700">{t(locale, 'loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Boardgame-themed background pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-blue-300 rounded-lg transform rotate-12"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border-4 border-indigo-300 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 border-4 border-purple-300 transform rotate-45"></div>
        <div className="absolute top-1/3 left-1/3 w-16 h-16 border-4 border-blue-300 rounded-lg"></div>
        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 border-4 border-indigo-300 rounded-full"></div>
        <div className="absolute top-2/3 right-1/3 w-12 h-12 border-4 border-purple-300 transform rotate-12"></div>
        <div className="absolute top-1/2 left-1/2 w-8 h-8 border-4 border-blue-300 rounded-lg transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-3/4 left-1/6 w-20 h-20 border-4 border-indigo-300 rounded-full"></div>
        <div className="absolute top-1/4 right-1/3 w-14 h-14 border-4 border-purple-300 transform rotate-30"></div>
        <div className="absolute bottom-1/3 right-1/6 w-18 h-18 border-4 border-blue-300 rounded-lg"></div>
      </div>
      
      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <header className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {t(locale, 'title')}
              </h1>
              <p className="text-gray-600">
                {t(locale, 'subtitle')}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-sm text-gray-500">{t(locale, 'currentEvent')}:</span>
                <span className="text-lg font-semibold text-blue-600">{selectedEvent?.name || t(locale, 'allSessions')}</span>
                <button
                  onClick={() => setShowEventSelector(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-lg transition-colors text-sm"
                >
                  {t(locale, 'changeEvent')}
                </button>
              </div>
            </div>
                          <div className="flex items-center gap-4">
                {/* User Display */}
                {isAuthenticated ? (
                <div className="relative user-dropdown">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    <span>{user?.name}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Logout clicked');
                          logout();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t(locale, 'logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {t(locale, 'login')}
                </button>
              )}
              <LanguageSelector currentLocale={locale} onLocaleChange={handleLocaleChange} />
            </div>
          </div>
        </header>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {t(locale, 'gameSessions')}
          </h2>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setPendingAction('create');
                setShowLoginModal(true);
              } else {
                setShowCreateForm(true);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {t(locale, 'createNewSession')}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t(locale, 'activeSessions')} ({activeSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('retired')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'retired'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t(locale, 'retiredSessions')} ({retiredSessions.length})
          </button>
        </div>

        {isClient && activeSessions.length === 0 && retiredSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {selectedEvent 
                ? `${t(locale, 'noSessionsFoundForEvent')} "${selectedEvent.name}"`
                : t(locale, 'noSessionsScheduled')
              }
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setPendingAction('create');
                  setShowLoginModal(true);
                } else {
                  setShowCreateForm(true);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t(locale, 'createFirstSession')}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === 'active' && activeLanes.map((lane) => (
              <DateLaneComponent key={lane.date} lane={lane} onUpdate={fetchSessions} locale={locale} />
            ))}
            {activeTab === 'retired' && retiredLanes.map((lane) => (
              <DateLaneComponent key={lane.date} lane={lane} onUpdate={fetchSessions} locale={locale} />
            ))}
          </div>
        )}

        {showCreateForm && (
          <CreateSessionForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchSessions();
            }}
            locale={locale}
            eventId={selectedEvent?.id}
          />
        )}

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            // Handle pending action after successful login
            if (pendingAction === 'create') {
              setShowCreateForm(true);
              setPendingAction(null);
            }
          }}
          locale={locale}
          title={t(locale, 'login')}
        />
      </div>
    </div>
  );
}