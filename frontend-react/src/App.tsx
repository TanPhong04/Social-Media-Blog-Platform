import { useEffect, Suspense, lazy } from 'react';
import { Spinner } from './components/ui/Spinner';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const Reels = lazy(() => import('./pages/Reels'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/layout/AdminLayout';
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ArticleManagement = lazy(() => import('./pages/admin/ArticleManagement'));
const MyArticles = lazy(() => import('./pages/MyArticles'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Following = lazy(() => import('./pages/Following'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const Messages = lazy(() => import('./pages/Messages'));

function App() {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  // Lock body scroll when modal overlay is open
  useEffect(() => {
    if (backgroundLocation) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [backgroundLocation]);

  return (
    <>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
      <Routes location={backgroundLocation || location}>
        {/* Auth routes without MainLayout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Routes wrapped in MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/reels/:id" element={<Reels />} />
          
          {/* Placeholder Routes */}
          <Route path="/article/:slug" element={<ArticleDetail />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/following" element={<Following />} />
            <Route path="/my-articles" element={<MyArticles />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/articles" element={<ArticleManagement />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>

      {/* Modal Route Overlay */}
      {backgroundLocation && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"><Spinner size="lg" /></div>}>
        <Routes>
          <Route 
            path="/article/:slug" 
            element={
              <div 
                className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in"
                onClick={(e) => { if (e.target === e.currentTarget) navigate(-1); }}
                onKeyDown={(e) => { if (e.key === 'Escape') navigate(-1); }}
              >
                <div className="w-full max-w-[840px] mx-auto my-4 min-h-[calc(100vh-2rem)]" onClick={(e) => e.stopPropagation()}>
                  <ArticleDetail onClose={() => navigate(-1)} />
                </div>
              </div>
            } 
          />
        </Routes>
        </Suspense>
      )}
    </>
  );
}

export default App;
