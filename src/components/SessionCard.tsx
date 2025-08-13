'use client';

import { useState } from 'react';
import { GameSession, Signup } from '@/generated/prisma';
import { Locale, t } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import LoginModal from '@/components/LoginModal';
import EditSessionForm from '@/components/EditSessionForm';
import Comments from '@/components/Comments';

// Extended type to include signups
type GameSessionWithSignups = GameSession & {
  signups: Signup[];
};

interface SessionCardProps {
  session: GameSessionWithSignups;
  onUpdate: () => void;
  locale: Locale;
}

export default function SessionCard({ session, onUpdate, locale }: SessionCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [pendingAction, setPendingAction] = useState<'join' | 'edit' | 'delete' | null>(null);

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
  
  const formatSessionTimeRange = (session: GameSessionWithSignups) => {
    if (!session.scheduledAt) {
      return t(locale, 'unscheduled');
    }
    
    try {
      const startTime = new Date(session.scheduledAt);
      
      if (!session.maxTimeMinutes) {
        return startTime.toLocaleTimeString(locale === 'cs' ? 'cs-CZ' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      const endTime = new Date(startTime.getTime() + session.maxTimeMinutes * 60 * 1000);
      
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString(locale === 'cs' ? 'cs-CZ' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      };
      
      const startTimeStr = formatTime(startTime);
      const endTimeStr = formatTime(endTime);
      
      return `${startTimeStr} - ${endTimeStr}`;
    } catch {
      return '';
    }
  };

  const isRetired = session.scheduledAt && session.maxTimeMinutes ? 
    new Date(new Date(session.scheduledAt).getTime() + session.maxTimeMinutes * 60 * 1000) < new Date() : 
    false;
  const isFull = session.signups.length >= session.maxPlayers;

  const handleAuthenticatedAction = (action: 'join' | 'edit' | 'delete') => {
    // Prevent joining retired sessions
    if (action === 'join' && isRetired) {
      return;
    }
    
    if (!isAuthenticated) {
      setPendingAction(action);
      setShowLoginModal(true);
    } else {
      switch (action) {
        case 'join':
          setSignupName(user?.name || '');
          setShowSignupForm(true);
          break;
        case 'edit':
          setShowEditForm(true);
          break;
        case 'delete':
          setShowDeleteConfirm(true);
          break;
      }
    }
  };

  const handleLoginSuccess = (userName?: string) => {
    setShowLoginModal(false);
    if (pendingAction) {
      // Directly perform the action after successful login
      switch (pendingAction) {
        case 'join':
          // Prevent joining retired sessions
          if (!isRetired) {
            setSignupName(userName || '');
            setShowSignupForm(true);
          }
          break;
        case 'edit':
          setShowEditForm(true);
          break;
        case 'delete':
          setShowDeleteConfirm(true);
          break;
      }
      setPendingAction(null);
    }
  };

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
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {session.url ? (
            <a 
              href={session.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              {session.boardGameName}
            </a>
          ) : (
            session.boardGameName
          )}
        </h3>
        <div className="text-sm text-gray-600 mb-3">
          <span className="font-medium">{t(locale, 'organizer')}:</span> {session.organizer || 'Unknown Organizer'}
        </div>
        
        {/* Prominent Time Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-bold text-blue-800">{formatSessionTimeRange(session)}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
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
              {session.minTimeMinutes === null && session.maxTimeMinutes === null
                ? '???'
                : session.minTimeMinutes === null
                ? `${session.maxTimeMinutes} ${t(locale, 'minutes')}`
                : session.maxTimeMinutes === null
                ? `${session.minTimeMinutes} ${t(locale, 'minutes')}`
                : session.minTimeMinutes === session.maxTimeMinutes
                ? `${session.minTimeMinutes} ${t(locale, 'minutes')}`
                : `${session.minTimeMinutes}-${session.maxTimeMinutes} ${t(locale, 'minutes')}`}
            </span>
          </div>
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
            onClick={() => handleAuthenticatedAction('join')}
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
            onClick={() => handleAuthenticatedAction('edit')}
            className="px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg font-medium transition-all duration-200"
            title={t(locale, 'editSession')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => handleAuthenticatedAction('delete')}
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
        <div className="fixed inset-0 bg-gradient-to-br from-blue-100/80 via-indigo-100/80 to-purple-100/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">{t(locale, 'joinSession')}: {session.boardGameName}</h3>
              <form onSubmit={handleSignup}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t(locale, 'yourName')}
                  </label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder={t(locale, 'yourName')}
                    required
                  />
                </div>
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
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 min-h-[44px] rounded-lg font-medium transition-colors"
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
        <div className="fixed inset-0 bg-gradient-to-br from-blue-100/80 via-indigo-100/80 to-purple-100/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingAction(null);
        }}
        onSuccess={handleLoginSuccess}
        locale={locale}
        title={t(locale, 'loginRequired')}
      />
    </div>
  );
}