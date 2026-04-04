import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import EditPost from './pages/EditPost';
import Chat from './pages/Chat';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/create-post" element={<CreatePost />} />
      <Route path="/edit-post/:id" element={<EditPost />} />
      <Route path="/post/:id" element={<PostDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/user/:userId" element={<UserProfile />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/chats/c/:id" element={<Chat />} />
    </Routes>
  );
}

export default App;
