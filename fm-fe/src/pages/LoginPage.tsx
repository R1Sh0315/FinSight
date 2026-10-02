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

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-dash-card p-10 rounded-xl border border-dash-border shadow-lg w-full max-w-md flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold mb-2 text-dash-text-primary">Welcome to FinSight</h1>
        <p className="text-[14px] text-dash-text-secondary mb-8">Sign in with your Google account to access your financial dashboard</p>

        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log('Login Failed')}
        />
      </div>
    </div>
  );
}
