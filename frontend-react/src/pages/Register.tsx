import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axiosClient.post('/auth/send-otp', { email });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gửi OTP thất bại. Email có thể đã được đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axiosClient.post('/auth/register', { displayName, email, password, otp });
      const response: any = await axiosClient.post('/auth/login', { email, password });
      await login(response.accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background px-4 py-8">
      <div className="w-full max-w-md bg-surface p-8 rounded-app border border-gray-800 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <UserPlus className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-8 text-text-primary">Tạo Tài Khoản Mới</h2>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-md text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Tên Hiển Thị</label>
              <input
                type="text"
                required
                className="w-full bg-background border border-gray-700 text-text-primary rounded-md px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nguyễn Văn A"
                maxLength={80}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Địa Chỉ Email</label>
              <input
                type="email"
                required
                className="w-full bg-background border border-gray-700 text-text-primary rounded-md px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@example.com"
                maxLength={320}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Mật Khẩu</label>
              <input
                type="password"
                required
                className="w-full bg-background border border-gray-700 text-text-primary rounded-md px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                maxLength={72}
              />
              <p className="text-xs text-text-secondary mt-2">Phải có ít nhất 8 ký tự.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-md transition-colors flex justify-center items-center"
            >
              {loading ? 'Đang gửi OTP...' : 'Tiếp tục'}
            </button>
            
            <div className="mt-6 flex items-center justify-between">
              <span className="border-b border-gray-700 w-1/5 lg:w-1/4"></span>
              <span className="text-xs text-center text-text-secondary uppercase">hoặc đăng ký bằng</span>
              <span className="border-b border-gray-700 w-1/5 lg:w-1/4"></span>
            </div>
            
            <div className="mt-6 flex justify-center">
              <div className="flex justify-center w-full">
                 <GoogleLoginWrapper setError={setError} login={login} navigate={navigate} />
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <p className="text-sm text-text-secondary text-center mb-6">
              Chúng tôi đã gửi mã xác thực 6 số đến <strong>{email}</strong>.
            </p>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Mã OTP</label>
              <input
                type="text"
                required
                className="w-full bg-background border border-gray-700 text-text-primary rounded-md px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-center tracking-widest text-lg"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-md transition-colors flex justify-center items-center"
            >
              {loading ? 'Đang xác thực...' : 'Xác thực và Đăng ký'}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-primary text-sm hover:underline"
              >
                Quay lại
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-text-secondary text-sm">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

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
          setError(err.response?.data?.message || 'Đăng nhập Google thất bại.');
        }
      }}
      onError={() => {
        setError('Đăng nhập Google không thành công');
      }}
    />
  );
}
