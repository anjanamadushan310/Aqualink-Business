import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import BlogService from '../../services/BlogService';

const CommentSection = ({ blogPostId, isExporter = false, onCommentUpdate }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch logged in user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
  }, []);

  // Fetch comments for the blog post
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await BlogService.getCommentsForBlog(blogPostId, page, 10);
        
        // Update parent component with comment count on initial load
        if (page === 0 && onCommentUpdate) {
          onCommentUpdate(data.length);
        }

        setComments(prev => {
          const newComments = page === 0 ? data : [...prev, ...data];
          return newComments;
        });
        setHasMore(data.length === 10); // Assuming backend returns max 10 items per page
      } catch (_err) {
        setError('Failed to load comments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (blogPostId) {
      fetchComments();
    }
  }, [blogPostId, page, onCommentUpdate]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    if (!currentUser) {
      // Trigger login modal
      window.dispatchEvent(new CustomEvent("show-login"));
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const commentData = {
        content: newComment.trim(),
      };
      
      const createdComment = await BlogService.addComment(blogPostId, commentData);
      
      setComments(prev => {
        const newComments = [createdComment, ...prev];
        // Update parent component with new comment count
        if (onCommentUpdate) {
          onCommentUpdate(newComments.length);
        }
        return newComments;
      });
      setNewComment('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to post comment. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await BlogService.deleteComment(commentId);
      
      // Remove comment from local state
      setComments(prev => {
        const newComments = prev.filter(comment => comment.id !== commentId);
        // Update parent component with new comment count
        if (onCommentUpdate) {
          onCommentUpdate(newComments.length);
        }
        return newComments;
      });
    } catch (_err) {
      setError('Failed to delete comment.');
    }
  };

  const loadMoreComments = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Comments</h3>
      
      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="mb-8">
        <div className="flex flex-col space-y-2">
          <label htmlFor="comment" className="sr-only">Add a comment</label>
          <textarea
            id="comment"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting || !currentUser}
          ></textarea>
          
          {!currentUser && (
            <p className="text-sm text-gray-500">
              Please <button 
                type="button" 
                className="text-blue-600 hover:underline" 
                onClick={() => window.dispatchEvent(new CustomEvent("show-login"))}
              >
                login
              </button> to comment
            </p>
          )}
          
          {currentUser && (
            <p className="text-xs text-gray-400">
              Commenting as: {currentUser.username || currentUser.email || 'Unknown User'}
            </p>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting || !newComment.trim() || !currentUser}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </form>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Comments list */}
      {loading && page === 0 ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <>
          {comments.length === 0 ? (
            <div className="text-center py-8 border-t border-gray-100">
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="bg-white p-4 rounded-lg border border-gray-100"
                >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        {comment.author?.profileImageUrl ? (
                          <img 
                            src={comment.author.profileImageUrl} 
                            alt={comment.author.name} 
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <UserCircleIcon className="w-10 h-10 text-gray-400 mr-3" />
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {comment.author?.businessName || 
                             comment.author?.name || 
                             comment.author?.firstName || 
                             comment.author?.fullName ||
                             comment.user?.name ||
                             comment.user?.businessName ||
                             'User'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Comment actions for comment author or exporter */}
                      {(isExporter || (currentUser && comment.author && String(comment.author.id) === String(currentUser.id))) && (
                        <div className="flex space-x-2">
                          {/* Only show delete button for comment author or exporter */}
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 text-gray-700">
                      {comment.content}
                    </div>
                  </div>
                ))}
              
              {/* Load more button */}
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    type="button"
                    onClick={loadMoreComments}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More Comments'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentSection;