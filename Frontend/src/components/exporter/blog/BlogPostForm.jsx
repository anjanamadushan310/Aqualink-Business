import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BlogService from '../../../services/BlogService';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

const BlogPostForm = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: false,
  });

  // Load blog post if editing
  useEffect(() => {
    const loadBlogPost = async () => {
      if (postId) {
        try {
          setIsLoading(true);
          const post = await BlogService.getBlogPostById(postId);
          setFormData({
            title: post.title,
            content: post.content,
            published: post.published,
          });
          
          // Set image previews from existing post
          if (post.imageUrls && post.imageUrls.length > 0) {
            setImagePreviewUrls(post.imageUrls.map(url => ({
              url,
              isExisting: true,
              originalUrl: url
            })));
          }
        } catch (err) {
          setError('Failed to load blog post. Please try again later.');
          console.error('Error loading blog post:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadBlogPost();
  }, [postId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // We no longer need the handleEditorChange function as we're using handleInputChange for textarea

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Preview images
    const newPreviewUrls = files.map(file => ({
      url: URL.createObjectURL(file),
      file,
      isExisting: false
    }));

    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
    setNewImages([...newImages, ...files]);
    
    // Clear the file input
    e.target.value = null;
  };

  const handleRemoveImage = (index) => {
    const imageToRemove = imagePreviewUrls[index];
    
    // If it's an existing image, track it for deletion on the server
    if (imageToRemove.isExisting) {
      setRemovedImages([...removedImages, imageToRemove.originalUrl]);
    }
    
    // Remove from preview
    const updatedPreviews = [...imagePreviewUrls];
    updatedPreviews.splice(index, 1);
    setImagePreviewUrls(updatedPreviews);
    
    // If it's a new image, remove from newImages as well
    if (!imageToRemove.isExisting) {
      const newFileIndex = newImages.findIndex(file => 
        URL.createObjectURL(file) === imageToRemove.url
      );
      if (newFileIndex !== -1) {
        const updatedNewImages = [...newImages];
        updatedNewImages.splice(newFileIndex, 1);
        setNewImages(updatedNewImages);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare the data for submission
      const postData = {
        ...formData,
        removedImageUrls: removedImages
      };
      
      let result;
      if (postId) {
        // Update existing post
        result = await BlogService.updateBlogPost(postId, postData, newImages);
      } else {
        // Create new post
        result = await BlogService.createBlogPost(postData, newImages);
      }
      
      // Navigate to the blog management page
      navigate('/dashboard/blog');
    } catch (err) {
      setError('Failed to save blog post. Please try again later.');
      console.error('Error saving blog post:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && postId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        {postId ? 'Edit Blog Post' : 'Create New Blog Post'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        {/* Content - Rich Text Editor */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows="10"
            required
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            HTML formatting is supported. You can use tags like &lt;b&gt;, &lt;i&gt;, &lt;h1&gt;, etc.
          </p>
        </div>
        
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images
          </label>
          <div className="flex flex-wrap gap-4 mb-4">
            {imagePreviewUrls.map((image, index) => (
              <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={image.url} 
                  alt={`Preview ${index}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  onClick={() => handleRemoveImage(index)}
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
            >
              <PhotoIcon className="h-8 w-8 text-gray-400" />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>
        
        {/* Submit Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/exporter/blog')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <div className="space-x-2">
            {postId && (
              <button
                type="button"
                onClick={() => navigate(`/blog/${postId}`)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg"
              >
                View Post
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {postId ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BlogPostForm;