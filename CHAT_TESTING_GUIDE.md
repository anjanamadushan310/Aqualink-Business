# Quick Testing Guide for Chat Feature

## Prerequisites
✅ Backend running on port 8080
✅ Frontend running on development server
✅ Two test accounts (one buyer, one seller)

## Step-by-Step Testing

### 1. Start Backend
```bash
cd Backend
mvn spring-boot:run
```

Wait for: `Started AqualinkApplication in X seconds`

### 2. Start Frontend
```bash
cd Frontend
npm run dev
```

### 3. Test Basic Chat Flow

#### A. Create Test Accounts (if needed)
1. Register as Buyer (Shop Owner)
2. Register as Seller (Farm Owner or Industrial Stuff Seller)
3. Wait for admin approval or approve via admin panel

#### B. Create a Product (as Seller)
1. Login as seller
2. Navigate to dashboard
3. Add a fish or industrial product
4. Wait for approval or approve via admin

#### C. Start Chat (as Buyer)
1. Login as buyer
2. Go to home page or products list
3. Click on the product you created
4. Click "Chat with Seller" button
5. Chat window should open

#### D. Send Messages
1. Type a message in the text box
2. Press Enter or click Send button
3. Message should appear instantly

#### E. Send Image
1. Click the photo icon (📷)
2. Select an image file (max 5MB)
3. Preview should appear
4. Click send
5. Image should upload and display in chat

### 4. Test Real-Time Features

#### Open Two Browser Windows
1. **Window 1**: Login as Buyer
2. **Window 2**: Login as Seller (use incognito/private mode)

#### Test Real-Time Sync
1. In Window 1 (Buyer), open chat with seller
2. In Window 2 (Seller), navigate to same product and click "Chat with Seller"
3. Send message from Window 1
4. Message should appear instantly in Window 2
5. Send message from Window 2
6. Message should appear instantly in Window 1

#### Test Typing Indicator
1. Start typing in Window 1
2. "User is typing..." should show in Window 2
3. Vice versa

### 5. Common Issues & Solutions

#### ❌ "WebSocket connection failed"
**Solution:**
- Check if backend is running
- Verify no firewall blocking port 8080
- Check browser console for CORS errors

#### ❌ "Chat button disabled"
**Solution:**
- Make sure you're logged in
- Ensure you're not the product owner
- Check user authentication token

#### ❌ "Image upload failed"
**Solution:**
- Check file size (must be < 5MB)
- Verify `Backend/uploads/chat/` directory exists
- Check file permissions

#### ❌ "Messages not appearing in real-time"
**Solution:**
- Check WebSocket connection in browser console
- Refresh both windows
- Check backend logs for errors

### 6. Verification Checklist

✅ **Text Messages**
- [ ] Can send text messages
- [ ] Messages appear immediately
- [ ] Timestamps are correct
- [ ] Sender name is displayed

✅ **Image Messages**
- [ ] Can select image
- [ ] Preview shows before sending
- [ ] Image uploads successfully
- [ ] Image displays in chat
- [ ] Can send multiple images

✅ **Real-Time Updates**
- [ ] Messages appear instantly in both windows
- [ ] Typing indicator works
- [ ] No delay in message delivery

✅ **UI/UX**
- [ ] Chat window is responsive
- [ ] Auto-scrolls to latest message
- [ ] Can close chat window
- [ ] Images display correctly
- [ ] Mobile view works

✅ **Security**
- [ ] Can't chat without login
- [ ] Can't chat with yourself
- [ ] Messages require authentication

## Browser Console Checks

### Expected Console Logs
```
✓ WebSocket Connected
✓ Subscribed to /topic/chat/{chatRoomId}
```

### Error Logs to Watch For
```
✗ STOMP error: ...
✗ WebSocket connection failed
✗ 401 Unauthorized
```

## Database Verification

### Check Chat Rooms
```sql
SELECT * FROM chat_rooms;
```
Should show:
- buyer_id
- seller_id  
- product_id
- product_type
- last_message

### Check Messages
```sql
SELECT * FROM chat_messages ORDER BY timestamp DESC;
```
Should show:
- sender_id
- content
- type (TEXT/IMAGE)
- timestamp

## API Testing (Optional)

### Using cURL or Postman

#### Get Chat Rooms
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/chat/rooms
```

#### Send Text Message
```bash
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8080/api/chat/message/text?chatRoomId=1&content=Hello"
```

## Success Criteria

✅ All features working
✅ No console errors
✅ Real-time updates functional
✅ Images upload and display
✅ Database records created
✅ WebSocket connected

## Next Steps After Testing

1. **If all tests pass:** Feature is ready for production!
2. **If issues found:** Check troubleshooting section
3. **For production:** Update CORS settings in WebSocketConfig.java

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify database tables exist
4. Ensure all dependencies installed
5. Refer to CHAT_FEATURE_README.md for detailed documentation
