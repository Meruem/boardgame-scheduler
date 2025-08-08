'use client';

import { useState, useEffect, useCallback } from 'react';
import { Locale, t, formatDate } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import LoginModal from './LoginModal';

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentsProps {
  sessionId: string;
  locale: Locale;
}

export default function Comments({ sessionId, locale }: CommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newComment, setNewComment] = useState({ authorName: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else {
        console.error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.content.trim()) {
      setError(t(locale, 'commentContentRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/sessions/${sessionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authorName: user?.name || '',
          content: newComment.content.trim() 
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([...comments, comment]);
        setNewComment({ authorName: '', content: '' });
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t(locale, 'failedToPostComment'));
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError(t(locale, 'failedToPostComment'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    // Check authentication
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    if (!confirm(t(locale, 'confirmDeleteComment'))) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(comments.filter(comment => comment.id !== commentId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || t(locale, 'failedToDeleteComment'));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(t(locale, 'failedToDeleteComment'));
    }
  };

  if (loading) {
    return (
      <div className="mt-6">
        <div className="text-sm text-gray-500">{t(locale, 'loading')}</div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          <svg 
            className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {t(locale, 'comments')} ({comments.length})
        </button>
        <button
          onClick={() => {
            if (!isAuthenticated) {
              setShowLoginModal(true);
            } else {
              setShowAddForm(!showAddForm);
              if (isCollapsed) setIsCollapsed(false);
            }
          }}
          className="text-sm bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 p-2 rounded-lg transition-colors"
          title={t(locale, 'addComment')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Add Comment Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <form onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t(locale, 'commentAuthor')}
                    </label>
                    <div className="bg-blue-100 text-blue-800 text-sm px-3 py-2 rounded-lg">
                      {user?.name || t(locale, 'yourName')}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t(locale, 'commentContent')}
                    </label>
                    <textarea
                      value={newComment.content}
                      onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white resize-none"
                      rows={3}
                      placeholder={t(locale, 'commentPlaceholder')}
                      required
                    />
                  </div>
                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {submitting ? t(locale, 'creating') : t(locale, 'postComment')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewComment({ authorName: '', content: '' });
                        setError('');
                      }}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
                    >
                      {t(locale, 'cancel')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">{t(locale, 'noComments')}</p>
                <p className="text-sm">{t(locale, 'beFirstToShareThoughts')}</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {comment.authorName}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(new Date(comment.createdAt), locale)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title={t(locale, 'delete')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          // Open comment form after successful login
          setShowAddForm(true);
          if (isCollapsed) setIsCollapsed(false);
        }}
        locale={locale}
        title={t(locale, 'loginRequired')}
      />
    </div>
  );
}
