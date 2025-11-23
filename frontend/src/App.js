import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mic2, Users, Radio, Briefcase, Plus, Edit2, Trash2, Moon, Sun, LogOut, Menu, X, TrendingUp, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import VideoPlayer from '@/components/VideoPlayer';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Function to get first letter of first word and first letter of last word
const getHostInitials = (hostName) => {
  if (!hostName || hostName.trim().length === 0) return '??';
  const words = hostName.trim().split(/\s+/);
  if (words.length === 1) {
    // Single word: use first and last letter
    const word = words[0];
    return word.charAt(0).toUpperCase() + word.charAt(word.length - 1).toUpperCase();
  }
  // Multiple words: use first letter of first word and first letter of last word
  const firstLetter = words[0].charAt(0).toUpperCase();
  const lastLetter = words[words.length - 1].charAt(0).toUpperCase();
  return firstLetter + lastLetter;
};

const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);

    // Handle Google OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      toast.error(`Authentication failed: ${decodeURIComponent(error)}`);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success('Successfully signed in with Google!');
        // Clean URL and navigate
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/dashboard');
      } catch (err) {
        toast.error('Failed to process authentication data');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [navigate]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await axios.post(`${API}${endpoint}`, formData);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API}/auth/google`;
  };

  return (
    <div className="landing-page">
      <button onClick={toggleDarkMode} className="theme-toggle" data-testid="theme-toggle-btn">
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge" data-testid="hero-badge">PODCAST NETWORK</div>
          <h1 className="hero-title" data-testid="hero-title">Manage Your Podcast Empire</h1>
          <p className="hero-subtitle" data-testid="hero-subtitle">
            The all-in-one platform for podcast creators, hosts, and advertisers
          </p>
          <div className="hero-actions">
            <Button onClick={() => setShowAuth(true)} className="get-started-btn" data-testid="get-started-btn">
              Get Started
            </Button>
          </div>
        </div>

        <div className="feature-grid">
          <div className="feature-card" data-testid="feature-hosts">
            <Users className="feature-icon" />
            <h3>Host Management</h3>
            <p>Organize and track all your podcast hosts in one place</p>
          </div>
          <div className="feature-card" data-testid="feature-shows">
            <Radio className="feature-icon" />
            <h3>Show Production</h3>
            <p>Create and manage multiple podcast series effortlessly</p>
          </div>
          <div className="feature-card" data-testid="feature-episodes">
            <Mic2 className="feature-icon" />
            <h3>Episode Tracking</h3>
            <p>Keep track of every episode with detailed metadata</p>
          </div>
          <div className="feature-card" data-testid="feature-advertisers">
            <Briefcase className="feature-icon" />
            <h3>Advertiser Relations</h3>
            <p>Manage sponsorships and advertising partnerships</p>
          </div>
        </div>
      </div>

      {showAuth && (
        <div className="auth-modal" data-testid="auth-modal">
          <div className="auth-content">
            <button onClick={() => setShowAuth(false)} className="modal-close" data-testid="close-modal-btn">
              <X size={24} />
            </button>
            <h2 className="auth-title" data-testid="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <form onSubmit={handleAuth} data-testid="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    data-testid="name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="form-group">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="auth-btn" data-testid="auth-submit-btn">
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
            <div className="divider">OR</div>
            <Button onClick={handleGoogleLogin} className="google-btn" data-testid="google-login-btn">
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            <p className="auth-toggle" data-testid="auth-toggle">
              {isLogin ? "Don't have an account?" : 'Already have an account? '}
              <span onClick={() => setIsLogin(!isLogin)} data-testid="toggle-auth-mode">
                {isLogin ? 'Sign up' : 'Sign in'}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hosts, setHosts] = useState([]);
  const [shows, setShows] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [popularHosts, setPopularHosts] = useState([]);
  const [popularShows, setPopularShows] = useState([]);
  const [popularEpisodes, setPopularEpisodes] = useState([]);
  const [popularAdvertisers, setPopularAdvertisers] = useState([]);
  const [showInitButton, setShowInitButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    fetchData();
    if (activeTab === 'overview') {
      fetchPopularData();
    }
  }, [activeTab]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchPopularData = async () => {
    try {
      const [hostsRes, showsRes, episodesRes, advertisersRes] = await Promise.all([
        axios.get(`${API}/hosts/popular/list`, getAuthHeaders()),
        axios.get(`${API}/shows/popular/list`, getAuthHeaders()),
        axios.get(`${API}/episodes/popular/list`, getAuthHeaders()),
        axios.get(`${API}/advertisers/popular/list`, getAuthHeaders())
      ]);
      setPopularHosts(hostsRes.data);
      setPopularShows(showsRes.data);
      setPopularEpisodes(episodesRes.data);
      setPopularAdvertisers(advertisersRes.data);
      
      // Show init button if no data
      const hasData = hostsRes.data.length > 0 || showsRes.data.length > 0;
      setShowInitButton(!hasData);
    } catch (error) {
      console.error('Failed to fetch popular data', error);
    }
  };

  const clearAllData = async () => {
    if (!window.confirm('Are you sure you want to delete ALL your data? This cannot be undone!')) {
      return;
    }
    try {
      const { data } = await axios.delete(`${API}/clear-all-data`, getAuthHeaders());
      toast.success(`Deleted ${data.deleted.hosts} hosts, ${data.deleted.shows} shows, ${data.deleted.episodes} episodes, and ${data.deleted.advertisers} advertisers!`);
      await fetchData();
      await fetchPopularData();
    } catch (error) {
      toast.error('Failed to clear data');
    }
  };

  const initializeDefaultData = async () => {
    try {
      const { data } = await axios.post(`${API}/initialize-defaults?force=true`, {}, getAuthHeaders());
      if (data.initialized) {
        toast.success(`Initialized ${data.counts.hosts} hosts, ${data.counts.shows} shows, ${data.counts.episodes} episodes, and ${data.counts.advertisers} advertisers!`);
        await fetchData();
        await fetchPopularData();
      } else {
        toast.info(data.message);
      }
    } catch (error) {
      toast.error('Failed to initialize default data');
    }
  };

  const fetchData = async () => {
    try {
      if (activeTab === 'overview') {
        // Fetch all data for overview
        const [hostsRes, showsRes, episodesRes, advertisersRes] = await Promise.all([
          axios.get(`${API}/hosts`, getAuthHeaders()),
          axios.get(`${API}/shows`, getAuthHeaders()),
          axios.get(`${API}/episodes`, getAuthHeaders()),
          axios.get(`${API}/advertisers`, getAuthHeaders())
        ]);
        setHosts(hostsRes.data);
        setShows(showsRes.data);
        setEpisodes(episodesRes.data);
        setAdvertisers(advertisersRes.data);
        await fetchPopularData();
      } else if (activeTab === 'hosts') {
        const { data } = await axios.get(`${API}/hosts`, getAuthHeaders());
        setHosts(data);
      } else if (activeTab === 'shows') {
        const { data } = await axios.get(`${API}/shows`, getAuthHeaders());
        setShows(data);
      } else if (activeTab === 'episodes') {
        const [episodesRes, showsRes] = await Promise.all([
          axios.get(`${API}/episodes`, getAuthHeaders()),
          axios.get(`${API}/shows`, getAuthHeaders())
        ]);
        setEpisodes(episodesRes.data);
        setShows(showsRes.data);
      } else if (activeTab === 'advertisers') {
        const { data } = await axios.get(`${API}/advertisers`, getAuthHeaders());
        setAdvertisers(data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
      toast.error('Failed to fetch data');
    }
  };

  const handleLogout = () => {
    // Preserve dark mode setting before clearing
    const darkModeSetting = localStorage.getItem('darkMode');
    localStorage.clear();
    // Restore dark mode setting
    if (darkModeSetting) {
      localStorage.setItem('darkMode', darkModeSetting);
    }
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleDelete = async (type, id) => {
    try {
      await axios.delete(`${API}/${type}/${id}`, getAuthHeaders());
      toast.success(`${type.slice(0, -1)} deleted successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="dashboard" data-testid="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand" data-testid="nav-brand">
          <Mic2 size={28} />
          <span>PodcastHub</span>
        </div>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="mobile-menu-btn">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <button
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
            className={activeTab === 'overview' ? 'active' : ''}
            data-testid="overview-tab"
          >
            <Sparkles size={20} /> Overview
          </button>
          <button
            onClick={() => { setActiveTab('hosts'); setMobileMenuOpen(false); }}
            className={activeTab === 'hosts' ? 'active' : ''}
            data-testid="hosts-tab"
          >
            <Users size={20} /> Hosts
          </button>
          <button
            onClick={() => { setActiveTab('shows'); setMobileMenuOpen(false); }}
            className={activeTab === 'shows' ? 'active' : ''}
            data-testid="shows-tab"
          >
            <Radio size={20} /> Shows
          </button>
          <button
            onClick={() => { setActiveTab('episodes'); setMobileMenuOpen(false); }}
            className={activeTab === 'episodes' ? 'active' : ''}
            data-testid="episodes-tab"
          >
            <Mic2 size={20} /> Episodes
          </button>
          <button
            onClick={() => { setActiveTab('advertisers'); setMobileMenuOpen(false); }}
            className={activeTab === 'advertisers' ? 'active' : ''}
            data-testid="advertisers-tab"
          >
            <Briefcase size={20} /> Advertisers
          </button>
        </div>
        <div className="nav-actions">
          <button onClick={toggleDarkMode} className="icon-btn" data-testid="dashboard-theme-toggle">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={handleLogout} className="icon-btn" data-testid="logout-btn">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="dashboard-content" data-testid="dashboard-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <DashboardOverview 
              key="overview"
              popularHosts={popularHosts} 
              popularShows={popularShows} 
              popularEpisodes={popularEpisodes} 
              popularAdvertisers={popularAdvertisers}
              allHosts={hosts}
              allShows={shows}
              onRefresh={fetchData}
              getAuthHeaders={getAuthHeaders}
              onNavigateToTab={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
              showInitButton={showInitButton}
              onInitializeDefaults={initializeDefaultData}
              onClearAllData={clearAllData}
            />
          )}
          {activeTab === 'hosts' && <HostsSection key="hosts" hosts={hosts} onRefresh={fetchData} onDelete={handleDelete} getAuthHeaders={getAuthHeaders} />}
          {activeTab === 'shows' && <ShowsSection key="shows" shows={shows} hosts={hosts} onRefresh={fetchData} onDelete={handleDelete} getAuthHeaders={getAuthHeaders} />}
          {activeTab === 'episodes' && <EpisodesSection key="episodes" episodes={episodes} shows={shows} onRefresh={fetchData} onDelete={handleDelete} getAuthHeaders={getAuthHeaders} />}
          {activeTab === 'advertisers' && <AdvertisersSection key="advertisers" advertisers={advertisers} onRefresh={fetchData} onDelete={handleDelete} getAuthHeaders={getAuthHeaders} />}
        </AnimatePresence>
      </main>
    </div>
  );
};

const OverviewSection = ({ popularHosts, popularShows, popularEpisodes, popularAdvertisers }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div
      className="overview-section"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={containerVariants}
    >
      <motion.div className="overview-header" variants={itemVariants}>
        <h1 className="overview-title">
          <TrendingUp className="overview-icon" />
          Dashboard Overview
        </h1>
        <p className="overview-subtitle">Your podcast network at a glance</p>
      </motion.div>

      <motion.div className="stats-grid" variants={itemVariants}>
        <div className="stat-card">
          <div className="stat-icon hosts">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{popularHosts.length}</h3>
            <p>Popular Hosts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon shows">
            <Radio size={24} />
          </div>
          <div className="stat-content">
            <h3>{popularShows.length}</h3>
            <p>Active Shows</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon episodes">
            <Mic2 size={24} />
          </div>
          <div className="stat-content">
            <h3>{popularEpisodes.length}</h3>
            <p>Recent Episodes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon advertisers">
            <Briefcase size={24} />
          </div>
          <div className="stat-content">
            <h3>{popularAdvertisers.length}</h3>
            <p>Top Advertisers</p>
          </div>
        </div>
      </motion.div>

      {popularHosts.length > 0 && (
        <motion.div className="popular-section" variants={itemVariants}>
          <div className="popular-header">
            <h2><Star className="section-icon" />Popular Hosts</h2>
          </div>
          <div className="popular-grid">
            {popularHosts.map((host, index) => (
              <motion.div
                key={host.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="popular-card">
                  <div className="card-avatar">
                    {host.image_url ? (
                      <img 
                        src={`${BACKEND_URL}${host.image_url.startsWith('http') ? host.image_url.replace(/^https?:\/\/[^\/]+/, '') : host.image_url}`} 
                        alt={host.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="placeholder-avatar" style={{ display: host.image_url ? 'none' : 'flex' }}>
                      <span className="placeholder-text">{getHostInitials(host.name)}</span>
                    </div>
                  </div>
                  <h3>{host.name}</h3>
                  <p className="email">{host.email}</p>
                  <p className="bio">{host.bio.substring(0, 60)}...</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {popularShows.length > 0 && (
        <motion.div className="popular-section" variants={itemVariants}>
          <div className="popular-header">
            <h2><Star className="section-icon" />Popular Shows</h2>
          </div>
          <div className="popular-grid">
            {popularShows.map((show, index) => (
              <motion.div
                key={show.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="popular-card">
                  <div className="card-avatar">
                    {show.cover_image_url ? <img src={show.cover_image_url} alt={show.title} /> : <Radio size={32} />}
                  </div>
                  <h3>{show.title}</h3>
                  <p className="category">Category: {show.category}</p>
                  <p className="bio">{show.description.substring(0, 60)}...</p>
                  <span className={`status-badge ${show.status}`}>{show.status}</span>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {popularEpisodes.length > 0 && (
        <motion.div className="popular-section" variants={itemVariants}>
          <div className="popular-header">
            <h2><Star className="section-icon" />Recent Episodes</h2>
          </div>
          <div className="popular-grid">
            {popularEpisodes.map((episode, index) => (
              <motion.div
                key={episode.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="popular-card">
                  <div className="card-avatar">
                    <Mic2 size={32} />
                  </div>
                  <h3>Ep. {episode.episode_number}: {episode.title}</h3>
                  <p className="category">{episode.duration_minutes} minutes</p>
                  <p className="bio">{episode.description.substring(0, 60)}...</p>
                  <span className={`status-badge ${episode.status}`}>{episode.status}</span>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {popularAdvertisers.length > 0 && (
        <motion.div className="popular-section" variants={itemVariants}>
          <div className="popular-header">
            <h2><Star className="section-icon" />Top Advertisers</h2>
          </div>
          <div className="popular-grid">
            {popularAdvertisers.map((advertiser, index) => (
              <motion.div
                key={advertiser.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="popular-card">
                  <div className="card-avatar">
                    <Briefcase size={32} />
                  </div>
                  <h3>{advertiser.company_name}</h3>
                  <p className="email">{advertiser.email}</p>
                  <p className="category">Contact: {advertiser.contact_person}</p>
                  <p className="budget">Budget: ${advertiser.budget.toLocaleString()}</p>
                  <span className={`status-badge ${advertiser.status}`}>{advertiser.status}</span>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const HostsSection = ({ hosts, onRefresh, onDelete, getAuthHeaders }) => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentHost, setCurrentHost] = useState(null);
  const [formData, setFormData] = useState({ name: '', bio: '', email: '', image_url: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Helper function to get full image URL
  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${BACKEND_URL}${imageUrl}`;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image_url;
      
      // Upload image if a new file is selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        const { data } = await axios.post(`${API}/upload/host-image`, imageFormData, {
          ...getAuthHeaders(),
          headers: {
            ...getAuthHeaders().headers,
            'Content-Type': 'multipart/form-data'
          }
        });
        imageUrl = `${BACKEND_URL}${data.url}`;
      }
      
      const hostData = { ...formData, image_url: imageUrl };
      
      if (editMode) {
        await axios.put(`${API}/hosts/${currentHost.id}`, hostData, getAuthHeaders());
        toast.success('Host updated successfully');
      } else {
        await axios.post(`${API}/hosts`, hostData, getAuthHeaders());
        toast.success('Host created successfully');
      }
      setOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', bio: '', email: '', image_url: '' });
    setEditMode(false);
    setCurrentHost(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (host) => {
    setCurrentHost(host);
    setFormData({ 
      name: host.name, 
      bio: host.bio, 
      email: host.email,
      image_url: host.image_url || ''
    });
    setImagePreview(host.image_url ? getFullImageUrl(host.image_url) : null);
    setImageFile(null);
    setEditMode(true);
    setOpen(true);
  };

  return (
    <motion.div 
      className="section" 
      data-testid="hosts-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="section-header">
        <h2 data-testid="section-title">Podcast Hosts</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="add-host-btn">
              <Plus size={20} /> Add Host
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="host-dialog">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Host' : 'Add New Host'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <Label htmlFor="name">Name</Label>
                <Input id="name" data-testid="host-name-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" data-testid="host-email-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" data-testid="host-bio-input" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="image">Host Image</Label>
                <Input 
                  id="image" 
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} 
                    />
                  </div>
                )}
              </div>
              <Button type="submit" data-testid="host-submit-btn">{editMode ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid" data-testid="hosts-grid">
        {hosts.map((host) => (
          <Card key={host.id} className="item-card" data-testid={`host-card-${host.id}`}>
            <div className="card-header">
              <div className="card-avatar">
                {host.image_url ? (
                  <img 
                    src={getFullImageUrl(host.image_url)} 
                    alt={host.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="placeholder-avatar" style={{ display: host.image_url ? 'none' : 'flex' }}>
                  <span className="placeholder-text">{getHostInitials(host.name)}</span>
                </div>
              </div>
              <div className="card-actions">
                <button onClick={() => handleEdit(host)} data-testid={`edit-host-${host.id}`}><Edit2 size={18} /></button>
                <button onClick={() => onDelete('hosts', host.id)} data-testid={`delete-host-${host.id}`}><Trash2 size={18} /></button>
              </div>
            </div>
            <h3>{host.name}</h3>
            <p className="email">{host.email}</p>
            <p className="bio">{host.bio}</p>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

const ShowsSection = ({ shows, hosts, onRefresh, onDelete, getAuthHeaders }) => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentShow, setCurrentShow] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', host_id: '', category: '', cover_image_url: '', status: 'active' });

  useEffect(() => {
    if (!hosts.length) {
      axios.get(`${API}/hosts`, getAuthHeaders()).then(({ data }) => {});
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`${API}/shows/${currentShow.id}`, formData, getAuthHeaders());
        toast.success('Show updated successfully');
      } else {
        await axios.post(`${API}/shows`, formData, getAuthHeaders());
        toast.success('Show created successfully');
      }
      setOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', host_id: '', category: '', cover_image_url: '', status: 'active' });
    setEditMode(false);
    setCurrentShow(null);
  };

  const handleEdit = (show) => {
    setCurrentShow(show);
    setFormData({ title: show.title, description: show.description, host_id: show.host_id, category: show.category, cover_image_url: show.cover_image_url || '', status: show.status });
    setEditMode(true);
    setOpen(true);
  };

  return (
    <motion.div 
      className="section" 
      data-testid="shows-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="section-header">
        <h2 data-testid="section-title">Podcast Shows</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="add-show-btn">
              <Plus size={20} /> Add Show
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="show-dialog">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Show' : 'Add New Show'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <Label htmlFor="title">Title</Label>
                <Input id="title" data-testid="show-title-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" data-testid="show-description-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="host_id">Host</Label>
                <Select value={formData.host_id} onValueChange={(value) => setFormData({ ...formData, host_id: value })} required>
                  <SelectTrigger data-testid="show-host-select">
                    <SelectValue placeholder="Select a host" />
                  </SelectTrigger>
                  <SelectContent>
                    {hosts.map((host) => (
                      <SelectItem key={host.id} value={host.id}>{host.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label htmlFor="category">Category</Label>
                <Input id="category" data-testid="show-category-input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger data-testid="show-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label htmlFor="cover_image_url">Cover Image URL (optional)</Label>
                <Input id="cover_image_url" data-testid="show-image-input" value={formData.cover_image_url} onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })} />
              </div>
              <Button type="submit" data-testid="show-submit-btn">{editMode ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid" data-testid="shows-grid">
        {shows.map((show) => (
          <Card key={show.id} className="item-card" data-testid={`show-card-${show.id}`}>
            <div className="card-header">
              <div className="card-avatar">{show.cover_image_url ? <img src={show.cover_image_url} alt={show.title} /> : <Radio size={32} />}</div>
              <div className="card-actions">
                <button onClick={() => handleEdit(show)} data-testid={`edit-show-${show.id}`}><Edit2 size={18} /></button>
                <button onClick={() => onDelete('shows', show.id)} data-testid={`delete-show-${show.id}`}><Trash2 size={18} /></button>
              </div>
            </div>
            <h3>{show.title}</h3>
            <p className="category">Category: {show.category}</p>
            <p className="bio">{show.description}</p>
            <span className={`status-badge ${show.status}`}>{show.status}</span>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

const EpisodesSection = ({ episodes, shows, onRefresh, onDelete, getAuthHeaders }) => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [formData, setFormData] = useState({ show_id: '', title: '', description: '', duration_minutes: '', episode_number: '', audio_url: '', video_url: '', thumbnail_url: '', status: 'draft' });

  // Function to validate YouTube URLs
  const isValidYouTubeUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    // YouTube URL patterns
    const youtubePatterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/, // youtube.com/watch?v=
      /^https?:\/\/(www\.)?youtu\.be\/[a-zA-Z0-9_-]{11}/, // youtu.be/
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/, // youtube.com/embed/
      /^https?:\/\/(www\.)?m\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/ // m.youtube.com/watch?v=
    ];
    
    return youtubePatterns.some(pattern => pattern.test(url));
  };

  // Filter episodes to only show those with valid YouTube video URLs
  const episodesWithValidYouTube = episodes?.filter(episode => 
    episode.video_url && isValidYouTubeUrl(episode.video_url)
  ) || [];

  useEffect(() => {
    if (!shows.length) {
      axios.get(`${API}/shows`, getAuthHeaders()).then(({ data }) => {});
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, duration_minutes: parseInt(formData.duration_minutes), episode_number: parseInt(formData.episode_number) };
      if (editMode) {
        await axios.put(`${API}/episodes/${currentEpisode.id}`, payload, getAuthHeaders());
        toast.success('Episode updated successfully');
      } else {
        await axios.post(`${API}/episodes`, payload, getAuthHeaders());
        toast.success('Episode created successfully');
      }
      setOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({ show_id: '', title: '', description: '', duration_minutes: '', episode_number: '', audio_url: '', video_url: '', thumbnail_url: '', status: 'draft' });
    setEditMode(false);
    setCurrentEpisode(null);
  };

  const handleEdit = (episode) => {
    setCurrentEpisode(episode);
    setFormData({ show_id: episode.show_id, title: episode.title, description: episode.description, duration_minutes: episode.duration_minutes.toString(), episode_number: episode.episode_number.toString(), audio_url: episode.audio_url || '', video_url: episode.video_url || '', thumbnail_url: episode.thumbnail_url || '', status: episode.status });
    setEditMode(true);
    setOpen(true);
  };

  return (
    <motion.div 
      className="section" 
      data-testid="episodes-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="section-header">
        <h2 data-testid="section-title">Podcast Episodes</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="add-episode-btn">
              <Plus size={20} /> Add Episode
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="episode-dialog">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Episode' : 'Add New Episode'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <Label htmlFor="show_id">Show</Label>
                <Select value={formData.show_id} onValueChange={(value) => setFormData({ ...formData, show_id: value })} required>
                  <SelectTrigger data-testid="episode-show-select">
                    <SelectValue placeholder="Select a show" />
                  </SelectTrigger>
                  <SelectContent>
                    {shows.map((show) => (
                      <SelectItem key={show.id} value={show.id}>{show.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label htmlFor="title">Title</Label>
                <Input id="title" data-testid="episode-title-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="episode_number">Episode Number</Label>
                <Input id="episode_number" type="number" data-testid="episode-number-input" value={formData.episode_number} onChange={(e) => setFormData({ ...formData, episode_number: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input id="duration_minutes" type="number" data-testid="episode-duration-input" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" data-testid="episode-description-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger data-testid="episode-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label htmlFor="audio_url">Audio URL (optional)</Label>
                <Input id="audio_url" data-testid="episode-audio-input" value={formData.audio_url} onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })} />
              </div>
              <div className="form-group">
                <Label htmlFor="video_url" className="font-semibold">
                  🎥 YouTube Video URL (Required for display)
                </Label>
                <Input 
                  id="video_url" 
                  data-testid="episode-video-input" 
                  placeholder="https://youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ"
                  value={formData.video_url} 
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className={formData.video_url && !isValidYouTubeUrl(formData.video_url) ? 'border-red-500' : ''}
                />
                {formData.video_url && !isValidYouTubeUrl(formData.video_url) && (
                  <p className="text-red-500 text-sm mt-1 font-medium">⚠️ Please enter a valid YouTube URL</p>
                )}
                {formData.video_url && isValidYouTubeUrl(formData.video_url) && (
                  <p className="text-green-600 text-sm mt-1 font-medium">✓ Valid YouTube URL</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Supported formats: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/...
                </p>
              </div>
              <div className="form-group">
                <Label htmlFor="thumbnail_url">Thumbnail URL (optional)</Label>
                <Input id="thumbnail_url" placeholder="Episode thumbnail image URL" value={formData.thumbnail_url} onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })} />
              </div>
              <Button type="submit" data-testid="episode-submit-btn">{editMode ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid" data-testid="episodes-grid">
        {episodesWithValidYouTube.length === 0 && episodes?.length > 0 && (
          <div className="text-center text-gray-500 p-6 col-span-full">
            <Mic2 size={48} className="mx-auto mb-4" />
            <p>No episodes with valid YouTube videos found</p>
            <p className="text-sm mt-2">Only episodes with YouTube video links are displayed</p>
          </div>
        )}
        {episodesWithValidYouTube.map((episode) => (
          <Card key={episode.id} className="item-card" data-testid={`episode-card-${episode.id}`}>
            <div className="card-header">
              <div className="card-avatar">
                {episode.thumbnail_url ? (
                  <img src={episode.thumbnail_url} alt={episode.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <Mic2 size={32} />
                )}
              </div>
              <div className="card-actions">
                <button onClick={() => handleEdit(episode)} data-testid={`edit-episode-${episode.id}`}><Edit2 size={18} /></button>
                <button onClick={() => onDelete('episodes', episode.id)} data-testid={`delete-episode-${episode.id}`}><Trash2 size={18} /></button>
              </div>
            </div>
            <h3>Ep. {episode.episode_number}: {episode.title}</h3>
            <p className="category">{episode.duration_minutes} minutes</p>
            <p className="bio">{episode.description}</p>
            <span className={`status-badge ${episode.status}`}>{episode.status}</span>
            {episode.video_url && (
              <div style={{ marginTop: '12px' }}>
                <VideoPlayer videoUrl={episode.video_url} title={episode.title} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

const AdvertisersSection = ({ advertisers, onRefresh, onDelete, getAuthHeaders }) => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAdvertiser, setCurrentAdvertiser] = useState(null);
  const [formData, setFormData] = useState({ company_name: '', contact_person: '', email: '', phone: '', budget: '', status: 'active' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, budget: parseFloat(formData.budget) };
      if (editMode) {
        await axios.put(`${API}/advertisers/${currentAdvertiser.id}`, payload, getAuthHeaders());
        toast.success('Advertiser updated successfully');
      } else {
        await axios.post(`${API}/advertisers`, payload, getAuthHeaders());
        toast.success('Advertiser created successfully');
      }
      setOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({ company_name: '', contact_person: '', email: '', phone: '', budget: '', status: 'active' });
    setEditMode(false);
    setCurrentAdvertiser(null);
  };

  const handleEdit = (advertiser) => {
    setCurrentAdvertiser(advertiser);
    setFormData({ company_name: advertiser.company_name, contact_person: advertiser.contact_person, email: advertiser.email, phone: advertiser.phone, budget: advertiser.budget.toString(), status: advertiser.status });
    setEditMode(true);
    setOpen(true);
  };

  return (
    <motion.div 
      className="section" 
      data-testid="advertisers-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="section-header">
        <h2 data-testid="section-title">Advertisers</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="add-advertiser-btn">
              <Plus size={20} /> Add Advertiser
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="advertiser-dialog">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Advertiser' : 'Add New Advertiser'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" data-testid="advertiser-company-input" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input id="contact_person" data-testid="advertiser-contact-input" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" data-testid="advertiser-email-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" data-testid="advertiser-phone-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input id="budget" type="number" step="0.01" data-testid="advertiser-budget-input" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} required />
              </div>
              <div className="form-group">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger data-testid="advertiser-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" data-testid="advertiser-submit-btn">{editMode ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid" data-testid="advertisers-grid">
        {advertisers.map((advertiser) => (
          <Card key={advertiser.id} className="item-card" data-testid={`advertiser-card-${advertiser.id}`}>
            <div className="card-header">
              <div className="card-avatar"><Briefcase size={32} /></div>
              <div className="card-actions">
                <button onClick={() => handleEdit(advertiser)} data-testid={`edit-advertiser-${advertiser.id}`}><Edit2 size={18} /></button>
                <button onClick={() => onDelete('advertisers', advertiser.id)} data-testid={`delete-advertiser-${advertiser.id}`}><Trash2 size={18} /></button>
              </div>
            </div>
            <h3>{advertiser.company_name}</h3>
            <p className="email">{advertiser.email}</p>
            <p className="category">Contact: {advertiser.contact_person}</p>
            <p className="category">Phone: {advertiser.phone}</p>
            <p className="budget">Budget: ${advertiser.budget.toLocaleString()}</p>
            <span className={`status-badge ${advertiser.status}`}>{advertiser.status}</span>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;