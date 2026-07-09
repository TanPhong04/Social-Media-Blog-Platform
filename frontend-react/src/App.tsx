import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ComingSoon from './pages/ComingSoon';
import CreateArticle from './pages/CreateArticle';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import ArticleManagement from './pages/admin/ArticleManagement';

function App() {
  return (
    <Routes>
      {/* Auth routes without MainLayout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Routes wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        
        {/* Placeholder Routes */}
        <Route path="/article/:slug" element={<ComingSoon />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ComingSoon />} />
          <Route path="/following" element={<ComingSoon />} />
          <Route path="/my-articles" element={<ComingSoon />} />
          <Route path="/bookmarks" element={<ComingSoon />} />
          <Route path="/notifications" element={<ComingSoon />} />
          <Route path="/settings" element={<ComingSoon />} />
          <Route path="/create-article" element={<CreateArticle />} />
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
  );
}

export default App;
