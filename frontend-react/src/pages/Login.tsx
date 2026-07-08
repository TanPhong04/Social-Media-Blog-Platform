import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';
import { LogIn } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      // The implicit flow gives us access_token, but let's assume we use it or we need id_token?
      // Wait, useGoogleLogin without flow='auth-code' gives an access_token.
      // But our backend expects an idToken. We need to fetch user info or use credentialResponse from GoogleLogin component.
      // Wait, let's use the standard component if we need idToken.
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google Login failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response: any = await axiosClient.post('/auth/login', { email, password });
      await login(response.accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background px-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-app border border-gray-800 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <LogIn className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-8 text-text-primary">Welcome Back</h2>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-md text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-background border border-gray-700 text-text-primary rounded-md px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full bg-background border border-gray-700 text-text-primary rounded-md px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-md transition-colors flex justify-center items-center"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="border-b border-gray-700 w-1/5 lg:w-1/4"></span>
          <span className="text-xs text-center text-text-secondary uppercase">or login with</span>
          <span className="border-b border-gray-700 w-1/5 lg:w-1/4"></span>
        </div>

        <div className="mt-6 flex justify-center">
          <div id="google-btn-wrapper" className="flex justify-center w-full">
             <GoogleLoginWrapper setError={setError} login={login} navigate={navigate} />
          </div>
        </div>

        <p className="mt-6 text-center text-text-secondary text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

// Wrap GoogleLogin in a component to avoid using hooks in wrong place
import { GoogleLogin } from '@react-oauth/google';

function GoogleLoginWrapper({ setError, login, navigate }: any) {
  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        try {
          const res: any = await axiosClient.post('/auth/google-login', { 
            idToken: credentialResponse.credential 
          });
          await login(res.accessToken);
          navigate('/');
        } catch (err: any) {
          setError(err.response?.data?.message || 'Google Login failed.');
        }
      }}
      onError={() => {
        setError('Google Login was unsuccessful');
      }}
    />
  );
}
