'use client';

import { useState, useEffect } from 'react';
import GameAutocomplete from '@/components/GameAutocomplete';
import LanguageSelector from '@/components/LanguageSelector';
import Comments from '@/components/Comments';
import { GameSession, Signup } from '@/generated/prisma';
import { Locale, t, getInitialLocale, formatDate, formatDateForLane } from '@/lib/i18n';

// Extended type to include signups
type GameSessionWithSignups = GameSession & {
  signups: Signup[];
};

// Type for date lanes
type DateLane = {
  date: string;
  dateLabel: string;
  sessions: GameSessionWithSignups[];
};

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
  sessions.forEach(session => {
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
  return Object.values(lanes)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(lane => ({
      ...lane,
      sessions: lane.sessions.sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
    }));
};

export default function Home() {
  const isClient = useIsClient();
  const [locale, setLocale] = useState<Locale>('en');
  const [activeSessions, setActiveSessions] = useState<GameSessionWithSignups[]>([]);
  const [retiredSessions, setRetiredSessions] = useState<GameSessionWithSignups[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'retired'>('active');

  useEffect(() => {
    if (isClient) {
      setLocale(getInitialLocale());
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && locale) {
      fetchSessions();
    }
  }, [isClient, locale]);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const fetchSessions = async () => {
    try {
      const [activeResponse, retiredResponse] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/sessions/retired')
      ]);
      
      const activeData = await activeResponse.json();
      const retiredData = await retiredResponse.json();
      
      setActiveSessions(activeData);
      setRetiredSessions(retiredData);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group sessions by date
  const activeLanes = groupSessionsByDate(activeSessions, locale);
  const retiredLanes = groupSessionsByDate(retiredSessions, locale).filter(lane => lane.sessions.length > 0);

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
            </div>
            <LanguageSelector currentLocale={locale} onLocaleChange={handleLocaleChange} />
          </div>
        </header>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {t(locale, 'gameSessions')}
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
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
              {t(locale, 'noSessionsScheduled')}
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t(locale, 'createFirstSession')}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === 'active' && activeLanes.map((lane) => (
              <DateLane key={lane.date} lane={lane} onUpdate={fetchSessions} locale={locale} />
            ))}
            {activeTab === 'retired' && retiredLanes.map((lane) => (
              <DateLane key={lane.date} lane={lane} onUpdate={fetchSessions} locale={locale} />
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
          />
        )}
      </div>
    </div>
  );
}

function SessionCard({ session, onUpdate, locale }: { session: GameSessionWithSignups; onUpdate: () => void; locale: Locale }) {
  const isClient = useIsClient();
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) return;

    try {
      const response = await fetch(`/api/sessions/${session.id}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: signupName.trim() }),
      });

      if (response.ok) {
        setSignupName('');
        setShowSignupForm(false);
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || t(locale, 'failedToJoinSession'));
      }
    } catch (error) {
      console.error('Failed to sign up:', error);
      alert(t(locale, 'failedToJoinSession'));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || t(locale, 'failedToDeleteSession'));
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert(t(locale, 'failedToDeleteSession'));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRemoveSignup = async (signupId: string) => {
    try {
      const response = await fetch(`/api/sessions/${session.id}/signup/${signupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || t(locale, 'failedToRemovePlayer'));
      }
    } catch (error) {
      console.error('Failed to remove signup:', error);
      alert(t(locale, 'failedToRemovePlayer'));
    }
  };

  const formatSessionDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return formatDate(new Date(dateString), locale);
    } catch {
      return dateString;
    }
  };

  const sessionEndTime = new Date(new Date(session.scheduledAt).getTime() + session.maxTimeMinutes * 60 * 1000);
  const isRetired = sessionEndTime < new Date();
  const isFull = session.signups.length >= session.maxPlayers;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{t(locale, 'players')}: {session.signups.length}/{session.maxPlayers}</span>
          <span className={
            isRetired 
              ? 'text-gray-500 font-medium'
              : isFull
                ? 'text-red-600 font-medium'
                : 'text-green-600 font-medium'
          }>
            {isRetired ? t(locale, 'finished') : isFull ? t(locale, 'full') : t(locale, 'open')}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.boardGameName}</h3>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-medium whitespace-nowrap">{t(locale, 'complexity')}:</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < Math.floor(session.complexity || 0) 
                      ? 'bg-orange-500' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs">({(session.complexity || 0).toFixed(1)}/5)</span>
          </div>
          
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-medium whitespace-nowrap">{t(locale, 'time')}:</span>
            <span className="flex-shrink-0">
              {session.minTimeMinutes === session.maxTimeMinutes 
                ? `${session.minTimeMinutes} ${t(locale, 'minutes')}` 
                : `${session.minTimeMinutes}-${session.maxTimeMinutes} ${t(locale, 'minutes')}`}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          <span className="font-medium">{t(locale, 'scheduledFor')}:</span> {formatSessionDate(session.scheduledAt.toString())}
        </div>

        {session.description && (
          <div className="mb-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              {session.description.length > 200
                ? `${session.description.substring(0, 200)}...`
                : session.description}
            </p>
          </div>
        )}

        {session.signups.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">{t(locale, 'signedUp')}:</p>
            <div className="flex flex-wrap gap-1">
              {session.signups.map((signup) => (
                <div key={signup.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 group">
                  <span>{signup.displayName}</span>
                  <button
                    onClick={() => handleRemoveSignup(signup.id)}
                    className="text-blue-600 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1"
                    title={t(locale, 'removePlayer')}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!isRetired && !isFull && (
          <button
            onClick={() => setShowSignupForm(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
          >
            {t(locale, 'joinSession')}
          </button>
        )}
        {isRetired && (
          <div className="flex-1 bg-gray-100 text-gray-500 py-2 rounded-lg font-medium text-center">
            {t(locale, 'sessionFinished')}
          </div>
        )}
        {!isRetired && (
          <button
            onClick={() => setShowEditForm(true)}
            className="px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg font-medium transition-all duration-200"
            title={t(locale, 'editSession')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg font-medium transition-all duration-200"
          title={t(locale, 'deleteSession')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Signup Modal */}
      {showSignupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">{t(locale, 'joinSession')}: {session.boardGameName}</h3>
              <form onSubmit={handleSignup}>
                <input
                  type="text"
                  placeholder={t(locale, 'yourName')}
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    {t(locale, 'join')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignupForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                  >
                    {t(locale, 'cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-4 text-red-600">{t(locale, 'deleteSession')}</h3>
              <p className="text-gray-700 mb-6">
                {t(locale, 'confirmDeleteSession').replace('{sessionName}', session.boardGameName)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {deleting ? t(locale, 'deleting') : t(locale, 'delete')}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                >
                  {t(locale, 'cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditForm && (
        <EditSessionForm
          session={session}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            onUpdate();
          }}
          locale={locale}
        />
      )}
      
      {/* Comments Section */}
      <Comments sessionId={session.id} locale={locale} />
    </div>
  );
}

// New DateLane component
function DateLane({ lane, onUpdate, locale }: { lane: DateLane; onUpdate: () => void; locale: Locale }) {
  const [isExpanded, setIsExpanded] = useState(lane.sessions.length > 0);

  const isEmpty = lane.sessions.length === 0;
  const today = new Date();
  const laneDate = new Date(lane.date);
  const isPast = laneDate < today && laneDate.toDateString() !== today.toDateString();

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border ${
      isEmpty ? 'border-gray-200 opacity-75' : 'border-gray-200'
    }`}>
      <div 
        className={`px-6 py-4 cursor-pointer transition-all duration-200 ${
          isEmpty 
            ? 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-xl font-semibold ${
              isEmpty ? 'text-gray-200' : 'text-white'
            }`}>
              {lane.dateLabel}
              {isPast && <span className="text-xs ml-2 opacity-75">{t(locale, 'past')}</span>}
            </h3>
            <p className={`text-sm ${
              isEmpty ? 'text-gray-300' : 'text-blue-100'
            }`}>
              {lane.sessions.length} {t(locale, 'session')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {lane.sessions.length > 0 && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                isEmpty 
                  ? 'bg-gray-500 bg-opacity-30 text-gray-200' 
                  : 'bg-blue-400 bg-opacity-30 text-blue-100'
              }`}>
                {lane.sessions.length}
              </span>
            )}
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              } ${
                isEmpty ? 'text-gray-300' : 'text-blue-100'
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-6 bg-gray-50">
          {isEmpty ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">{t(locale, 'noSessionsScheduled')}</p>
                <p className="text-sm">{t(locale, 'createNewSessionForDate')}</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lane.sessions.map((session) => (
                <SessionCard key={session.id} session={session} onUpdate={onUpdate} locale={locale} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateSessionForm({ onClose, onSuccess, locale }: { onClose: () => void; onSuccess: () => void; locale: Locale }) {
  const getLocalDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    boardGameName: '',
    scheduledAt: getLocalDateTimeString(),
    maxPlayers: 4,
    complexity: 2.0,
    minTimeMinutes: 60,
    maxTimeMinutes: 60,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleGameSelect = (game: any) => {
    console.log('Game selected in CreateSessionForm:', game);
    setFormData({
      ...formData,
      boardGameName: game.name,
      complexity: game.complexity,
      minTimeMinutes: game.minPlayingTime,
      maxTimeMinutes: game.maxPlayingTime,
      maxPlayers: game.maxPlayers,
      description: game.description || '',
    });
  };

  // Reset form when modal opens
  useEffect(() => {
    setFormData({
      boardGameName: '',
      scheduledAt: getLocalDateTimeString(),
      maxPlayers: 4,
      complexity: 2.0,
      minTimeMinutes: 60,
      maxTimeMinutes: 60,
      description: '',
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Create session error:', error);
      alert('Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-900/70 to-purple-900/70 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-6 w-full max-w-md mx-4 relative overflow-hidden">
        {/* Boardgame-themed background pattern for modal */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-16 h-16 border-2 border-blue-300 rounded-lg transform rotate-6"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-indigo-300 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 border-2 border-purple-300 transform rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">{t(locale, 'createNewSession')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(locale, 'boardGameName')}
              </label>
              <GameAutocomplete
                value={formData.boardGameName}
                onChange={(value) => setFormData({ ...formData, boardGameName: value })}
                onGameSelect={handleGameSelect}
                placeholder={t(locale, 'searchBoardGame')}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t(locale, 'startTypingToSearchBoardGameGeek')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(locale, 'dateTime')}
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                step="900"
                required
              />

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(locale, 'maxPlayers')}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.maxPlayers || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData({ ...formData, maxPlayers: isNaN(value) ? 4 : value });
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(locale, 'complexity')}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.complexity}
                  onChange={(e) => setFormData({ ...formData, complexity: parseFloat(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                  {formData.complexity.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{t(locale, 'simple')}</span>
                <span>{t(locale, 'complex')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(locale, 'minTime')}
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={formData.minTimeMinutes || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFormData({ ...formData, minTimeMinutes: isNaN(value) ? 60 : value });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="60"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(locale, 'maxTime')}
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={formData.maxTimeMinutes || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFormData({ ...formData, maxTimeMinutes: isNaN(value) ? 60 : value });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="60"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(locale, 'description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white resize-none"
              rows={3}
              placeholder={t(locale, 'gameDescriptionAutoFilled')}
            />
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-medium transition-colors"
            >
              {submitting ? t(locale, 'creating') : t(locale, 'createSession')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors"
            >
              {t(locale, 'cancel')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

function EditSessionForm({ session, onClose, onSuccess, locale }: { session: GameSessionWithSignups; onClose: () => void; onSuccess: () => void; locale: Locale }) {
  const getLocalDateTimeString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    boardGameName: session.boardGameName,
    scheduledAt: getLocalDateTimeString(new Date(session.scheduledAt)),
    maxPlayers: session.maxPlayers,
    complexity: session.complexity || 2.0,
    minTimeMinutes: session.minTimeMinutes || 60,
    maxTimeMinutes: session.maxTimeMinutes || 60,
    description: session.description || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleGameSelect = (game: any) => {
    setFormData({
      ...formData,
      boardGameName: game.name,
      complexity: game.complexity,
      minTimeMinutes: game.minPlayingTime,
      maxTimeMinutes: game.maxPlayingTime,
      maxPlayers: game.maxPlayers,
      description: game.description || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update session');
      }
    } catch (error) {
      console.error('Update session error:', error);
      setError('Failed to update session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-900/70 via-emerald-900/70 to-teal-900/70 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-6 w-full max-w-md mx-4 relative overflow-hidden">
        {/* Boardgame-themed background pattern for modal */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-16 h-16 border-2 border-green-300 rounded-lg transform rotate-6"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-green-300 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 border-2 border-green-300 transform rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">{t(locale, 'editSession')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(locale, 'boardGameName')}
              </label>
              <GameAutocomplete
                value={formData.boardGameName}
                onChange={(value) => setFormData({ ...formData, boardGameName: value })}
                onGameSelect={handleGameSelect}
                placeholder={t(locale, 'searchBoardGame')}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t(locale, 'startTypingToSearchBoardGameGeek')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(locale, 'dateTime')}
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                step="900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(locale, 'maxPlayers')}
              </label>
              <input
                type="number"
                min={session.signups.length}
                max="20"
                value={formData.maxPlayers || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData({ ...formData, maxPlayers: isNaN(value) ? session.signups.length : value });
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {t(locale, 'maxPlayersMinSignups').replace('{minSignups}', session.signups.length.toString())}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(locale, 'complexity')}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.complexity}
                  onChange={(e) => setFormData({ ...formData, complexity: parseFloat(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                  {formData.complexity.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{t(locale, 'simple')}</span>
                <span>{t(locale, 'complex')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(locale, 'minTime')}
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={formData.minTimeMinutes || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFormData({ ...formData, minTimeMinutes: isNaN(value) ? 60 : value });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="60"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(locale, 'maxTime')}
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={formData.maxTimeMinutes || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFormData({ ...formData, maxTimeMinutes: isNaN(value) ? 60 : value });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="60"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(locale, 'description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white resize-none"
                rows={3}
                placeholder={t(locale, 'gameDescriptionAutoFilled')}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-medium transition-colors"
            >
              {submitting ? t(locale, 'updating') : t(locale, 'updateSession')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors"
            >
              {t(locale, 'cancel')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
