'use client';

import { useState, useEffect, useRef } from 'react';
import { Locale, t } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import GameAutocomplete from '@/components/GameAutocomplete';
import type { BGGGame } from '@/lib/bgg';

interface CreateSessionFormProps {
  onClose: () => void;
  onSuccess: () => void;
  locale: Locale;
  eventId?: string;
}

export default function CreateSessionForm({ onClose, onSuccess, locale, eventId }: CreateSessionFormProps) {
  const { user } = useAuth();
  const gameNameInputRef = useRef<HTMLInputElement>(null);
  
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    boardGameName: '',
    date: getLocalDateString(),
    startTime: getLocalTimeString(),
    endTime: getLocalTimeString(),
    maxPlayers: 4,
    complexity: 2.0,
    minTimeMinutes: null as number | null,
    maxTimeMinutes: null as number | null,
    description: '',
    organizer: user?.name || 'Unknown Organizer',
    url: '',
    isUnscheduled: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleGameSelect = (game: BGGGame) => {
    console.log('Game selected in CreateSessionForm:', game);
    setFormData({
      ...formData,
      boardGameName: game.name,
      complexity: game.complexity,
      minTimeMinutes: game.minPlayingTime,
      maxTimeMinutes: game.maxPlayingTime,
      maxPlayers: game.maxPlayers,
      description: game.description || '',
      url: game.url || '',
    });
  };

  // Reset form when modal opens
  useEffect(() => {
    setFormData({
      boardGameName: '',
      date: getLocalDateString(),
      startTime: getLocalTimeString(),
      endTime: getLocalTimeString(),
      maxPlayers: 4,
      complexity: 2.0,
      minTimeMinutes: null,
      maxTimeMinutes: null,
      description: '',
      organizer: user?.name || 'Unknown Organizer',
      url: '',
      isUnscheduled: false,
    });
  }, [user?.name]);

  // Focus on game name input when form opens
  useEffect(() => {
    if (gameNameInputRef.current) {
      gameNameInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate that end time is not before start time (only if scheduled)
    if (!formData.isUnscheduled && formData.endTime < formData.startTime) {
      setErrors({ endTime: t(locale, 'endTimeBeforeStartTime') });
      return;
    }
    
    setSubmitting(true);

    try {
      // Combine date and start time for scheduledAt (only if not unscheduled)
      const scheduledAt = formData.isUnscheduled ? null : `${formData.date}T${formData.startTime}`;
      
      const requestBody = {
        boardGameName: formData.boardGameName,
        scheduledAt,
        maxPlayers: formData.maxPlayers,
        complexity: formData.complexity,
        minTimeMinutes: formData.minTimeMinutes || null,
        maxTimeMinutes: formData.maxTimeMinutes || null,
        description: formData.description,
        organizer: formData.organizer,
        url: formData.url || null,
        eventId: eventId,
      };
      
      console.log('Creating session with eventId:', eventId, 'Request body:', requestBody);
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const createdSession = await response.json();
        
        // Automatically sign up the session author
        try {
          const signupResponse = await fetch(`/api/sessions/${createdSession.id}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName: formData.organizer.trim() }),
          });
          
          if (!signupResponse.ok) {
            const errorText = await signupResponse.text();
            console.warn('Failed to auto-signup session author:', errorText);
            // Don't fail the whole operation if auto-signup fails
          } else {
            console.log('Successfully auto-signed up session author');
          }
        } catch (signupError) {
          console.warn('Error during auto-signup:', signupError);
          // Don't fail the whole operation if auto-signup fails
        }
        
        onSuccess();
      } else {
        const error = await response.json();
        setErrors({ general: error.error || 'Failed to create session' });
      }
    } catch (error) {
      console.error('Create session error:', error);
      setErrors({ general: 'Failed to create session' });
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-update end time when start time changes
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setFormData({ ...formData, startTime: newStartTime });
    
    // If end time is before start time, update it to 1 hour later
    if (formData.endTime < newStartTime) {
      const [hours, minutes] = newStartTime.split(':').map(Number);
      const endHours = (hours + 1) % 24;
      const endTimeString = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, startTime: newStartTime, endTime: endTimeString }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-900/70 to-purple-900/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Boardgame-themed background pattern for modal */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-16 h-16 border-2 border-blue-300 rounded-lg transform rotate-6"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-indigo-300 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 border-2 border-purple-300 transform rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">{t(locale, 'createNewSession')}</h2>
        
        {/* Error Display */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Left Column */}
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
                  inputRef={gameNameInputRef}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t(locale, 'startTypingToSearchBoardGameGeek')}
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-1">
                  <input
                    type="checkbox"
                    checked={formData.isUnscheduled}
                    onChange={(e) => setFormData({ ...formData, isUnscheduled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {t(locale, 'unscheduled')}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {t(locale, 'unscheduledDescription')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(locale, 'date')}
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${formData.isUnscheduled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required={!formData.isUnscheduled}
                  disabled={formData.isUnscheduled}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t(locale, 'startTime')}
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={handleStartTimeChange}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${formData.isUnscheduled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      required={!formData.isUnscheduled}
                      disabled={formData.isUnscheduled}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                      <button
                        type="button"
                        onClick={() => {
                          const [hours, minutes] = formData.startTime.split(':').map(Number);
                          const newMinutes = (minutes + 15) % 60;
                          const newHours = minutes + 15 >= 60 ? (hours + 1) % 24 : hours;
                          const newTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
                          setFormData({ ...formData, startTime: newTime });
                        }}
                        className="w-6 h-4 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-t text-xs"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const [hours, minutes] = formData.startTime.split(':').map(Number);
                          const newMinutes = minutes - 15 < 0 ? minutes + 45 : minutes - 15;
                          const newHours = minutes - 15 < 0 ? (hours - 1 + 24) % 24 : hours;
                          const newTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
                          setFormData({ ...formData, startTime: newTime });
                        }}
                        className="w-6 h-4 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-b text-xs"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t(locale, 'endTime')}
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${formData.isUnscheduled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      required={!formData.isUnscheduled}
                      disabled={formData.isUnscheduled}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                      <button
                        type="button"
                        onClick={() => {
                          const [hours, minutes] = formData.endTime.split(':').map(Number);
                          const newMinutes = (minutes + 15) % 60;
                          const newHours = minutes + 15 >= 60 ? (hours + 1) % 24 : hours;
                          const newTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
                          setFormData({ ...formData, endTime: newTime });
                        }}
                        className="w-6 h-4 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-t text-xs"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const [hours, minutes] = formData.endTime.split(':').map(Number);
                          const newMinutes = minutes - 15 < 0 ? minutes + 45 : minutes - 15;
                          const newHours = minutes - 15 < 0 ? (hours - 1 + 24) % 24 : hours;
                          const newTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
                          setFormData({ ...formData, endTime: newTime });
                        }}
                        className="w-6 h-4 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-b text-xs"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                  {errors.endTime && (
                    <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(locale, 'maxPlayers')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxPlayers || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFormData({ ...formData, maxPlayers: isNaN(value) ? 4 : value });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                      setFormData({ ...formData, minTimeMinutes: isNaN(value) ? null : value });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Optional"
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
                      setFormData({ ...formData, maxTimeMinutes: isNaN(value) ? null : value });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(locale, 'organizer')}
                </label>
                <input
                  type="text"
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder={t(locale, 'yourName')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="https://boardgamegeek.com/boardgame/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(locale, 'description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white resize-none"
                  rows={4}
                  placeholder={t(locale, 'gameDescriptionAutoFilled')}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 min-h-[44px] rounded-lg font-medium transition-colors"
            >
              {submitting ? t(locale, 'creating') : t(locale, 'createSession')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 min-h-[44px] rounded-lg font-medium transition-colors"
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