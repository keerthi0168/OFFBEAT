import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../../hooks';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const auth = useAuth();

  const handleFormData = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const response = await auth.register(formData);
    if (response.success) {
      toast.success(response.message);
      setRedirect(true);
    } else {
      // Check if it's a duplicate email error
      if (response.message === 'This email ID is already used') {
        setErrors({ email: response.message });
        toast.error(response.message);
      } else {
        toast.error(response.message);
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async (credential) => {
    setLoading(true);
    const response = await auth.googleLogin(credential);
    if (response.success) {
      toast.success(response.message);
      setRedirect(true);
    } else {
      toast.error(response.message);
    }
    setLoading(false);
  };

  if (redirect) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#1F8A8A]" style={{backgroundImage: 'url(data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)'}}>
      <div className="w-full max-w-lg">
        {/* Premium Header */}
        <div className="text-center mb-12">
          <div className="inline-block">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#D4B896] flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-[#0B1220]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </div>
              <h2 className="text-3xl font-light text-white tracking-tight">SpaceBook</h2>
            </div>
          </div>
          <p className="text-[#C9A96E] text-sm font-light tracking-wide">FIND YOUR RENTAL SPACE</p>
        </div>

        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-10 shadow-2xl">
          {/* Card Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-light text-white mb-3 tracking-tight">Join SpaceBook</h1>
            <p className="text-[#C9A96E] text-sm font-light">Sign up to find your ideal rental space</p>
          </div>

          {/* Premium Form */}
          <form className="space-y-6" onSubmit={handleFormSubmit}>
            {/* Name Field */}
            <div>
              <label className="block text-white text-sm font-light mb-3 tracking-wide">FULL NAME</label>
              <input
                name="name"
                type="text"
                placeholder="Your Full Name"
                value={formData.name}
                onChange={handleFormData}
                className="luxury-input"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-white text-sm font-light mb-3 tracking-wide">EMAIL ADDRESS</label>
              <input
                name="email"
                type="email"
                placeholder="your@example.com"
                value={formData.email}
                onChange={handleFormData}
                className={`luxury-input ${errors.email ? 'error' : ''}`}
                required
              />
              {errors.email && (
                <p className="mt-2 text-red-500/70 text-sm font-light flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-white text-sm font-light mb-3 tracking-wide">PASSWORD</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••••••••••"
                value={formData.password}
                onChange={handleFormData}
                className="luxury-input"
                required
              />
            </div>

            {/* Premium CTA Button */}
            <button type="submit" className="luxury-button mt-8 w-full relative" disabled={loading}>
              <span className="font-light tracking-wider">{loading ? 'CREATING ACCOUNT...' : 'GET STARTED'}</span>
              {!loading && <span className="absolute right-6 text-[#C9A96E]">→</span>}
            </button>
          </form>

          {/* Google Login */}
          <div className="flex justify-center mb-8 pt-2">
            <div className="w-full max-w-xs">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  handleGoogleLogin(credentialResponse.credential);
                }}
                onError={() => {
                  console.log('Login Failed');
                }}
                text="continue_with"
                width="100%"
              />
            </div>
          </div>

          {/* Footer Links */}
          <p className="text-center text-white/60 text-sm font-light">
            Already registered?{' '}
            <Link className="text-[#C9A96E] hover:text-[#D4B896] font-medium transition" to={'/login'}>
              Log in here
            </Link>
          </p>

          {/* Legal */}
          <p className="text-center text-white/40 text-xs mt-8 leading-relaxed font-light">
            By signing up, you agree to our{' '}
            <a href="#" className="text-[#C9A96E]/80 hover:text-[#D4B896] transition">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-[#C9A96E]/80 hover:text-[#D4B896] transition">Privacy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
