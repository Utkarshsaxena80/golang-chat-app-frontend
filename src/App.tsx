import React, { useState, useEffect, useRef } from 'react';
import { Users, Send, Plus, LogIn, MessageCircle, Copy, Check } from 'lucide-react';

interface Message {
  username: string;
  message: string;
  timestamp?: number;
}

interface ChatState {
  socket: WebSocket | null;
  roomId: string | null;
  isConnected: boolean;
  messages: Message[];
}

function App() {
  const [chatState, setChatState] = useState<ChatState>({
    socket: null,
    roomId: null,
    isConnected: false,
    messages: []
  });
  
  const [username, setUsername] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    enterRoom(newRoomId);
  };

  const joinRoom = () => {
    if (!roomInput.trim()) {
      alert("Please enter a valid Room ID.");
      return;
    }
    enterRoom(roomInput.trim());
  };

  const enterRoom = (room: string) => {
    const socket = new WebSocket(`ws://localhost:8080/ws?room_id=${room}`);

    socket.onopen = () => {
      console.log("Connected to room:", room);
      setChatState(prev => ({
        ...prev,
        socket,
        roomId: room,
        isConnected: true,
        messages: []
      }));
    };

    socket.onmessage = (event) => {
      const msg: Message = JSON.parse(event.data);
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, { ...msg, timestamp: Date.now() }]
      }));
    };

    socket.onclose = () => {
      setChatState(prev => ({
        ...prev,
        socket: null,
        isConnected: false
      }));
      alert("Disconnected from server.");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      alert("Failed to connect to the chat server.");
    };
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !chatState.socket) return;

    const messageData = {
      username: username || "Anonymous",
      message: messageInput.trim(),
      room_id: chatState.roomId
    };

    chatState.socket.send(JSON.stringify(messageData));
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatState.isConnected) {
        sendMessage();
      } else {
        joinRoom();
      }
    }
  };

  const copyRoomId = async () => {
    if (chatState.roomId) {
      await navigator.clipboard.writeText(chatState.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const leaveRoom = () => {
    if (chatState.socket) {
      chatState.socket.close();
    }
    setChatState({
      socket: null,
      roomId: null,
      isConnected: false,
      messages: []
    });
    setRoomInput('');
  };

  if (!chatState.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Go Chat</h1>
            <p className="text-gray-600">Connect with others in real-time</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="space-y-6">
              <button
                onClick={createRoom}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
              >
                <Plus className="w-5 h-5" />
                Create New Room
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="roomInput" className="block text-sm font-medium text-gray-700 mb-2">
                    Room ID
                  </label>
                  <input
                    type="text"
                    id="roomInput"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter room ID to join"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  />
                </div>
                <button
                  onClick={joinRoom}
                  disabled={!roomInput.trim()}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200 border border-gray-200 shadow-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-5 h-5" />
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Go Chat</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Room: {chatState.roomId}</span>
                  <button
                    onClick={copyRoomId}
                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                    title="Copy room ID"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={leaveRoom}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 flex-1 flex flex-col overflow-hidden">
          {/* Username Input */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <label htmlFor="username" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Your name:
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatState.messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              chatState.messages.map((msg, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {msg.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {msg.username}
                        </span>
                        {msg.timestamp && (
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 break-words">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;