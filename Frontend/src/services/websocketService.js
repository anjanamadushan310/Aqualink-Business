import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../config';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  connect(onConnected, onError) {
    // Use API_BASE_URL directly for WebSocket connection
    const wsUrl = `${API_BASE_URL}/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log('WebSocket Connected successfully');
        this.connected = true;
        if (onConnected) onConnected();
      },
      
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connected = false;
        if (onError) onError(frame);
      },
      
      onWebSocketClose: () => {
        console.log('WebSocket Disconnected');
        this.connected = false;
      }
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.connected = false;
    }
  }

  subscribeToChat(chatRoomId, onMessageReceived) {
    if (!this.client || !this.connected) {
      console.error('Cannot subscribe - WebSocket not connected');
      return null;
    }

    const topic = `/topic/chat/${chatRoomId}`;
    console.log('Subscribing to chat topic:', topic);
    
    const subscription = this.client.subscribe(topic, (message) => {
      console.log('Received message from WebSocket:', message.body);
      const parsedMessage = JSON.parse(message.body);
      console.log('Parsed message:', parsedMessage);
      onMessageReceived(parsedMessage);
    });

    this.subscriptions.set(chatRoomId, subscription);
    console.log('Successfully subscribed to chat room:', chatRoomId);
    return subscription;
  }

  subscribeToTyping(chatRoomId, onTyping) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const topic = `/topic/typing/${chatRoomId}`;
    return this.client.subscribe(topic, (message) => {
      onTyping(message.body);
    });
  }

  sendMessage(chatRoomId, senderId, senderName, content) {
    if (!this.client || !this.connected) {
      console.error('Cannot send message - WebSocket not connected');
      throw new Error('WebSocket not connected');
    }

    try {
      const messagePayload = {
        chatRoomId,
        senderId,
        senderName,
        content,
        type: 'TEXT'
      };
      
      console.log('Sending message via WebSocket:', messagePayload);
      
      this.client.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(messagePayload)
      });
      
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  sendTypingIndicator(chatRoomId, senderName) {
    if (!this.client || !this.connected) {
      return;
    }

    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({
        chatRoomId,
        senderName
      })
    });
  }

  unsubscribeFromChat(chatRoomId) {
    const subscription = this.subscriptions.get(chatRoomId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(chatRoomId);
    }
  }

  isConnected() {
    return this.connected;
  }
}

const wsService = new WebSocketService();
export default wsService;
