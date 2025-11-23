import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VideoPlayer = ({ videoUrl, title }) => {
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

  // Extract YouTube video ID and create watch URL
  const getYouTubeWatchUrl = (url) => {
    if (!url || !isValidYouTubeUrl(url)) return null;
    
    let videoId = null;
    
    // Extract video ID from various YouTube URL formats
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('/embed/')[1]?.split('?')[0];
    }
    
    // Validate video ID length (YouTube video IDs are always 11 characters)
    return videoId && videoId.length === 11 ? `https://www.youtube.com/watch?v=${videoId}` : null;
  };

  const youtubeUrl = getYouTubeWatchUrl(videoUrl);

  // Don't render if URL is invalid
  if (!youtubeUrl) return null;

  const handlePlayClick = () => {
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button 
      onClick={handlePlayClick} 
      className="play-episode-btn"
      size="sm"
      variant="default"
    >
      <Play size={16} /> Watch on YouTube
    </Button>
  );
};

export default VideoPlayer;
