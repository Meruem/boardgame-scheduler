'use client';

import { useState, useEffect } from 'react';
import { GameSession } from '@/generated/prisma';

// Prevent hydration errors by ensuring consistent rendering
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

export default function Home() {
  const isClient = useIsClient();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return dateString;
    }
  };

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading sessions...</div>
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
      
      <div className="max-w-4xl mx-auto p-6 relative z-10">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Board Game Scheduler
          </h1>
          <p className="text-gray-600">
            Schedule and join board game sessions with friends
          </p>
        </header>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Upcoming Sessions
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create New Session
          </button>
        </div>

        {isClient && sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No sessions scheduled yet
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Your First Session
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onUpdate={fetchSessions} />
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
          />
        )}
      </div>
    </div>
  );
}

function SessionCard({ session, onUpdate }: { session: GameSession; onUpdate: () => void }) {
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
        alert(error.error || 'Failed to sign up');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Failed to sign up');
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
        alert(error.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete session');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return dateString;
    }
  };

  const isFull = session.signups.length >= session.maxPlayers;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {session.boardGameName}
        </h3>
        <p className="text-gray-600 text-sm">
          {isClient ? formatDate(session.scheduledAt) : 'Loading...'}
        </p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Players: {session.signups.length}/{session.maxPlayers}</span>
          <span className={isFull ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
            {isFull ? 'Full' : 'Open'}
          </span>
        </div>
        
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-medium whitespace-nowrap">Complexity:</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < (session.complexity || 2.0) ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs flex-shrink-0">({(session.complexity || 2.0).toFixed(1)}/5)</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-medium whitespace-nowrap">Time:</span>
            <span className="flex-shrink-0">{session.timeMinutes} min</span>
          </div>
        </div>
        
        {session.signups.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Signed up:</p>
            <div className="flex flex-wrap gap-1">
              {session.signups.map((signup) => (
                <span
                  key={signup.id}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {signup.displayName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!isFull && (
          <button
            onClick={() => setShowSignupForm(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
          >
            Join Session
          </button>
        )}
        <button
          onClick={() => setShowEditForm(true)}
          className="px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg font-medium transition-all duration-200"
          title="Edit session"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg font-medium transition-all duration-200"
          title="Delete session"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {showSignupForm && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-900/70 to-purple-900/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-6 w-full max-w-md mx-4 relative overflow-hidden">
            {/* Boardgame-themed background pattern for modal */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-16 h-16 border-2 border-blue-300 rounded-lg transform rotate-6"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-indigo-300 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 w-8 h-8 border-2 border-purple-300 transform rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Join {session.boardGameName}</h3>
            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="Your name"
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
                  Join
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignupForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gradient-to-br from-red-900/70 via-pink-900/70 to-rose-900/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-6 w-full max-w-md mx-4 relative overflow-hidden">
            {/* Boardgame-themed background pattern for modal */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-16 h-16 border-2 border-red-300 rounded-lg transform rotate-6"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-red-300 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 w-8 h-8 border-2 border-red-300 transform rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Session</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{session.boardGameName}"? This action cannot be undone and will remove all signups.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 rounded-lg font-medium transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {showEditForm && (
        <EditSessionForm
          session={session}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}

function CreateSessionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
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
    timeMinutes: 60,
  });
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    setFormData({
      boardGameName: '',
      scheduledAt: getLocalDateTimeString(),
      maxPlayers: 4,
      complexity: 2.0,
      timeMinutes: 60,
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
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Board Game Name
              </label>
              <input
                type="text"
                value={formData.boardGameName}
                onChange={(e) => setFormData({ ...formData, boardGameName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="e.g., Catan, Ticket to Ride"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time (24-hour format)
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
                Max Players
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
                Complexity (0-5)
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
                <span>Simple</span>
                <span>Complex</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time (minutes)
              </label>
              <input
                type="number"
                min="15"
                max="480"
                step="15"
                value={formData.timeMinutes || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData({ ...formData, timeMinutes: isNaN(value) ? 60 : value });
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="60"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Session'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

function EditSessionForm({ session, onClose, onSuccess }: { session: GameSession; onClose: () => void; onSuccess: () => void }) {
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
    timeMinutes: session.timeMinutes || 60,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Edit Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Board Game Name
              </label>
              <input
                type="text"
                value={formData.boardGameName}
                onChange={(e) => setFormData({ ...formData, boardGameName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="e.g., Catan, Ticket to Ride"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time (24-hour format)
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
                Max Players (minimum: {session.signups.length})
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
                Cannot be less than current signups ({session.signups.length})
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complexity (0-5)
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
                <span>Simple</span>
                <span>Complex</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time (minutes)
              </label>
              <input
                type="number"
                min="15"
                max="480"
                step="15"
                value={formData.timeMinutes || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData({ ...formData, timeMinutes: isNaN(value) ? 60 : value });
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="60"
                required
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
              {submitting ? 'Updating...' : 'Update Session'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
