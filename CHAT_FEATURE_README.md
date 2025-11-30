# Real-Time Chat Feature Documentation

## Overview
A real-time chat system that allows buyers to communicate with sellers directly from product pages. Supports text messages and image sharing using WebSocket technology.

## Features
- ✅ Real-time messaging using WebSocket (STOMP protocol)
- ✅ Text message support
- ✅ Image message support (up to 5MB)
- ✅ Typing indicators
- ✅ Unread message count
- ✅ Message history persistence
- ✅ Chat room management
- ✅ Mobile-responsive UI
- ✅ Auto-scroll to latest message
- ✅ Image preview before sending

## Backend Structure

### Entities
1. **ChatRoom** (`chat/entity/ChatRoom.java`)
   - Links buyer, seller, and product
   - Tracks last message and unread counts
   - Supports both FISH and INDUSTRIAL_STUFF products

2. **ChatMessage** (`chat/entity/ChatMessage.java`)
   - Stores message content (text or image)
   - Tracks sender, timestamp, and read status
   - Types: TEXT, IMAGE, SYSTEM

### Repositories
- `ChatRoomRepository` - Manages chat rooms
- `ChatMessageRepository` - Manages messages

### Controllers
1. **ChatController** (`chat/controller/ChatController.java`)
   - REST API endpoints for HTTP requests
   - Endpoints:
     - `POST /api/chat/room` - Get or create chat room
     - `GET /api/chat/rooms` - Get user's all chat rooms
     - `GET /api/chat/messages/{chatRoomId}` - Get messages
     - `POST /api/chat/message/text` - Send text message
     - `POST /api/chat/message/image` - Send image message
     - `POST /api/chat/read/{chatRoomId}` - Mark messages as read

2. **WebSocketChatController** (`chat/controller/WebSocketChatController.java`)
   - WebSocket message handling
   - Real-time message broadcasting

### Services
- **ChatService** (`chat/service/ChatService.java`)
  - Business logic for chat operations
  - File upload handling for images
  - Unread count management

### Configuration
- **WebSocketConfig** (`chat/config/WebSocketConfig.java`)
  - WebSocket endpoint: `/ws`
  - STOMP broker configuration
  - Allows all origins (configure for production)

## Frontend Structure

### Services
1. **chatService.js** (`services/chatService.js`)
   - HTTP API calls for chat operations
   - Handles authentication tokens

2. **websocketService.js** (`services/websocketService.js`)
   - WebSocket connection management
   - Subscription handling
   - Message publishing
   - Typing indicators

### Components
1. **ChatWithSeller** (`components/chat/ChatWithSeller.jsx`)
   - Main chat interface
   - Opens from product pages
   - Features:
     - Message list with auto-scroll
     - Text input with Enter to send
     - Image upload with preview
     - Typing indicator display
     - Real-time message updates

2. **ChatList** (`components/chat/ChatList.jsx`)
   - Shows all user's chat rooms
   - Displays unread counts
   - Product thumbnails
   - Last message preview
   - Can be integrated into user dashboard

## Usage

### Integration in Product Pages

```jsx
import ChatWithSeller from '../chat/ChatWithSeller';

// In component:
const [showChat, setShowChat] = useState(false);

// Chat button:
<button onClick={() => setShowChat(true)}>
  Chat with Seller
</button>

// Chat modal:
{showChat && product && (
  <ChatWithSeller
    product={product}
    productType="FISH" // or "INDUSTRIAL_STUFF"
    onClose={() => setShowChat(false)}
  />
)}
```

### Integration in User Dashboard

```jsx
import ChatList from '../components/chat/ChatList';

// In component:
const [showChatList, setShowChatList] = useState(false);

// Show chat list:
<button onClick={() => setShowChatList(true)}>
  My Chats
</button>

{showChatList && (
  <ChatList
    onClose={() => setShowChatList(false)}
    onSelectChat={(room) => {
      // Open specific chat
    }}
  />
)}
```

## Database Schema

### chat_rooms table
- `id` - Primary key
- `buyer_id` - Foreign key to users
- `seller_id` - Foreign key to users
- `product_id` - Foreign key to product (fish or industrial_stuff)
- `product_type` - "FISH" or "INDUSTRIAL_STUFF"
- `created_at` - Timestamp
- `last_message_at` - Timestamp
- `last_message` - Text preview
- `unread_count_buyer` - Integer
- `unread_count_seller` - Integer

### chat_messages table
- `id` - Primary key
- `chat_room_id` - Foreign key to chat_rooms
- `sender_id` - Foreign key to users
- `sender_name` - Varchar
- `content` - Text
- `type` - Enum (TEXT, IMAGE, SYSTEM)
- `image_url` - Varchar (nullable)
- `timestamp` - Timestamp
- `is_read` - Boolean

## WebSocket Topics

### Subscribe
- `/topic/chat/{chatRoomId}` - Receive messages for a chat room
- `/topic/typing/{chatRoomId}` - Receive typing indicators

### Publish
- `/app/chat.send` - Send a message
- `/app/chat.typing` - Send typing indicator

## File Upload
- Images are stored in `Backend/uploads/chat/`
- Maximum file size: 5MB
- Supported formats: All image types
- Files are uploaded via `FileUploadService`

## Security
- All endpoints require JWT authentication
- User ID extracted from JWT token
- Buyers cannot chat with themselves
- Only participants can access chat room messages

## Dependencies

### Backend
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### Frontend
```json
{
  "@stomp/stompjs": "latest",
  "sockjs-client": "latest"
}
```

## Example Flow

1. **User clicks "Chat with Seller" on product page**
2. Frontend calls `/api/chat/room` to get or create chat room
3. Frontend loads existing messages from `/api/chat/messages/{chatRoomId}`
4. Frontend connects to WebSocket at `/ws`
5. Frontend subscribes to `/topic/chat/{chatRoomId}`
6. User types message and sends
7. Message saved via `/api/chat/message/text`
8. Message broadcast to WebSocket topic
9. Both users receive real-time update
10. Unread count updated for recipient

## Testing

### Test Text Message
1. Login as buyer
2. Go to any product page
3. Click "Chat with Seller"
4. Type a message and press Enter
5. Message should appear in real-time

### Test Image Message
1. In chat window, click image icon
2. Select an image file
3. Preview should appear
4. Click send button
5. Image should upload and appear in chat

### Test Real-Time Updates
1. Open same chat room in two browser windows
2. Send message from one window
3. Message should appear instantly in both windows

## Troubleshooting

### WebSocket Connection Issues
- Check if backend is running on correct port
- Verify CORS configuration in WebSocketConfig
- Check browser console for connection errors

### Messages Not Sending
- Verify JWT token is valid
- Check network tab for API errors
- Ensure user is authenticated

### Images Not Uploading
- Check file size (max 5MB)
- Verify uploads/chat directory exists
- Check file permissions

## Future Enhancements
- [ ] Message deletion
- [ ] Message editing
- [ ] File attachment support (PDF, documents)
- [ ] Voice messages
- [ ] Video call integration
- [ ] Message search
- [ ] Message reactions
- [ ] Group chat support
- [ ] Chat archiving
- [ ] Message notifications
- [ ] Emoji support
- [ ] Read receipts
