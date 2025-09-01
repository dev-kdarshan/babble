# Babble - Real-time Chat Application

**Babble** is a real-time chat application built with **React.js** for the frontend and **Node.js/Express** for the backend. It allows users to chat one-to-one or in groups, with messages delivered instantly using **Socket.io** and data managed via **RESTful APIs**.

## Live Demo

Check out the live frontend here: [Babble Chat App](https://babble-chatapp.netlify.app/)

---

## Features

- Real-time one-to-one and group chat using Socket.io  
- User authentication (signup/login)  
- Responsive design for mobile, tablet, and desktop  
- RESTful APIs for chat and user data management  
- Easy integration between frontend and backend  

---

## Tech Stack

**Frontend:**
- React.js, HTML5, CSS3, JavaScript  
- Tailwind CSS, Bootstrap  
- Socket.io-client for real-time communication  
- Axios / Fetch API for RESTful requests  

**Backend:**
- Node.js, Express.js  
- MongoDB (or any database you use)  
- Socket.io for real-time messaging  
- JWT (JSON Web Tokens) for authentication  

---

## Installation
1. Clone repo:
```bash
git clone <babble_url>
```
### Frontend
1. 
```bash
cd babble-client
npm install
npm start
```
### Backend
2. 
```bash
cd babble-backend
npm install
nodemon server.js
```
## env
PORT=5000
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>

## Contact

Developer: [Darshan Khute](https://github.com/dev-kdarshan/)
Portfolio: [darshankhute.com](https://portfolio-darshankhute.netlify.app/)