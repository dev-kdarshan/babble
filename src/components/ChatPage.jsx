import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/chatpage.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

const ChatPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const msgEndRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!token || !storedUser) {
      localStorage.clear();
      return navigate('/');
    }

    setUser(storedUser);
    const savedFriends = JSON.parse(localStorage.getItem('friends')) || [];
    setFriends(savedFriends);
  }, [navigate]);

  useEffect(() => {
    socket.on('receive-message', ({ from, to, message }) => {
      if (to === user?.email || from === user?.email) {
        setMessages((prev) => [...prev, { from, message }]);
      }
    });
  }, [user]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputMsg || !selectedFriend) return;

    const payload = {
      from: user.email,
      to: selectedFriend.email,
      message: inputMsg,
    };

    socket.emit('send-message', payload);
    setMessages((prev) => [...prev, { from: user.email, message: inputMsg }]);
    setInputMsg('');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleAddFriend = () => {
    const name = prompt('Enter friend name:');
    const email = prompt('Enter friend email:');
    if (!name || !email) return alert('Name and Email are required.');

    const newFriend = { name, email };
    const updatedFriends = [...friends, newFriend].filter(
      (v, i, a) => a.findIndex(t => t.email === v.email) === i
    );

    setFriends(updatedFriends);
    localStorage.setItem('friends', JSON.stringify(updatedFriends));
  };

  const handleDeleteFriend = (email) => {
    const updatedFriends = friends.filter(f => f.email !== email);
    setFriends(updatedFriends);
    localStorage.setItem('friends', JSON.stringify(updatedFriends));
    if (selectedFriend?.email === email) {
      setSelectedFriend(null);
      setMessages([]);
    }
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="profile-section">
          <img src="/user-avatar.png" alt="Profile" className="profile-pic" />
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
                setMessages([]);
              }}
            >
              <div className="friend-info">
                <img src="/friend-avatar.png" alt="Friend" className="friend-pic" />
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
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-bubble ${msg.from === user.email ? 'sent' : 'received'}`}
                >
                  {msg.message}
                </div>
              ))}
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
