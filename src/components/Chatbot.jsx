import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // 💡 Instruction and context (replace with dynamic data later)
  const instruction = 'You are a helpful assistant that uses the provided context to answer questions.';
  const contextText = JSON.stringify({
    company: 'Acme Corp',
    services: ['laundry', 'dry cleaning', 'delivery'],
    policy: '24-hour turnaround',
    pricing: { wash: '$5', dry_clean: '$10' }
  });

  // 🔁 Toggle chatbot window
  const toggleChat = async () => {
    const newState = !isOpen;
    setIsOpen(newState);

    if (!newState) {
      // Closing: reset
      setMessages([]);
      setSessionId(null);
      setInput('');
    } else {
      // Opening: auto upload context
      const session = await uploadContext(instruction, contextText);
      if (session) {
        setSessionId(session);
        setMessages([
          { sender: 'bot', text: 'Hi! I’m ready to assist you based on the context provided.' }
        ]);
      } else {
        setMessages([
          { sender: 'bot', text: '❌ Failed to start chat session. Check console for details.' }
        ]);
      }
    }
  };

  // 🔄 Upload context via JSON body
  const uploadContext = async (instruction, contextText) => {
    try {
      const response = await fetch(
        `https://ai-chatbot-0mmy.onrender.com/gemini/upload-context?instruction=${encodeURIComponent(instruction)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ context: contextText })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      if (!data.sessionId) {
        console.error('No sessionId in response:', data);
        return null;
      }

      return data.sessionId;
    } catch (error) {
      console.error('uploadContext error:', error);
      return null;
    }
  };

  // 💬 Send a chat message
  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput('');

    try {
      const response = await fetch(
        `https://ai-chatbot-0mmy.onrender.com/gemini/chat?prompt=${encodeURIComponent(input)}&sessionId=${encodeURIComponent(sessionId)}`,
        {
          method: 'POST'
        }
      );

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: data.response || '🤖 No response from AI.' }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '⚠️ Error contacting the chatbot server.' }
      ]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbox">
          <div className="chatbox-header">
            <h4>AI Chatbot</h4>
            <button className="close-btn" onClick={toggleChat}>×</button>
          </div>

          <div className="chatbox-body">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="chat-message bot">Typing...</div>}
            <div ref={chatEndRef} />
          </div>

          <div className="chatbox-footer">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!sessionId}
            />
            <button onClick={sendMessage} disabled={!sessionId || loading}>Send</button>
          </div>
        </div>
      )}

      <button className="chatbot-toggle-btn" onClick={toggleChat}>💬</button>
    </div>
  );
};

export default Chatbot;
