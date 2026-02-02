import React, { useState, useEffect, useRef, useMemo } from 'react';
import { IonIcon } from '@ionic/react';
import { send } from 'ionicons/icons';
import { YummyText } from '../../components/YummyText';
import socketService from '../../services/socket.service';
import { getCookie, setCookie, setJSONCookie, getJSONCookie } from '../../utils/cookies';
import { sendDeliveryMessage, getDeliveryMessages } from '../../utils/authApi';

/**
 * DeliveryChat Component
 * Real-time chat between customer and rider for a specific delivery
 * 
 * @param {string} deliveryId 
 * @param {string} currentUserRole 
 * @param {string} className 
 * @param {string} maxHeight 
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
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  // Get current user info (memoized to prevent unnecessary re-renders)
  const currentUser = useMemo(() => {
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
  }, [currentUserRole]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  
  useEffect(() => {
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

    // Load messages from API
    const loadMessages = async () => {
      if (!deliveryId) return;

      setLoading(true);
      try {
        console.log('[SmartRideChat] Loading messages from API for delivery:', deliveryId);
        const res = await getDeliveryMessages(deliveryId);
        const messageList = res?.data?.messages || res?.messages || [];

        if (Array.isArray(messageList)) {
          const formattedMessages = messageList.map(m => ({
            id: m._id || m.id,
            text: m.content || m.message || m.text,
            sender: m.senderRole || m.role,
            senderName: m.senderName || m.sender?.fullName || 'Unknown',
            timestamp: m.createdAt || m.timestamp,
            senderId: m.senderId || m.sender?._id
          }));

          setMessages(formattedMessages);
          console.log('[SmartRideChat] Loaded', formattedMessages.length, 'messages');
        }
      } catch (e) {
        console.error('[SmartRideChat] Failed to load messages:', e);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [deliveryId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh messages when not typing (polling fallback)
  useEffect(() => {
    if (!deliveryId || isTyping) return;

    const refreshMessages = async () => {
      try {
        const res = await getDeliveryMessages(deliveryId);
        const messageList = res?.data?.messages || res?.messages || [];

        if (Array.isArray(messageList)) {
          const formattedMessages = messageList.map(m => ({
            id: m._id || m.id,
            text: m.content || m.message || m.text,
            sender: m.senderRole || m.role,
            senderName: m.senderName || m.sender?.fullName || 'Unknown',
            timestamp: m.createdAt || m.timestamp,
            senderId: m.senderId || m.sender?._id
          }));

          setMessages(formattedMessages);
        }
      } catch (e) {
        console.error('[SmartRideChat] Failed to refresh messages:', e);
      }
    };

    // Poll every 3 seconds when not typing
    const interval = setInterval(refreshMessages, 3000);

    return () => clearInterval(interval);
  }, [deliveryId, isTyping]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Connect to socket and listen for messages
  useEffect(() => {
    if (!deliveryId) return;

    console.log('[SmartRideChat] Connecting to socket for delivery:', deliveryId);

    const joinDeliveryRoom = () => {
      console.log('[SmartRideChat] Joining delivery room:', deliveryId);
      socketService.emit('join:delivery', { deliveryId });
      socketService.joinRoom(deliveryId);
    };

    socketService.connect();

    // Join only when socket is connected (and re-join on reconnect)
    const unsubConnect = socketService.onConnect(joinDeliveryRoom);

    // Listen for incoming messages
    const handleIncomingMessage = (data) => {
      console.log('[SmartRideChat] Received message event:', data);

      // Check if message is for this delivery
      if (data?.deliveryId !== deliveryId && data?.delivery !== deliveryId) {
        console.log('[SmartRideChat] Message not for this delivery, ignoring');
        return;
      }

      // Extract message from data
      const messageContent = data?.message || data;

      // Don't add if it's our own message (check by sender ID only)
      const messageSenderId = messageContent.senderId || messageContent.sender?._id || messageContent.sender?.id;
      if (messageSenderId && messageSenderId === currentUser.id) {
        console.log('[SmartRideChat] Own message, skipping');
        return;
      }

      const newMsg = {
        id: messageContent._id || messageContent.id || Date.now(),
        text: messageContent.content || messageContent.message || messageContent.text,
        sender: messageContent.senderRole || messageContent.role || 'unknown',
        senderName: messageContent.senderName || messageContent.sender?.fullName || 'Unknown',
        timestamp: messageContent.createdAt || messageContent.timestamp || new Date().toISOString(),
        senderId: messageContent.senderId || messageContent.sender?._id
      };

      console.log('[SmartRideChat] Adding incoming message:', newMsg);
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });
    };

    socketService.on('delivery:chat:message', handleIncomingMessage);

    return () => {
      console.log('[SmartRideChat] Cleaning up socket listeners');
      unsubConnect();
      socketService.off('delivery:chat:message', handleIncomingMessage);
      socketService.leaveDelivery(deliveryId);
      socketService.leaveRoom(deliveryId);
    };
  }, [deliveryId, currentUser.id, currentUser.role]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setSending(true);
    setNewMessage(''); // Clear input immediately for better UX

    try {
      console.log('[SmartRideChat] Sending message via API:', messageText);

      // Send via API (which will broadcast via socket to all connected clients)
      const res = await sendDeliveryMessage(deliveryId, messageText);
      const savedMessage = res?.data?.message || res?.message;

      if (savedMessage) {
        console.log('[SmartRideChat] Message sent successfully:', savedMessage);

        // Add to local state (avoid duplicates)
        setMessages(prev => {
          const msgId = savedMessage._id || savedMessage.id;
          if (prev.some(m => m.id === msgId)) {
            return prev;
          }

          const newMsg = {
            id: msgId,
            text: savedMessage.content || savedMessage.message || savedMessage.text,
            sender: savedMessage.senderRole || currentUser.role,
            senderName: savedMessage.senderName || currentUser.name,
            timestamp: savedMessage.createdAt || savedMessage.timestamp || new Date().toISOString(),
            senderId: savedMessage.senderId || currentUser.id
          };

          return [...prev, newMsg];
        });
      }
    } catch (e) {
      console.error('[SmartRideChat] Failed to send message:', e);
      // Restore the message in input on error
      setNewMessage(messageText);
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
          onChange={(e) => {
            setNewMessage(e.target.value);

            // Mark as typing
            setIsTyping(true);

            // Clear existing timeout
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to mark as not typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 2000);
          }}
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