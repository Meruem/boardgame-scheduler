'use client';

import { useState } from 'react';
import { GameSession, Signup } from '@/generated/prisma';
import { Locale, t } from '@/lib/i18n';
import SessionCard from '@/components/SessionCard';

// Extended type to include signups
type GameSessionWithSignups = GameSession & {
  signups: Signup[];
};

// Type for date lanes
export type DateLane = {
  date: string;
  dateLabel: string;
  sessions: GameSessionWithSignups[];
};

interface DateLaneProps {
  lane: DateLane;
  onUpdate: () => void;
  locale: Locale;
}

export default function DateLaneComponent({ lane, onUpdate, locale }: DateLaneProps) {
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