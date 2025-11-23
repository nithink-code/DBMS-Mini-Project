import { useState } from 'react';
import { Radio, Plus, Edit2, Trash2, Star, Image as ImageIcon, Tag, ArrowRight } from 'lucide-react';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PopularShows = ({ shows, hosts, onRefresh, getAuthHeaders, onViewAll, showLimit = 6 }) => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentShow, setCurrentShow] = useState(null);

  const displayShows = showLimit ? shows?.slice(0, showLimit) : shows;
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    host_id: '', 
    category: '', 
    cover_image_url: '', 
    status: 'active' 
  });

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
    setFormData({ 
      title: '', 
      description: '', 
      host_id: '', 
      category: '', 
      cover_image_url: '', 
      status: 'active' 
    });
    setEditMode(false);
    setCurrentShow(null);
  };

  const handleEdit = (show) => {
    setCurrentShow(show);
    setFormData({ 
      title: show.title, 
      description: show.description, 
      host_id: show.host_id, 
      category: show.category, 
      cover_image_url: show.cover_image_url || '', 
      status: show.status 
    });
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = async (showId) => {
    if (!window.confirm('Are you sure you want to delete this show?')) return;
    try {
      await axios.delete(`${API}/shows/${showId}`, getAuthHeaders());
      toast.success('Show deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete show');
    }
  };

  return (
    <motion.div 
      className="popular-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="popular-header">
        <h2>
          <Star className="section-icon" />
          Popular Shows
        </h2>
        <div className="header-actions">
          {onViewAll && shows?.length > showLimit && (
            <Button onClick={onViewAll} variant="outline" size="sm" className="view-all-btn">
              View All <ArrowRight size={16} />
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="sm" className="create-btn">
              <Plus size={18} /> Create Show
            </Button>
          </DialogTrigger>
          <DialogContent className="dashboard-dialog">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Show' : 'Create New Show'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="dashboard-form">
              <div className="form-group">
                <Label htmlFor="title">
                  <Radio size={16} /> Show Title
                </Label>
                <Input 
                  id="title" 
                  placeholder="Enter show title"
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <Label htmlFor="host_id">Host</Label>
                <Select 
                  value={formData.host_id} 
                  onValueChange={(value) => setFormData({ ...formData, host_id: value })} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a host" />
                  </SelectTrigger>
                  <SelectContent>
                    {hosts && hosts.length > 0 ? (
                      hosts.map((host) => (
                        <SelectItem key={host.id} value={host.id}>
                          {host.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No hosts available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label htmlFor="category">
                  <Tag size={16} /> Category
                </Label>
                <Input 
                  id="category"
                  placeholder="e.g., Technology, Business, Comedy"
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Describe your show..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label htmlFor="cover_image_url">
                  <ImageIcon size={16} /> Cover Image URL (Optional)
                </Label>
                <Input 
                  id="cover_image_url"
                  placeholder="https://example.com/cover.jpg"
                  value={formData.cover_image_url} 
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })} 
                />
              </div>
              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editMode ? 'Update Show' : 'Create Show'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="popular-grid">
        {displayShows && displayShows.length > 0 ? (
          displayShows.map((show, index) => (
            <motion.div
              key={show.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="popular-card show-card">
                <div className="card-image">
                  {show.cover_image_url ? (
                    <img src={show.cover_image_url} alt={show.title} />
                  ) : (
                    <div className="placeholder-avatar">
                      <Radio size={32} />
                    </div>
                  )}
                </div>
                <div className="card-content">
                  <h3>{show.title}</h3>
                  <p className="category">
                    <Tag size={14} /> {show.category}
                  </p>
                  <p className="bio">{show.description.substring(0, 80)}...</p>
                  <Badge variant={show.status === 'active' ? 'default' : 'secondary'}>
                    {show.status}
                  </Badge>
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(show)} 
                    className="action-btn edit"
                    title="Edit show"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(show.id)} 
                    className="action-btn delete"
                    title="Delete show"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="empty-state">
            <Radio size={48} />
            <p>No popular shows yet</p>
            <Button onClick={() => setOpen(true)} size="sm">
              <Plus size={16} /> Create Your First Show
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PopularShows;
