import React, { useState, useEffect, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { send } from 'ionicons/icons';
import { YummyText } from '../../components/YummyText';
import socketService from '../../services/socket.service';
import { getCookie, setCookie, setJSONCookie, getJSONCookie } from '../../utils/cookies';

/**
 * DeliveryChat Component
 * Real-time chat between customer and rider for a specific delivery
 * 
 * @param {string} deliveryId - The delivery ID
 * @param {string} currentUserRole - Either "customer" or "driver"
 * @param {string} className - Additional CSS classes
 * @param {string} maxHeight - Max height (e.g., "220px", "300px")
 */
const DeliveryChat = ({
  deliveryId,
  currentUserRole = 'customer',
  className = '',
  maxHeight = '300px'
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Get current user info
  const getCurrentUser = () => {
    try {
      const userDataCookie = getCookie('user_data');
      if (userDataCookie) {
        const userData = JSON.parse(userDataCookie);
        return {
          id: userData._id || userData.id,
          name: userData.name || userData.firstName || 'User',
          role: currentUserRole
        };
      }
    } catch (e) {
      console.error('[DeliveryChat] Failed to get user data:', e);
    }
    return {
      id: currentUserRole === 'customer' ? 'customer-unknown' : 'driver-unknown',
      name: currentUserRole === 'customer' ? 'Customer' : 'Driver',
      role: currentUserRole
    };
  };

  const currentUser = getCurrentUser();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Load messages from localStorage on mount
  useEffect(() => {
    // Persist SmartRide progress into cookies so returning from chat restores Rider Details
    try {
      if (deliveryId) {
        try { setCookie('smartride_delivery_id', String(deliveryId)); } catch (e) { }
        try { setCookie('smartride_step', 'rider-details'); } catch (e) { }
        try {
          const storedRd = localStorage.getItem('smartride_rider_details');
          if (storedRd) {
            try { setJSONCookie('smartride_rider_details', JSON.parse(storedRd)); } catch (e) { }
          } else {
            const cookieRd = getJSONCookie('smartride_rider_details');
            if (cookieRd) {
              try { setJSONCookie('smartride_rider_details', cookieRd); } catch (e) { }
            }
          }
        } catch (e) { }
      }
    } catch (e) { }
    const loadMessages = () => {
      try {
        const storageKey = `delivery_chat_${deliveryId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setMessages(parsed);
          console.log(`[DeliveryChat] Loaded ${parsed.length} messages for delivery ${deliveryId}`);
        }
      } catch (e) {
        console.error('[DeliveryChat] Failed to load messages:', e);
      }
    };

    if (deliveryId) {
      loadMessages();
    }
  }, [deliveryId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (deliveryId && messages.length > 0) {
      try {
        const storageKey = `delivery_chat_${deliveryId}`;
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.error('[DeliveryChat] Failed to save messages:', e);
      }
    }
  }, [messages, deliveryId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to socket and listen for messages
  useEffect(() => {
    if (!deliveryId) return;

    console.log('[DeliveryChat] Connecting to socket for delivery:', deliveryId);

    try {
      socketService.connect();

      // Join delivery chat room
      const roomName = `delivery_${deliveryId}`;
      socketService.emit('join:delivery:chat', { deliveryId, room: roomName });

      // Listen for incoming messages
      const handleIncomingMessage = (data) => {
        console.log('[DeliveryChat] Received message:', data);

        // Don't add if it's our own message (already added optimistically)
        if (data.senderId === currentUser.id) {
          return;
        }

        const newMsg = {
          id: data.id || Date.now(),
          text: data.message || data.text,
          sender: data.senderRole || data.role || 'unknown',
          senderName: data.senderName || 'Unknown',
          timestamp: data.timestamp || new Date().toISOString(),
          senderId: data.senderId
        };

        setMessages(prev => [...prev, newMsg]);
      };

      socketService.on('delivery:chat:message', handleIncomingMessage);

      return () => {
        console.log('[DeliveryChat] Cleaning up socket listeners');
        socketService.off('delivery:chat:message', handleIncomingMessage);

        // Leave room
        try {
          socketService.emit('leave:delivery:chat', { deliveryId, room: roomName });
        } catch (e) {
          console.warn('[DeliveryChat] Failed to leave room:', e);
        }
      };
    } catch (e) {
      console.error('[DeliveryChat] Socket setup failed:', e);
    }
  }, [deliveryId, currentUser.id]);

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);

    try {
      const messageData = {
        id: Date.now(),
        deliveryId,
        message: newMessage.trim(),
        text: newMessage.trim(),
        senderId: currentUser.id,
        senderRole: currentUser.role,
        senderName: currentUser.name,
        timestamp: new Date().toISOString(),
        role: currentUser.role
      };

      // Add to local state immediately (optimistic update)
      const localMessage = {
        id: messageData.id,
        text: messageData.message,
        sender: currentUser.role,
        senderName: currentUser.name,
        timestamp: messageData.timestamp,
        senderId: currentUser.id
      };

      setMessages(prev => [...prev, localMessage]);

      // Send via socket
      console.log('[DeliveryChat] Sending message:', messageData);
      socketService.emit('delivery:chat:send', messageData);

      // Clear input
      setNewMessage('');
    } catch (e) {
      console.error('[DeliveryChat] Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!deliveryId) {
    return (
      <div className={`bg-gray-50 rounded-xl p-4 text-center ${className}`}>
        <YummyText className="text-sm text-gray-500">
          Chat not available
        </YummyText>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-white ${className}`}
      style={{ height: maxHeight }}
    >
      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{
          maxHeight: `calc(${maxHeight} - 60px)`,
          scrollbarWidth: 'thin'
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <YummyText className="text-xs text-gray-400">
              No messages yet. Start a conversation!
            </YummyText>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.sender === currentUser.role || msg.senderId === currentUser.id;

            return (
              <div
                key={msg.id || index}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-xl ${isOwnMessage
                    ? 'bg-[#00B75A] text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                >
                  {/* Show sender name for received messages */}
                  {!isOwnMessage && (
                    <div className="text-xs text-gray-600 mb-1 font-medium">
                      {msg.senderName || (msg.sender === 'customer' ? 'Customer' : 'Rider')}
                    </div>
                  )}

                  <YummyText className="text-sm break-words">
                    {msg.text}
                  </YummyText>

                  {/* Timestamp */}
                  <div
                    className={`text-[10px] mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-500'
                      }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-2 flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-[#00B75A] disabled:bg-gray-50"
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          className="w-9 h-9 flex items-center justify-center bg-[#00B75A] hover:bg-[#00A04A] disabled:bg-gray-300 rounded-full transition-colors flex-shrink-0"
          aria-label="Send message"
        >
          <IonIcon
            icon={send}
            className="text-white text-lg"
          />
        </button>
      </div>

      <style jsx>{`
        /* Scrollbar styling */
        div::-webkit-scrollbar {
          width: 4px;
        }
        
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 2px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #A0AEC0;
        }
      `}</style>
    </div>
  );
};

export default DeliveryChat;