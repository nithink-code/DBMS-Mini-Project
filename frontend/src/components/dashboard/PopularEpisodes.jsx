import { useState } from 'react';
import { Mic2, Plus, Edit2, Trash2, Star, Clock, Hash, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import VideoPlayer from '@/components/VideoPlayer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

// Function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  let videoId = null;
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('/embed/')[1]?.split('?')[0];
  }
  
  return videoId && videoId.length === 11 ? videoId : null;
};

const PopularEpisodes = ({ episodes, shows, onRefresh, getAuthHeaders, onViewAll, showLimit = 6 }) => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(null);

  // Filter episodes to only show those with valid YouTube video URLs
  const episodesWithValidYouTube = episodes?.filter(episode => 
    episode.video_url && isValidYouTubeUrl(episode.video_url)
  ) || [];
  
  const displayEpisodes = showLimit ? episodesWithValidYouTube.slice(0, showLimit) : episodesWithValidYouTube;
  const [formData, setFormData] = useState({ 
    show_id: '', 
    title: '', 
    description: '', 
    duration_minutes: '', 
    episode_number: '', 
    audio_url: '', 
    video_url: '', 
    status: 'draft' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        duration_minutes: parseInt(formData.duration_minutes), 
        episode_number: parseInt(formData.episode_number) 
      };
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
    setFormData({ 
      show_id: '', 
      title: '', 
      description: '', 
      duration_minutes: '', 
      episode_number: '', 
      audio_url: '', 
      video_url: '', 
      status: 'draft' 
    });
    setEditMode(false);
    setCurrentEpisode(null);
  };

  const handleEdit = (episode) => {
    setCurrentEpisode(episode);
    setFormData({ 
      show_id: episode.show_id, 
      title: episode.title, 
      description: episode.description, 
      duration_minutes: episode.duration_minutes.toString(), 
      episode_number: episode.episode_number.toString(), 
      audio_url: episode.audio_url || '', 
      video_url: episode.video_url || '', 
      status: episode.status 
    });
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = async (episodeId) => {
    if (!window.confirm('Are you sure you want to delete this episode?')) return;
    try {
      await axios.delete(`${API}/episodes/${episodeId}`, getAuthHeaders());
      toast.success('Episode deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete episode');
    }
  };

  return (
    <motion.div 
      className="popular-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="popular-header">
        <h2>
          <Star className="section-icon" />
          Recent Episodes
        </h2>
        <div className="header-actions">
          {onViewAll && episodes?.length > showLimit && (
            <Button onClick={onViewAll} variant="outline" size="sm" className="view-all-btn">
              View All <ArrowRight size={16} />
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="sm" className="create-btn">
              <Plus size={18} /> Create Episode
            </Button>
          </DialogTrigger>
          <DialogContent className="dashboard-dialog">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Episode' : 'Create New Episode'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="dashboard-form">
              <div className="form-group">
                <Label htmlFor="show_id">Show</Label>
                <Select 
                  value={formData.show_id} 
                  onValueChange={(value) => setFormData({ ...formData, show_id: value })} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a show" />
                  </SelectTrigger>
                  <SelectContent>
                    {shows && shows.length > 0 ? (
                      shows.map((show) => (
                        <SelectItem key={show.id} value={show.id}>
                          {show.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No shows available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label htmlFor="title">
                  <Mic2 size={16} /> Episode Title
                </Label>
                <Input 
                  id="title" 
                  placeholder="Enter episode title"
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="episode_number">
                    <Hash size={16} /> Episode Number
                  </Label>
                  <Input 
                    id="episode_number" 
                    type="number"
                    placeholder="1"
                    value={formData.episode_number} 
                    onChange={(e) => setFormData({ ...formData, episode_number: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="duration_minutes">
                    <Clock size={16} /> Duration (min)
                  </Label>
                  <Input 
                    id="duration_minutes" 
                    type="number"
                    placeholder="45"
                    value={formData.duration_minutes} 
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Episode description..."
                  rows={4}
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
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
                <Label htmlFor="audio_url">Audio URL (Optional)</Label>
                <Input 
                  id="audio_url"
                  placeholder="https://example.com/audio.mp3"
                  value={formData.audio_url} 
                  onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <Label htmlFor="video_url" className="font-semibold">
                  🎥 YouTube Video URL (Required for display)
                </Label>
                <Input 
                  id="video_url"
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
              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editMode ? 'Update Episode' : 'Create Episode'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="popular-grid">
        {displayEpisodes && displayEpisodes.length > 0 ? (
          displayEpisodes.map((episode, index) => (
            <motion.div
              key={episode.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="popular-card episode-card">
                <div className="card-image">
                  {episode.thumbnail_url ? (
                    <img src={episode.thumbnail_url} alt={episode.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="placeholder-avatar">
                      <Mic2 size={32} />
                    </div>
                  )}
                </div>
                <div className="card-content">
                  <h3>Ep. {episode.episode_number}: {episode.title}</h3>
                  <p className="category">
                    <Clock size={14} /> {episode.duration_minutes} minutes
                  </p>
                  <p className="bio">{episode.description.substring(0, 80)}...</p>
                  <Badge variant={episode.status === 'published' ? 'default' : 'secondary'}>
                    {episode.status}
                  </Badge>
                  {episode.video_url && (
                    <div className="video-player-wrapper" style={{ marginTop: '12px' }}>
                      <VideoPlayer 
                        videoUrl={episode.video_url} 
                        title={episode.title}
                      />
                    </div>
                  )}
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(episode)} 
                    className="action-btn edit"
                    title="Edit episode"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(episode.id)} 
                    className="action-btn delete"
                    title="Delete episode"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="empty-state">
            <Mic2 size={48} />
            <p>No episodes with YouTube videos yet</p>
            <p className="text-gray-500 text-sm mt-2">Only episodes with valid YouTube video links are displayed</p>
            <Button onClick={() => setOpen(true)} size="sm">
              <Plus size={16} /> Create Episode with YouTube Video
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PopularEpisodes;
