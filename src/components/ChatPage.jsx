import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import '../styles/chatpage.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ChatPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [inputMsg, setInputMsg] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const msgEndRef = useRef();
  const API = process.env.REACT_APP_BASE_API_URL;

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '';
    const words = name.trim().split(' ');
    return words.length === 1 && words[0]
      ? words[0][0].toUpperCase()
      : (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getColorFromName = (name) => {
    if (!name || typeof name !== 'string') return '#888';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
  };

  // Initialize socket connection
  const [socket, setSocket] = useState(null);

  // Initialize user and socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!token || !storedUser) {
      localStorage.clear();
      return navigate('/');
    }

    setUser(storedUser);

    // Initialize socket connection
    const newSocket = io(`${API}`, {
      auth: { token },
      autoConnect: false,
    });

    newSocket.auth.token = token;
    newSocket.connect();
    setSocket(newSocket);

    const fetchFriends = async (email) => {
      try {
        const res = await axios.post(`${API}/api/get-friends`, {
          userEmail: email,
        });
        setFriends(res.data.friends);
      } catch (err) {
        console.error('Error loading friends:', err);
      }
    };

    fetchFriends(storedUser.email);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [navigate]);

  // Socket message handler
  useEffect(() => {
    if (!socket || !user) return;

    const handleReceiveMessage = ({ from, to, message, chatId }) => {
      // Only process messages that involve the current user
      if (to === user.email || from === user.email) {
        setChatMessages((prev) => {
          const prevMsgs = prev[chatId] || [];
          
          // Check for duplicates (avoid adding same message twice)
          const isDuplicate = prevMsgs.some(msg => 
            msg.from === from && 
            msg.message === message && 
            Math.abs(new Date() - new Date(msg.timestamp || 0)) < 2000 // 2 second window
          );
          
          if (isDuplicate) return prev;
          
          return {
            ...prev,
            [chatId]: [...prevMsgs, { 
              from, 
              message, 
              timestamp: new Date().toISOString() 
            }],
          };
        });
      }
    };

    socket.on('receive-message', handleReceiveMessage);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
    };
  }, [user]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedFriend]);

  const fetchChatMessages = async (chatId) => {
    setIsLoadingMessages(true);
    try {
      const res = await axios.post(`${API}/api/get-chat-messages`, {
        chatId,
      });

      setChatMessages((prev) => ({
        ...prev,
        [chatId]: res.data.messages || [],
      }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setChatMessages((prev) => ({
        ...prev,
        [chatId]: [],
      }));
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSend = () => {
    if (!inputMsg.trim() || !selectedFriend) return;

    const payload = {
      from: user.email,
      to: selectedFriend.email,
      message: inputMsg.trim(),
    };

    socket.emit('send-message', payload);
    setInputMsg('');
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    localStorage.clear();
    navigate('/');
  };

  const handleAddFriend = async () => {
    const name = prompt('Enter friend name:');
    const email = prompt('Enter friend email:');
    if (!name || !email) return alert('Name and Email are required.');

    try {
      const res = await axios.post(`${API}/api/add-friend`, {
        userEmail: user.email,
        friendEmail: email,
        friendName: name,
      });

      const chatId = res.data.chatId;
      const newFriend = { name, email, chatId };
      
      const updatedFriends = [...friends, newFriend].filter(
        (v, i, a) => a.findIndex((t) => t.email === v.email) === i
      );
      
      setFriends(updatedFriends);
      alert('Friend added successfully!');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Error adding friend.');
    }
  };

  const handleDeleteFriend = (email) => {
    const updatedFriends = friends.filter((f) => f.email !== email);
    setFriends(updatedFriends);

    if (selectedFriend?.email === email) {
      setSelectedFriend(null);
    }
  };

  const getCurrentMessages = () => {
    return selectedFriend?.chatId
      ? chatMessages[selectedFriend.chatId] || []
      : [];
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="profile-section">
          <div
            className="profile-pic initials-avatar"
            style={{ backgroundColor: getColorFromName(user?.name) }}
          >
            {getInitials(user?.name)}
          </div>
          <p className="username">{user?.name}</p>
          <div className="icon-buttons">
            <button title="Add Friend" onClick={handleAddFriend}>
              <i className="bi bi-person-plus-fill"></i>
            </button>
            <button title="Logout" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>

        <div className="friends-list">
          {friends.map((friend, idx) => (
            <div
              key={idx}
              className={`friend-item ${selectedFriend?.email === friend.email ? 'active' : ''}`}
              onClick={() => {
                setSelectedFriend(friend);
                fetchChatMessages(friend.chatId);
              }}
            >
              <div className="friend-info">
                <div
                  className="friend-pic initials-avatar"
                  style={{ backgroundColor: getColorFromName(friend.name) }}
                >
                  {getInitials(friend.name)}
                </div>
                <span>{friend.name}</span>
              </div>
              <button
                className="remove-btn"
                title="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFriend(friend.email);
                }}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-section">
        <div className="chat-header">
          <h4>{selectedFriend ? selectedFriend.name : 'Welcome to Babble'}</h4>
          {!selectedFriend && (
            <div className="welcome-add-btn">
              <button onClick={handleAddFriend} className="btn btn-outline-primary mt-3">
                + Add New Friend
              </button>
            </div>
          )}
        </div>

        <div className="chat-body">
          {selectedFriend ? (
            <>
              {isLoadingMessages ? (
                <div className="loading-text">Loading messages...</div>
              ) : (
                getCurrentMessages().map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-bubble ${msg.from === user.email ? 'sent' : 'received'}`}
                  >
                    {msg.message}
                  </div>
                ))
              )}
              <div ref={msgEndRef} />
            </>
          ) : (
            <div className="welcome-text">Select a friend to start chatting!</div>
          )}
        </div>

        {selectedFriend && (
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type something..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;