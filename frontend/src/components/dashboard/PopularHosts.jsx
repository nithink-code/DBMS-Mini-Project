import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Star, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to get full image URL
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // If it's a relative path, prepend the backend URL
  return `${BACKEND_URL}${imageUrl}`;
};

const PopularHosts = ({ hosts, onRefresh, getAuthHeaders, onViewAll, showLimit = 3 }) => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentHost, setCurrentHost] = useState(null);
  const [formData, setFormData] = useState({ name: '', bio: '', email: '', image_url: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const displayHosts = showLimit ? hosts?.slice(0, showLimit) : hosts;

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

  const handleDelete = async (hostId) => {
    if (!window.confirm('Are you sure you want to delete this host?')) return;
    try {
      await axios.delete(`${API}/hosts/${hostId}`, getAuthHeaders());
      toast.success('Host deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete host');
    }
  };

  return (
    <motion.div 
      className="popular-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="popular-header">
        <h2>
          <Star className="section-icon" />
          Popular Hosts
        </h2>
        <div className="header-actions">
          {onViewAll && hosts?.length > showLimit && (
            <Button onClick={onViewAll} variant="outline" size="sm" className="view-all-btn">
              View All <ArrowRight size={16} />
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="sm" className="create-btn">
              <Plus size={18} /> Create Host
            </Button>
          </DialogTrigger>
          <DialogContent className="dashboard-dialog">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Host' : 'Create New Host'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="dashboard-form">
              <div className="form-group">
                <Label htmlFor="name">
                  <Users size={16} /> Host Name
                </Label>
                <Input 
                  id="name" 
                  placeholder="Enter host name"
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <Label htmlFor="email">
                  <Mail size={16} /> Email Address
                </Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="host@example.com"
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  required 
                />
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
              <div className="form-group">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio"
                  placeholder="Tell us about this host..."
                  rows={4}
                  value={formData.bio} 
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editMode ? 'Update Host' : 'Create Host'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="popular-grid">
        {displayHosts && displayHosts.length > 0 ? (
          displayHosts.map((host, index) => (
            <motion.div
              key={host.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="popular-card host-card">
                <div className="card-image">
                  {host.image_url ? (
                    <img 
                      src={getFullImageUrl(host.image_url)} 
                      alt={host.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                <div className="card-content">
                  <h3>{host.name}</h3>
                  <p className="email">
                    <Mail size={14} /> {host.email}
                  </p>
                  <p className="bio">{host.bio.substring(0, 80)}...</p>
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(host)} 
                    className="action-btn edit"
                    title="Edit host"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(host.id)} 
                    className="action-btn delete"
                    title="Delete host"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="empty-state">
            <Users size={48} />
            <p>No popular hosts yet</p>
            <Button onClick={() => setOpen(true)} size="sm">
              <Plus size={16} /> Create Your First Host
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PopularHosts;
