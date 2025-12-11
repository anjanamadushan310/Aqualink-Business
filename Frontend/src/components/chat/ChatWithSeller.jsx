import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  PhotoIcon,
  PaperClipIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import chatService from '../../services/chatService';
import wsService from '../../services/websocketService';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==';

const resolveImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  let cleanPath = path.startsWith('/') ? path.substring(1) : path;
  if (!cleanPath.startsWith('uploads/')) {
    cleanPath = `uploads/${cleanPath}`;
  }

  const baseUrl = API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  return `${baseUrl}/${cleanPath}`;
};

const normalizeProductType = (explicitType, product) => {
  const sourceType = explicitType || product?.productType || 'SERVICE';
  const upper = sourceType.toString().toUpperCase();

  if (upper === 'FISH' || upper === 'FISHES') return 'FISH';
  if (upper === 'INDUSTRIAL' || upper === 'INDUSTRIAL_STUFF') return 'INDUSTRIAL_STUFF';
  return 'SERVICE';
};

const resolveProductName = (product) => {
  if (!product) return 'Product';
  return (
    product.name ||
    product.productName ||
    product.title ||
    product.serviceName ||
    product.fishName ||
    'Product'
  );
};

const resolveProductImagePath = (product) => {
  if (!product) return '';

  const candidateLists = [product.imagePaths, product.imageUrls, product.images];
  for (const list of candidateLists) {
    if (Array.isArray(list) && list.length > 0) {
      return list[0];
    }
  }

  return (
    product.image ||
    product.imageUrl ||
    product.imagePath ||
    product.productImage ||
    product.primaryImage ||
    product.thumbnail ||
    product.coverImage ||
    ''
  );
};

/**
 * ChatWithSeller Component - Product-Context-Aware Chat Interface
 * 
 * Functional Requirements Implementation:
 * 
 * 1. CONTEXT-AWARE CHAT INITIATION:
 *    - Receives product object with userId (sellerId), id (productId), and type
 *    - Calls chatService.getOrCreateChatRoom() with specific product context
 *    - Displays product information (name, image) in chat header
 *    - Each product listing has its own dedicated chat thread
 * 
 * 2. PERSISTENT CHAT HISTORY:
 *    - On mount, retrieves all existing messages for this chat room
 *    - Messages are loaded from database, not just WebSocket
 *    - Historical conversation is displayed chronologically
 * 
 * 3. PRODUCT LIFECYCLE INTEGRATION:
 *    - Chat remains available as long as product listing is active
 *    - Product info is dynamically displayed in chat interface
 *    - WebSocket subscription is specific to this product's chat room
 * 
 * 4. REAL-TIME MESSAGING:
 *    - Text messages sent via WebSocket for instant delivery
 *    - Image messages uploaded via HTTP
 *    - All messages persisted to database
 * 
 * @param {Object} product - The product object (fish or industrial item)
 * @param {string} productType - "FISH" or "INDUSTRIAL_STUFF"
 * @param {Function} onClose - Callback to close the chat modal
 */
const ChatWithSeller = ({ product, productType, onClose, existingChatRoom }) => {
  const { user } = useAuth();
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const resolvedProductType = useMemo(
    () => normalizeProductType(productType, product),
    [product, productType]
  );

  const productName = useMemo(() => resolveProductName(product), [product]);

  const productImagePath = useMemo(
    () => resolveProductImagePath(product),
    [product]
  );

  const productImageUrl = useMemo(() => {
    const url = resolveImageUrl(productImagePath);
    return url || FALLBACK_IMAGE;
  }, [productImagePath]);

  const roomToDisplay = chatRoom || existingChatRoom;

  useEffect(() => {
    console.log('=== ChatWithSeller Component Mounted ===');
    console.log('User:', user);
    console.log('Product:', product);
    console.log('Product Type (prop):', productType);
    console.log('Resolved Product Type:', resolvedProductType);
    console.log('Existing Chat Room:', existingChatRoom);
    
    initializeChat();
    
    // Monitor WebSocket connection status
    const checkConnection = setInterval(() => {
      const isConnected = wsService.isConnected();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    }, 2000);
    
    return () => {
      console.log('=== ChatWithSeller Component Unmounting ===');
      clearInterval(checkConnection);
      if (chatRoom) {
        wsService.unsubscribeFromChat(chatRoom.id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    console.log('=== Initializing Chat ===');
    setErrorMessage('');
    
    try {
      // Validate user is logged in
      if (!user || !user.userId) {
        const error = 'User not logged in or userId missing';
        console.error(error, user);
        setErrorMessage('Please login to use chat');
        setLoading(false);
        return;
      }
      
      let room;

      if (existingChatRoom) {
        console.log('Using existing chat room:', existingChatRoom);
        room = existingChatRoom;
        setChatRoom(room);
      } else {
        // Validate product data only if creating new chat
        if (!product || !product.userId || !product.id) {
          const error = 'Invalid product data';
          console.error(error, product);
          setErrorMessage('Product information missing');
          setLoading(false);
          return;
        }
        
        console.log('User validated:', { userId: user.userId, name: user.name || user.email });
        console.log('Product validated:', { sellerId: product.userId, productId: product.id, type: resolvedProductType });
        
        /**
         * CONTEXT-AWARE CHAT ROOM CREATION
         * 
         * This call implements the core requirement:
         * "Upon selecting a fish listing and clicking 'Chat with Seller',
         *  the system must initiate a chat session linked to the selected product ID"
         * 
         * Parameters:
         * - product.userId: The seller's ID (owner of the product listing)
         * - product.id: The specific product ID (fish or industrial item)
         * - productType: Distinguishes between FISH and INDUSTRIAL_STUFF
         * 
         * Backend behavior:
         * - Checks if chat room exists for this buyer-seller-product combination
         * - If exists: Returns existing room with all historical messages
         * - If new: Creates new room linked to this specific product
         * 
         * Result:
         * - Each product listing has its own conversation thread
         * - Chat history persists as long as the product listing is active
         */
        console.log('Creating/fetching chat room...');
        room = await chatService.getOrCreateChatRoom(
          product.userId,
          product.id,
          resolvedProductType
        );
        setChatRoom(room);
      }

      /**
       * LOAD PERSISTENT CHAT HISTORY
       * 
       * Retrieves all existing messages from the database
       * This ensures conversation history is preserved and displayed
       * Messages remain available throughout the product listing's lifecycle
       */
      const existingMessages = await chatService.getChatMessages(room.id);
      setMessages(existingMessages);

      // Mark messages as read
      await chatService.markMessagesAsRead(room.id);

      /**
       * REAL-TIME WEBSOCKET CONNECTION
       * 
       * Subscribe to WebSocket topic for this specific chat room
       * New messages are delivered in real-time while also being persisted
       */
      if (!wsService.isConnected()) {
        wsService.connect(
          () => subscribeToChat(room.id),
          (error) => console.error('WebSocket error:', error)
        );
      } else {
        subscribeToChat(room.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setLoading(false);
    }
  };

  const subscribeToChat = (roomId) => {
    wsService.subscribeToChat(roomId, (message) => {
      console.log('Received message from WebSocket:', message);
      
      // Remove any pending optimistic messages and add the real one
      setMessages(prev => {
        // Filter out pending messages with same content
        const withoutPending = prev.filter(msg => 
          !(msg.pending && msg.content === message.content && msg.senderId === message.senderId)
        );
        
        // Check if this message already exists (avoid duplicates)
        const exists = withoutPending.some(msg => msg.id === message.id);
        
        if (exists) {
          return withoutPending;
        }
        
        return [...withoutPending, message];
      });
      
      // Mark as read if not sent by current user
      if (message.senderId !== user.userId) {
        chatService.markMessagesAsRead(roomId);
      }
    });

    wsService.subscribeToTyping(roomId, (typingText) => {
      setTypingIndicator(typingText);
      setTimeout(() => setTypingIndicator(''), 3000);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (product) {
      console.log('ChatWithSeller product:', product);
      console.log('Resolved product name:', productName);
      console.log('Resolved product image path:', productImagePath);
      console.log('Resolved product image URL:', productImageUrl);
    }
  }, [product, productImagePath, productImageUrl, productName]);

  const handleSendMessage = async (e) => {
    // Prevent form submission if called from a form
    if (e) {
      e.preventDefault();
    }

    // Validate inputs
    if ((!newMessage.trim() && !selectedImage) || !chatRoom) {
      console.log('Cannot send: empty message or no chat room');
      return;
    }

    // Check WebSocket connection for text messages
    if (!selectedImage && !wsService.isConnected()) {
      alert('Connection lost. Please refresh the page and try again.');
      return;
    }

    setSending(true);
    const messageToSend = newMessage.trim();
    const imageToSend = selectedImage;

    try {
      if (imageToSend) {
        // Send image via HTTP (file upload)
        console.log('Sending image message...');
        const result = await chatService.sendImageMessage(chatRoom.id, imageToSend);
        console.log('Image message sent successfully:', result);
        
        // Avoid duplicates when WebSocket echo returns before/after HTTP response
        if (result) {
          setMessages(prev => {
            if (result.id && prev.some(msg => msg.id === result.id)) {
              return prev;
            }
            return [...prev, result];
          });
        }
        
        // Clear image preview on success
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        // Send text via WebSocket for real-time delivery
        console.log('Sending text message with user:', user);
        console.log('Message content:', messageToSend);
        
        // Create optimistic message for immediate UI feedback
        const optimisticMessage = {
          id: Date.now(), // Temporary ID
          chatRoomId: chatRoom.id,
          senderId: user.userId,
          senderName: user.name || user.email,
          content: messageToSend,
          type: 'TEXT',
          timestamp: new Date().toISOString(),
          isRead: false,
          pending: true // Mark as pending
        };
        
        // Add to local state immediately for instant feedback
        setMessages(prev => [...prev, optimisticMessage]);
        
        // Clear input immediately for better UX
        setNewMessage('');
        
        // Send via WebSocket (throws error if not connected)
        wsService.sendMessage(
          chatRoom.id,
          user.userId,
          user.name || user.email,
          messageToSend
        );
        
        console.log('Text message sent via WebSocket');
        
        // The actual message will come back via WebSocket subscription
        // and replace/update the optimistic one
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // If text message failed, remove the optimistic message and restore input
      if (!imageToSend) {
        setMessages(prev => prev.filter(msg => !msg.pending));
        setNewMessage(messageToSend); // Restore the message
      }
      
      // Provide specific error messages
      let errorMessage = 'Failed to send message. ';
      if (error.message === 'WebSocket not connected') {
        errorMessage += 'Connection lost. Please refresh the page.';
      } else if (error.response) {
        errorMessage += `Server error: ${error.response.status}`;
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Don't send if already sending or message is empty
      if (!sending && newMessage.trim()) {
        handleSendMessage(e);
      }
    }
  };

  const handleTyping = () => {
    if (chatRoom && wsService.isConnected()) {
      wsService.sendTypingIndicator(chatRoom.id, user.name || user.email);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col">
        {/* Connection Status Banner */}
        {connectionStatus === 'disconnected' && (
          <div className="bg-red-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
            <span>⚠️ Connection Lost - Messages may not send</span>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-50"
            >
              Refresh Page
            </button>
          </div>
        )}
        {connectionStatus === 'connected' && (
          <div className="bg-green-500 text-white px-4 py-1 text-xs text-center">
            ✓ Connected
          </div>
        )}
        {errorMessage && (
          <div className="bg-yellow-500 text-white px-4 py-2 text-sm">
            ⚠️ {errorMessage}
          </div>
        )}
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div 
            className="flex items-center gap-4 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors"
            onClick={() => {
              // Navigate to product details page based on product type
              const type = resolvedProductType;
              const id = product?.id || product?.productId;
              
              if (type === 'FISH') {
                window.location.href = `/fish/${id}`;
              } else if (type === 'INDUSTRIAL_STUFF') {
                window.location.href = `/industrial/${id}`;
              } else if (type === 'SERVICE') {
                window.location.href = `/service/${id}`;
              }
            }}
            title="View Product Details"
          >
            <img
              src={productImageUrl}
              alt={productName}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-semibold text-lg hover:underline">
                {productName}
              </h3>
              <p className="text-sm text-white/80">
                Chat with {user.userId === roomToDisplay?.sellerId ? roomToDisplay?.buyerName : roomToDisplay?.sellerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.senderId === user.userId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-md'
                    } p-3`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-semibold mb-1 text-gray-600">
                        {message.senderName}
                      </p>
                    )}
                    
                    {message.type === 'IMAGE' ? (
                      <div className="relative group">
                        <img
                          src={resolveImageUrl(message.imageUrl) || FALLBACK_IMAGE}
                          alt="Chat image"
                          className="rounded-lg max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => window.open(resolveImageUrl(message.imageUrl), '_blank')}
                          onError={(e) => {
                            console.error('Failed to load chat image:', resolveImageUrl(message.imageUrl));
                            e.target.style.opacity = '0.5';
                          }}
                        />
                        <a 
                          href={resolveImageUrl(message.imageUrl)} 
                          download={`image-${message.id}.jpg`}
                          className="absolute bottom-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                          title="Download"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </a>
                        {message.content && message.content !== 'Image' && (
                          <p className="mt-2">{message.content}</p>
                        )}
                      </div>
                    ) : (
                      <p className="break-words">{message.content}</p>
                    )}
                    
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-white/70' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {typingIndicator && (
            <div className="text-sm text-gray-500 italic mt-2">
              {typingIndicator}
            </div>
          )}
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="p-4 bg-white border-t">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded-lg"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t rounded-b-2xl">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Attach image"
            >
              <PhotoIcon className="w-6 h-6" />
            </button>

            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={sending}
            />

            <button
              onClick={handleSendMessage}
              disabled={sending || (!newMessage.trim() && !selectedImage) || connectionStatus === 'disconnected'}
              className={`text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                connectionStatus === 'disconnected' 
                  ? 'bg-gray-400' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title={connectionStatus === 'disconnected' ? 'No connection' : 'Send message'}
            >
              {sending ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <PaperAirplaneIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWithSeller;
