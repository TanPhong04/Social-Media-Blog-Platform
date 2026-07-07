import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ComingSoon from './pages/ComingSoon';
import ProtectedRoute from './components/ProtectedRoute';

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
          <Route path="/create-article" element={<ComingSoon />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
