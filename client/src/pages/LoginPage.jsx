import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';

import ProfilePage from './ProfilePage';
import { useAuth } from '../../hooks';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const handleFormData = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const response = await auth.login(formData);
    if (response.success) {
      toast.success(response.message);
      setRedirect(true);
    } else {
      toast.error(response.message);
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
    return <Navigate to={'/'} />;
  }

  if (auth.user) {
    return <ProfilePage />;
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
            <h1 className="text-4xl font-light text-white mb-3 tracking-tight">Welcome Back</h1>
            <p className="text-[#C9A96E] text-sm font-light">Access your SpaceBook account</p>
          </div>

          {/* Premium Form */}
          <form className="space-y-6" onSubmit={handleFormSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-white text-sm font-light mb-3 tracking-wide">EMAIL ADDRESS</label>
              <input
                name="email"
                type="email"
                placeholder="your@example.com"
                value={formData.email}
                onChange={handleFormData}
                className="luxury-input"
                required
              />
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

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-[#C9A96E]/50 bg-white/10" />
                <span className="text-white/60 font-light">Remember me</span>
              </label>
              <a href="#" className="text-[#C9A96E] hover:text-[#D4B896] transition font-light">Forgot password?</a>
            </div>

            {/* Premium CTA Button */}
            <button type="submit" disabled={loading} className="luxury-button mt-8 w-full relative">
              <span className="font-light tracking-wider">
                {loading ? 'LOGGING IN...' : 'LOG IN'}
              </span>
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
            New to SpaceBook?{' '}
            <Link className="text-[#C9A96E] hover:text-[#D4B896] font-medium transition" to={'/signup'}>
              Create an account
            </Link>
          </p>

          {/* Legal */}
          <p className="text-center text-white/40 text-xs mt-8 leading-relaxed font-light">
            By continuing, you agree to our{' '}
            <a href="#" className="text-[#C9A96E]/80 hover:text-[#D4B896] transition">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-[#C9A96E]/80 hover:text-[#D4B896] transition">Privacy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
