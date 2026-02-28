import React, { useState, useEffect, useRef } from 'react';
import { getDeliveryMessages, sendDeliveryMessage } from '../utils/authApi';
import socketService from '../services/socket.service';
import { YummyText } from './YummyText';

const DeliveryChat = ({ deliveryId, currentUserRole = 'customer', className = '', maxHeight = '280px', canSend = true }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const listRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!deliveryId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getDeliveryMessages(deliveryId)
      .then((res) => {
        if (cancelled) return;
        const list = res?.data?.messages || res?.messages || [];
        setMessages(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [deliveryId]);

  useEffect(() => {
    if (!deliveryId) return;

    const joinDeliveryRoom = () => {
      socketService.emit('join:delivery', { deliveryId });
      socketService.joinRoom(deliveryId);
    };

    socketService.connect();
    // Join only when socket is connected (and re-join on reconnect) so the server receives join events
    const unsubConnect = socketService.onConnect(joinDeliveryRoom);

    const handleNewMessage = (data) => {
      if (!data?.message) return;
      setMessages((prev) => {
        if (prev.some((m) => (m._id || m.id) === (data.message._id || data.message.id))) return prev;
        return [...prev, data.message];
      });
    };
    socketService.on('delivery:chat:message', handleNewMessage);

    return () => {
      unsubConnect();
      socketService.off('delivery:chat:message', handleNewMessage);
      socketService.leaveDelivery(deliveryId);
      socketService.leaveRoom(deliveryId);
    };
  }, [deliveryId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!canSend) return;
    const text = (inputValue || '').trim();
    if (!text || !deliveryId || sending) return;
    setSending(true);
    setInputValue('');
    try {
      const res = await sendDeliveryMessage(deliveryId, text);
      const msg = res?.data?.message || res?.message;
      if (msg) {
        setMessages((prev) => {
          if (prev.some((m) => (m._id || m.id) === (msg._id || msg.id))) return prev;
          return [...prev, msg];
        });
      }
    } catch (err) {
      setInputValue(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  if (!deliveryId) return null;

  return (
    <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${className}`}>
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
        <YummyText className="text-sm font-medium text-[#0F172A]">Chat with {currentUserRole === 'customer' ? 'rider' : 'customer'}</YummyText>
      </div>
      <div
        ref={listRef}
        className="overflow-y-auto p-3 space-y-2"
        style={{ maxHeight }}
      >
        {loading ? (
          <p className="text-sm text-[#64748B]">Loading messages...</p>
        ) : messages.length === 0 && !canSend ? (
          <p className="text-sm text-[#64748B]">Chat will be available when a rider is assigned to this delivery.</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[#64748B]">No messages yet. Say hello!</p>
        ) : (
          messages.map((m) => {
            const isMe = m.senderRole === currentUserRole;
            return (
              <div
                key={m._id || m.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${isMe
                    ? 'bg-[#00B75A] text-white'
                    : 'bg-gray-100 text-[#0F172A]'
                    }`}
                >
                  {!isMe && (
                    <span className="text-xs font-medium text-[#64748B] block mb-0.5">
                      {m.senderRole === 'driver' ? 'Rider' : 'Customer'}
                      {m.sender?.fullName ? ` · ${m.sender.fullName}` : ''}
                    </span>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <span className={`text-xs mt-1 block ${isMe ? 'text-white/80' : 'text-[#64748B]'}`}>
                    {formatTime(m.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
        {canSend ? (
          <>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);

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
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00B75A] focus:border-transparent"
              maxLength={2000}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !inputValue.trim()}
              className="px-4 py-2 rounded-lg bg-[#00B75A] text-white text-sm font-medium hover:bg-[#00a352] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? '…' : 'Send'}
            </button>
          </>
        ) : (
          <p className="text-sm text-[#64748B] py-1 w-full">Chat is available once a rider has been assigned.</p>
        )}
      </form>
    </div>
  );
};

export default DeliveryChat;
