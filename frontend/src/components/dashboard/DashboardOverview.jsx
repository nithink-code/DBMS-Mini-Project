import { motion } from 'framer-motion';
import { TrendingUp, Users, Radio, Mic2, Briefcase, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PopularHosts from './PopularHosts';
import PopularShows from './PopularShows';
import PopularEpisodes from './PopularEpisodes';
import PopularAdvertisers from './PopularAdvertisers';

const DashboardOverview = ({ 
  popularHosts, 
  popularShows, 
  popularEpisodes, 
  popularAdvertisers,
  allHosts,
  allShows,
  onRefresh,
  getAuthHeaders,
  onNavigateToTab,
  showInitButton,
  onInitializeDefaults,
  onClearAllData
}) => {
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
      className="dashboard-overview"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={containerVariants}
    >
      <motion.div className="overview-header" variants={itemVariants}>
        <div className="overview-header-content">
          <div>
            <h1 className="overview-title">
              <TrendingUp className="overview-icon" />
              Dashboard Overview
            </h1>
            <p className="overview-subtitle">
              Manage your podcast network with ease
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={onClearAllData} variant="outline" className="clear-btn">
              Clear All Data
            </Button>
            <Button onClick={onInitializeDefaults} className="init-btn">
              <Sparkles size={18} /> Load Indian Podcasts
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div className="stats-grid" variants={itemVariants}>
        <div className="stat-card hosts-stat">
          <div className="stat-icon hosts">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{popularHosts?.length || 0}</h3>
            <p>Popular Hosts</p>
          </div>
        </div>
        <div className="stat-card shows-stat">
          <div className="stat-icon shows">
            <Radio size={24} />
          </div>
          <div className="stat-content">
            <h3>{popularShows?.length || 0}</h3>
            <p>Active Shows</p>
          </div>
        </div>
        <div className="stat-card episodes-stat">
          <div className="stat-icon episodes">
            <Mic2 size={24} />
          </div>
          <div className="stat-content">
            <h3>{popularEpisodes?.length || 0}</h3>
            <p>Recent Episodes</p>
          </div>
        </div>
        <div className="stat-card advertisers-stat">
          <div className="stat-icon advertisers">
            <Briefcase size={24} />
          </div>
          <div className="stat-content">
            <h3>{popularAdvertisers?.length || 0}</h3>
            <p>Top Advertisers</p>
          </div>
        </div>
      </motion.div>

      <div className="popular-sections">
        <PopularHosts 
          hosts={popularHosts} 
          onRefresh={onRefresh}
          getAuthHeaders={getAuthHeaders}
          onViewAll={() => onNavigateToTab?.('hosts')}
          showLimit={3}
        />
        
        <PopularShows 
          shows={popularShows}
          hosts={allHosts}
          onRefresh={onRefresh}
          getAuthHeaders={getAuthHeaders}
          onViewAll={() => onNavigateToTab?.('shows')}
          showLimit={6}
        />
        
        <PopularEpisodes 
          episodes={popularEpisodes}
          shows={allShows}
          onRefresh={onRefresh}
          getAuthHeaders={getAuthHeaders}
          onViewAll={() => onNavigateToTab?.('episodes')}
          showLimit={6}
        />
        
        <PopularAdvertisers 
          advertisers={popularAdvertisers}
          onRefresh={onRefresh}
          getAuthHeaders={getAuthHeaders}
          onViewAll={() => onNavigateToTab?.('advertisers')}
          showLimit={6}
        />
      </div>
    </motion.div>
  );
};

export default DashboardOverview;
