import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ✅ For redirection
import '../styles/loginRegister.css';

const LoginRegisterPage = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [showCarouselText, setShowCarouselText] = useState(true);
  const navigate = useNavigate(); // ✅ Initialize navigation

  // Refs for form fields
  const nameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const loginEmailRef = useRef();
  const loginPasswordRef = useRef();

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setTimeout(() => setShowCarouselText(false), 5000);
    }
  }, []);

  const toggleForm = () => setIsLogin((prev) => !prev);

  // ✅ Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    const name = nameRef.current.value;
    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    try {
      const response = await axios.post('http://localhost:5000/api/register', {
        name, email, password,
      });
      alert(response.data.message);
      setIsLogin(true); // Switch to login
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed');
    }
  };

  // ✅ Login handler
const handleLogin = async (e) => {
  e.preventDefault();
  const email = loginEmailRef.current.value;
  const password = loginPasswordRef.current.value;

  try {
    const response = await axios.post('http://localhost:5000/api/login', {
      email,
      password,
    });

    alert(response.data.message);

    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token); // ✅ Save JWT token

      navigate('/chat'); // ✅ Redirect to ChatPage
    } else {
      alert('Login failed: No token received');
    }
  } catch (error) {
    alert(error.response?.data?.error || 'Login failed');
  }
};


  return (
    <div className="container-fluid main-container">
      <div className="card d-flex flex-column flex-md-row">

        {/* Carousel Section */}
        <div className="carousel-section col-md-6">
          <div id="carouselExample" className="carousel slide" data-bs-ride="carousel" data-bs-interval="2000">
            <div className="carousel-inner">
              <div className="carousel-item active">
                <img className="object-cover w-100 h-50" src="https://img.freepik.com/premium-vector/chat-concept-woman-chatting-with-friends-online-social-networking-chat-video-news-messages-search-friends-vector-illustration-flat_186332-1139.jpg" alt="Image 1" />
              </div>
              <div className="carousel-item">
                <img className="object-cover w-100 h-50" src="https://img.freepik.com/free-vector/chat-conversation-mobile-phone-screen-tiny-people-group-persons-chatting-messenger-flat-vector-illustration-social-media-community-concept-banner-website-design-landing-web-page_74855-21724.jpg" alt="Image 2" />
              </div>
              <div className="carousel-item">
                <img className="object-cover w-100 h-50" src="https://d2d3qesrx8xj6s.cloudfront.net/img/screenshots/nofeat-efe12d16f114a699d7dee5fc3eef3a128124bc1f.jpg" alt="Image 3" />
              </div>
            </div>
          </div>

          {showCarouselText && (
            <div className="carousel-text">
              <h3 className="appName">babble,</h3>
              <p className="appTagline">your gossips are private!!</p>
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="col-md-6 form-container bg-light">
          {!isLogin ? (
            <div className="p-4" id="registration-form">
              <h2 className="heading">New User Registration</h2>
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input type="text" className="form-control" id="name" placeholder="Enter your name" ref={nameRef} />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input type="email" className="form-control" id="email" placeholder="Enter your email" ref={emailRef} />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input type="password" className="form-control" id="password" placeholder="Enter your password" ref={passwordRef} />
                </div>
                <button type="submit" className="login-button btn btn-primary">Register</button>
                <p className="text-center mt-3">
                  Already a user? <button type="button" className="btn btn-link p-0" onClick={toggleForm}>Go to Login</button>
                </p>
              </form>
            </div>
          ) : (
            <div className="p-4" id="login-form">
              <h2 className="heading">Login</h2>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label htmlFor="login-email" className="form-label">Email</label>
                  <input type="email" className="form-control" id="login-email" placeholder="Enter your email" ref={loginEmailRef} />
                </div>
                <div className="mb-3">
                  <label htmlFor="login-password" className="form-label">Password</label>
                  <input type="password" className="form-control" id="login-password" placeholder="Enter your password" ref={loginPasswordRef} />
                </div>
                <button type="submit" className="login-button btn btn-primary">Login</button>
                <p className="text-center mt-3">
                  New here? <button type="button" className="btn btn-link p-0" onClick={toggleForm}>Register</button>
                </p>
              </form>
              <hr />
              <div className="social-buttons d-flex justify-content-center">
                {/* You can add social buttons here */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterPage;
