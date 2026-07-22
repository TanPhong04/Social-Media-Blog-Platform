import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Search from './pages/Search';
import Reels from './pages/Reels';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import ArticleManagement from './pages/admin/ArticleManagement';
import MyArticles from './pages/MyArticles';
import Bookmarks from './pages/Bookmarks';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Following from './pages/Following';
import ArticleDetail from './pages/ArticleDetail';
import Messages from './pages/Messages';

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

      {/* Modal Route Overlay */}
      {backgroundLocation && (
        <Routes>
          <Route 
            path="/article/:slug" 
            element={
              <div 
                className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in"
                onClick={(e) => { if (e.target === e.currentTarget) navigate(-1); }}
                onKeyDown={(e) => { if (e.key === 'Escape') navigate(-1); }}
              >
                <div className="max-w-3xl mx-auto my-4 min-h-[calc(100vh-2rem)]" onClick={(e) => e.stopPropagation()}>
                  <ArticleDetail onClose={() => navigate(-1)} />
                </div>
              </div>
            } 
          />
        </Routes>
      )}
    </>
  );
}

export default App;
