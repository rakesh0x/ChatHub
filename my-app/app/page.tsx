"use client"

import { useEffect, useRef, useState } from "react";
import { IoMdSend } from "react-icons/io";

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  type: 'sent' | 'received';
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // connection with the ws server
    ws.current = new WebSocket("ws://localhost:8080");

    // listening for a ongoing connection
    ws.current.onopen = () => {
      console.log("Websocket is connected");
      setIsConnected(true);
    }
    
    // received message from the server
    ws.current.onmessage = (e) => {
      console.log("Received", e.data);

      // Check if this is an echo of our own message
      const lastSentMessage = messages[messages.length - 1];
      if (lastSentMessage && lastSentMessage.text === e.data && lastSentMessage.type === 'sent') {
        return; // Ignore this echo
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        text: e.data,
        timestamp: new Date(),
        type: 'received'
      };
      setMessages(prev => [...prev, newMessage]);
    }

    // log when there is any error
    ws.current.onerror = (error) => {
      console.log("error connecting to the ws server", error);
      setIsConnected(false);
    }

    ws.current.onclose = () => {
      setIsConnected(false);
    }

    return () => {
      ws.current?.close();
    };
  }, [])

  const handlesend = () => {
    if (!message.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const messageId = Date.now().toString();

    const sentMessage: Message = {
      id: messageId,
      text: message,
      timestamp: new Date(),
      type: 'sent'
    };
    setMessages(prev => [...prev, sentMessage]);

    // Send message with ID to server
    ws.current.send(JSON.stringify({ id: messageId, text: message }));
    setMessage("");
  }
  
  const handlekeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlesend();
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">ChatHub</h1>
              <p className="text-sm text-gray-500">Real-time messaging</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-gray-400 text-sm">Start a conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                    msg.type === 'sent'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    msg.type === 'sent' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-gray-50"
              placeholder="Type your message..."
              onKeyDown={handlekeydown}
              disabled={!isConnected}
            />
            <button
              onClick={handlesend}
              disabled={!message.trim() || !isConnected}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 ${
                message.trim() && isConnected
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <IoMdSend size={20} />
            </button>
          </div>
        </div>
        
        {!isConnected && (
          <div className="mt-2 text-center">
            <p className="text-sm text-red-500">Connection lost. Trying to reconnect...</p>
          </div>
        )}
      </div>
    </div>
  );
}