'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { t, Locale, getInitialLocale } from '@/lib/i18n';
import LanguageSelector from '@/components/LanguageSelector';

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

interface EventSelectorProps {
  onEventSelect: (event: Event) => void;
  locale: Locale;
  onLocaleChange?: (locale: Locale) => void;
}

export default function EventSelector({ onEventSelect, locale, onLocaleChange }: EventSelectorProps) {
  const { user, isAuthenticated, logout, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [finishedEvents, setFinishedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showFinishedEvents, setShowFinishedEvents] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      setCurrentLocale(getInitialLocale());
    }
  }, [isClient]);

  // Update currentLocale when the prop changes
  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  const handleLocaleChange = (newLocale: Locale) => {
    setCurrentLocale(newLocale);
    localStorage.setItem('locale', newLocale);
    if (onLocaleChange) {
      onLocaleChange(newLocale);
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      console.log('Fetching events...');
      const response = await fetch('/api/events?includeFinished=true');
      
      if (response.ok) {
        const allData = await response.json();
        
        console.log('All events data received:', allData);
        console.log('Raw data length:', allData.length);
        
        // Ensure finished property exists on all events
        const eventsWithFinished = allData.map((event: Event) => ({
          ...event,
          finished: event.finished ?? false // fallback to false if undefined
        }));
        
        const activeEvents = eventsWithFinished.filter((event: Event) => !event.finished);
        const finishedEvents = eventsWithFinished.filter((event: Event) => event.finished);
        
        console.log('Active events:', activeEvents.length);
        console.log('Finished events found:', finishedEvents.length);
        console.log('Finished events details:', finishedEvents);
        
        setEvents(activeEvents);
        setFinishedEvents(finishedEvents);
      } else {
        console.error('API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        setError(t(currentLocale, 'error'));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(t(currentLocale, 'error'));
    } finally {
      setLoading(false);
    }
  }, [currentLocale]);

  useEffect(() => {
    if (isClient) {
      fetchEvents();
    }
  }, [isClient, currentLocale, fetchEvents]);

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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!formData.name.trim()) {
      setError(t(currentLocale, 'eventNameRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name.trim() }),
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents([newEvent, ...events]);
        setFormData({ name: '' });
        setShowCreateForm(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || t(currentLocale, 'failedToCreateEvent'));
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setError(t(currentLocale, 'failedToCreateEvent'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!formData.name.trim() || !editingEvent) {
      setError(t(currentLocale, 'eventNameRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name.trim() }),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(events.map(event => 
          event.id === editingEvent.id ? { ...updatedEvent, _count: event._count } : event
        ));
        setFormData({ name: '' });
        setShowEditForm(false);
        setEditingEvent(null);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || t(currentLocale, 'failedToUpdateEvent'));
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setError(t(currentLocale, 'failedToUpdateEvent'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishEvent = async (event: Event) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!confirm(t(currentLocale, 'confirmFinishEvent').replace('{eventName}', event.name))) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finished: true }),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(events.filter(e => e.id !== event.id));
        setFinishedEvents([updatedEvent, ...finishedEvents]);
        setError('');
      } else {
        const errorData = await response.json();
        if (errorData.error === 'CANNOT_FINISH_EVENT_WITH_OPEN_SESSIONS') {
          setError(t(currentLocale, 'cannotFinishEventWithOpenSessions'));
        } else {
          setError(errorData.error || t(currentLocale, 'failedToFinishEvent'));
        }
      }
    } catch (error) {
      console.error('Error finishing event:', error);
      setError(t(currentLocale, 'failedToFinishEvent'));
    }
  };

  const startEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({ name: event.name });
    setShowEditForm(true);
  };

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-700">{t(currentLocale, 'loading')}</div>
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
      
                        <div className="container mx-auto px-4 py-8 relative z-10">
                    <div className="max-w-4xl mx-auto">
                      <header className="mb-8">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">{t(currentLocale, 'title')}</h1>
                            <p className="text-gray-600 text-lg">{t(currentLocale, 'subtitle')}</p>
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
                                      {t(currentLocale, 'logout')}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowLoginModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                {t(currentLocale, 'login')}
                              </button>
                            )}
                            <LanguageSelector currentLocale={currentLocale} onLocaleChange={handleLocaleChange} />
                          </div>
                        </div>
                      </header>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!showCreateForm && !showEditForm && (
            <div className="text-center mb-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {t(currentLocale, 'createEvent')}
              </button>
            </div>
          )}

          {showCreateForm && (
            <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">{t(currentLocale, 'createEvent')}</h2>
              <form onSubmit={handleCreateEvent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t(currentLocale, 'eventName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder={t(currentLocale, 'eventName')}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? t(currentLocale, 'creating') : t(currentLocale, 'save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ name: '' });
                      setError('');
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    {t(locale, 'cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showEditForm && editingEvent && (
            <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">{t(currentLocale, 'editEvent')}</h2>
              <form onSubmit={handleEditEvent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t(currentLocale, 'eventName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder={t(currentLocale, 'eventName')}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? t(currentLocale, 'updating') : t(currentLocale, 'save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingEvent(null);
                      setFormData({ name: '' });
                      setError('');
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    {t(currentLocale, 'cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Events Section */}
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">{t(currentLocale, 'noEvents')}</div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {t(currentLocale, 'createFirstEvent')}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.name}</h3>
                  <p className="text-gray-700 mb-4 font-medium">
                    {event._count?.sessions || 0} {(event._count?.sessions || 0) === 1 ? t(currentLocale, 'session') : t(currentLocale, 'session')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEventSelect(event)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {t(currentLocale, 'selectEvent')}
                    </button>
                    <button
                      onClick={() => startEdit(event)}
                      className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg transition-colors border border-gray-300"
                      title={t(currentLocale, 'editEvent')}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleFinishEvent(event)}
                      className="bg-white hover:bg-gray-50 text-orange-600 font-semibold py-2 px-3 rounded-lg transition-colors border border-gray-300"
                      title={t(currentLocale, 'finishEvent')}
                    >
                      ✅
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Finished Events Section - Always show if there are finished events */}
          {finishedEvents.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowFinishedEvents(!showFinishedEvents)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium mb-4"
              >
                <span>{t(currentLocale, 'finishedEvents')} ({finishedEvents.length})</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showFinishedEvents ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showFinishedEvents && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {finishedEvents.map((event) => (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-6 shadow-lg border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">{event.name}</h3>
                      <p className="text-gray-500 mb-4 font-medium">
                        {event._count?.sessions || 0} {(event._count?.sessions || 0) === 1 ? t(currentLocale, 'session') : t(currentLocale, 'session')}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {t(currentLocale, 'finished')}
                        </div>
                        <button
                          onClick={() => onEventSelect(event)}
                          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          {t(currentLocale, 'viewSessions')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{t(currentLocale, 'loginRequired')}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              if (name && name.trim()) {
                // Use the auth context's login function
                login(name.trim());
                setShowLoginModal(false);
              }
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {t(currentLocale, 'enterYourName')}
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder={t(currentLocale, 'enterYourName')}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {t(currentLocale, 'continue')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {t(currentLocale, 'cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
