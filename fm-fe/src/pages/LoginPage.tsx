import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLoginGoogleMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login] = useLoginGoogleMutation();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      // Send the token to the backend
      const result = await login(credentialResponse.credential).unwrap();
      dispatch(setCredentials({ user: result.data.user, token: result.data.token }));
      navigate('/');
    } catch (err) {
      console.error('Failed to log in:', err);
    }
  };

  const mockLogin = async () => {
    try {
      const result = await login("mock_token").unwrap();
      dispatch(setCredentials({ user: result.data.user, token: result.data.token }));
      navigate('/');
    } catch (err) {
      console.error('Failed to mock log in:', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-dash-card p-10 rounded-xl border border-dash-border shadow-lg w-full max-w-md flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold mb-2 text-dash-text-primary">Welcome Back</h1>
        <p className="text-[14px] text-dash-text-secondary mb-8">Log in to view your dashboard</p>
        
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log('Login Failed')}
        />

        <div className="mt-8 border-t border-dash-border w-full pt-6">
          <p className="text-[13px] text-dash-text-muted mb-4">No Google Client ID configured?</p>
          <button 
            onClick={mockLogin}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-medium rounded-lg transition-colors"
          >
            Mock Login (Dev Only)
          </button>
        </div>
      </div>
    </div>
  );
}
