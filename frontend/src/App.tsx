import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import VideoPlayer from './pages/VideoPlayer';
import VideoList from './pages/VideoList';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Subscriptions from './pages/Subscriptions';
import ChannelDetail from './pages/ChannelDetail';
import Upload from './pages/Upload';
import Analytics from './pages/Analytics';
import './index.css';
import { ToastProvider } from './components/Toast';
import OfflineBanner from './components/OfflineBanner';
import { setDocumentTitle } from './utils/useDocumentTitle';

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthRoute = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  // Sync document title on route and search changes
  useEffect(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q');

    if (path === '/') {
      if (query && query.toLowerCase() !== 'all') {
        const formattedQuery = query.charAt(0).toUpperCase() + query.slice(1);
        setDocumentTitle(formattedQuery);
      } else {
        setDocumentTitle('');
      }
    } else if (path === '/explore') {
      setDocumentTitle('Explore');
    } else if (path === '/trending') {
      setDocumentTitle('Trending');
    } else if (path === '/gaming') {
      setDocumentTitle('Gaming');
    } else if (path === '/subscriptions') {
      setDocumentTitle('Subscriptions');
    } else if (path === '/history') {
      setDocumentTitle('History');
    } else if (path === '/watch-later') {
      setDocumentTitle('Watch Later');
    } else if (path === '/liked') {
      setDocumentTitle('Liked Videos');
    } else if (path === '/upload') {
      setDocumentTitle('Upload');
    } else if (path === '/analytics') {
      setDocumentTitle('Analytics');
    } else if (path === '/login') {
      setDocumentTitle('Login');
    } else if (path === '/register') {
      setDocumentTitle('Register');
    } else if (path === '/forgot-password') {
      setDocumentTitle('Forgot Password');
    }
  }, [location.pathname, location.search]);

  // Lock body scroll on mobile/tablet when sidebar is open
  useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth <= 1024;
      if (isSmallScreen && isSidebarOpen) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isSidebarOpen]);

  if (isAuthRoute) {
    return (
      <div className="auth-fullscreen-layout">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="main-wrapper">
        {isSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
        )}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="page-content" onClick={() => window.innerWidth <= 1024 && isSidebarOpen && setIsSidebarOpen(false)}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video/:id" element={<VideoPlayer />} />
            <Route path="/explore" element={<VideoList endpoint="videos/explore" title="Explore" />} />
            <Route path="/trending" element={<VideoList endpoint="videos/trending" title="Trending" />} />
            <Route path="/gaming" element={<VideoList endpoint="videos?category=Gaming" title="Gaming" />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/channel/:id" element={<ChannelDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<VideoList endpoint="user/history" title="History" />} />
            <Route path="/watch-later" element={<VideoList endpoint="user/watch-later" title="Watch Later" />} />
            <Route path="/liked" element={<VideoList endpoint="user/liked" title="Liked Videos" />} />
            <Route
              path="/channel"
              element={user ? <Navigate to={`/channel/${user.id}`} /> : <Navigate to="/login" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <OfflineBanner />
      <Router>
        <MainLayout />
      </Router>
    </ToastProvider>
  );
}

export default App;
