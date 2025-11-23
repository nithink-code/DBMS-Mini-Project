import { useState } from 'react';
import { Briefcase, Plus, Edit2, Trash2, Star, Mail, Phone, DollarSign, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PopularAdvertisers = ({ advertisers, onRefresh, getAuthHeaders, onViewAll, showLimit = 6 }) => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAdvertiser, setCurrentAdvertiser] = useState(null);

  const displayAdvertisers = showLimit ? advertisers?.slice(0, showLimit) : advertisers;
  const [formData, setFormData] = useState({ 
    company_name: '', 
    contact_person: '', 
    email: '', 
    phone: '', 
    budget: '', 
    status: 'active' 
  });

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
    setFormData({ 
      company_name: '', 
      contact_person: '', 
      email: '', 
      phone: '', 
      budget: '', 
      status: 'active' 
    });
    setEditMode(false);
    setCurrentAdvertiser(null);
  };

  const handleEdit = (advertiser) => {
    setCurrentAdvertiser(advertiser);
    setFormData({ 
      company_name: advertiser.company_name, 
      contact_person: advertiser.contact_person, 
      email: advertiser.email, 
      phone: advertiser.phone, 
      budget: advertiser.budget.toString(), 
      status: advertiser.status 
    });
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = async (advertiserId) => {
    if (!window.confirm('Are you sure you want to delete this advertiser?')) return;
    try {
      await axios.delete(`${API}/advertisers/${advertiserId}`, getAuthHeaders());
      toast.success('Advertiser deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete advertiser');
    }
  };

  return (
    <motion.div 
      className="popular-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="popular-header">
        <h2>
          <Star className="section-icon" />
          Top Advertisers
        </h2>
        <div className="header-actions">
          {onViewAll && advertisers?.length > showLimit && (
            <Button onClick={onViewAll} variant="outline" size="sm" className="view-all-btn">
              View All <ArrowRight size={16} />
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="sm" className="create-btn">
              <Plus size={18} /> Add Advertiser
            </Button>
          </DialogTrigger>
          <DialogContent className="dashboard-dialog">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Advertiser' : 'Add New Advertiser'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="dashboard-form">
              <div className="form-group">
                <Label htmlFor="company_name">
                  <Briefcase size={16} /> Company Name
                </Label>
                <Input 
                  id="company_name" 
                  placeholder="Enter company name"
                  value={formData.company_name} 
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <Label htmlFor="contact_person">
                  <User size={16} /> Contact Person
                </Label>
                <Input 
                  id="contact_person"
                  placeholder="Full name"
                  value={formData.contact_person} 
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="email">
                    <Mail size={16} /> Email
                  </Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="phone">
                    <Phone size={16} /> Phone
                  </Label>
                  <Input 
                    id="phone"
                    placeholder="+1 234 567 8900"
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <Label htmlFor="budget">
                  <DollarSign size={16} /> Budget ($)
                </Label>
                <Input 
                  id="budget" 
                  type="number"
                  step="0.01"
                  placeholder="10000.00"
                  value={formData.budget} 
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })} 
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
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editMode ? 'Update Advertiser' : 'Add Advertiser'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="popular-grid">
        {displayAdvertisers && displayAdvertisers.length > 0 ? (
          displayAdvertisers.map((advertiser, index) => (
            <motion.div
              key={advertiser.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="popular-card advertiser-card">
                <div className="card-image">
                  <div className="placeholder-avatar">
                    <Briefcase size={32} />
                  </div>
                </div>
                <div className="card-content">
                  <h3>{advertiser.company_name}</h3>
                  <p className="email">
                    <Mail size={14} /> {advertiser.email}
                  </p>
                  <p className="category">
                    <User size={14} /> {advertiser.contact_person}
                  </p>
                  <p className="budget">
                    <DollarSign size={14} /> 
                    ${advertiser.budget.toLocaleString()}
                  </p>
                  <Badge variant={advertiser.status === 'active' ? 'default' : 'secondary'}>
                    {advertiser.status}
                  </Badge>
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(advertiser)} 
                    className="action-btn edit"
                    title="Edit advertiser"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(advertiser.id)} 
                    className="action-btn delete"
                    title="Delete advertiser"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="empty-state">
            <Briefcase size={48} />
            <p>No advertisers yet</p>
            <Button onClick={() => setOpen(true)} size="sm">
              <Plus size={16} /> Add Your First Advertiser
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PopularAdvertisers;
