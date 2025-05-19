import React, { useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Slider,
  Stack,
  Collapse,
  Fade,
  Tooltip,
  useTheme,
  Tab,
  Tabs
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipPrevious as PreviousIcon,
  SkipNext as NextIcon,
  QueueMusic as PlaylistIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  Queue as QueueIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`music-tabpanel-${index}`}
      aria-labelledby={`music-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 1 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MusicPlayer: React.FC = () => {
  const theme = useTheme();
  const { 
    currentTrack, 
    isPlaying, 
    playlist,
    queue,
    volume,
    isMuted,
    progress,
    duration,
    playTrack, 
    pauseTrack, 
    resumeTrack, 
    nextTrack, 
    previousTrack,
    setVolume,
    toggleMute,
    seekTo,
    clearQueue
  } = useMusicPlayer();
  
  const [expanded, setExpanded] = useState(false);
  const [showList, setShowList] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      resumeTrack();
    }
  };

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setVolume(newVolume);
  };

  const handleProgressChange = (_event: Event, newValue: number | number[]) => {
    const newPosition = newValue as number;
    seekTo(newPosition);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
    if (!expanded) {
      setShowList(false);
    }
  };

  const toggleList = () => {
    setShowList(!showList);
    if (!showList) {
      setExpanded(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format time in mm:ss
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // If no track is playing, don't show the player
  if (!currentTrack) {
    return null;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        p: expanded || showList ? 2 : 1,
        transition: 'all 0.3s ease',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        bgcolor: theme.palette.background.paper,
        boxShadow: 3
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Collapse/Expand button */}
        <IconButton onClick={toggleExpand} size="small" sx={{ mr: 1 }}>
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
        
        {/* Track info */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <Box sx={{ flexGrow: 1, overflow: 'hidden', mr: 2 }}>
            <Typography variant="body1" noWrap fontWeight="bold">
              {currentTrack.track_name}
            </Typography>
            <Typography variant="body2" noWrap color="text.secondary">
              {currentTrack.artist_name} • {currentTrack.genre}
            </Typography>
          </Box>
        </Box>
        
        {/* Controls */}
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={previousTrack} disabled={playlist.length <= 1}>
            <PreviousIcon />
          </IconButton>
          
          <IconButton onClick={handlePlayPause}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
          
          <IconButton onClick={nextTrack}>
            <NextIcon />
          </IconButton>
          
          <Tooltip title={queue.length > 0 ? `Queue (${queue.length})` : "Playlist"}>
            <IconButton onClick={toggleList} color={queue.length > 0 ? "primary" : "default"}>
              {queue.length > 0 ? <QueueIcon /> : <PlaylistIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Expanded content */}
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ mt: 2 }}>
          {/* Progress bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'center' }}>
              {formatTime(progress)}
            </Typography>
            <Slider
              value={progress}
              min={0}
              max={duration || 100}
              onChange={handleProgressChange}
              aria-labelledby="progress-slider"
              sx={{ mx: 2 }}
              size="small"
              color="primary"
            />
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'center' }}>
              {formatTime(duration)}
            </Typography>
          </Box>
          
          {/* Volume control */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={toggleMute} size="small">
              {isMuted ? <MuteIcon /> : <VolumeIcon />}
            </IconButton>
            <Slider
              value={volume}
              onChange={handleVolumeChange}
              aria-labelledby="volume-slider"
              sx={{ mx: 2, maxWidth: 100 }}
              size="small"
            />
          </Box>
        </Box>
      </Collapse>

      {/* Music Lists (Playlist & Queue) */}
      <Collapse in={showList} timeout="auto">
        <Box sx={{ mt: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Playlist" icon={<PlaylistIcon />} iconPosition="start" />
            <Tab 
              label={`Queue (${queue.length})`} 
              icon={<QueueIcon />} 
              iconPosition="start"
              disabled={queue.length === 0} 
            />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {playlist.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  Your playlist is empty
                </Typography>
              ) : (
                playlist.map((track, index) => (
                  <Box
                    key={track.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      mb: 0.5,
                      bgcolor: currentTrack?.id === track.id ? 
                        `${theme.palette.primary.main}20` : 'transparent',
                      '&:hover': {
                        bgcolor: `${theme.palette.primary.main}10`
                      }
                    }}
                    onClick={() => playTrack(track)}
                  >
                    <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
                      {index + 1}.
                    </Typography>
                    <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" noWrap sx={{ 
                        fontWeight: currentTrack?.id === track.id ? 'bold' : 'normal' 
                      }}>
                        {track.track_name}
                      </Typography>
                      <Typography variant="caption" noWrap display="block" color="text.secondary">
                        {track.artist_name}
                      </Typography>
                    </Box>
                    {currentTrack?.id === track.id && (
                      <Fade in>
                        <Box sx={{ ml: 1 }}>
                          {isPlaying ? <PauseIcon fontSize="small" color="primary" /> : <PlayIcon fontSize="small" color="primary" />}
                        </Box>
                      </Fade>
                    )}
                  </Box>
                ))
              )}
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Next in queue</Typography>
              {queue.length > 0 && (
                <Tooltip title="Clear queue">
                  <IconButton size="small" onClick={clearQueue}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {queue.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  Your queue is empty
                </Typography>
              ) : (
                queue.map((track, index) => (
                  <Box
                    key={`queue-${track.id}-${index}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      mb: 0.5,
                      bgcolor: index === 0 ? `${theme.palette.secondary.main}20` : 'transparent',
                      '&:hover': {
                        bgcolor: `${theme.palette.secondary.main}10`
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
                      {index + 1}.
                    </Typography>
                    <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" noWrap sx={{ 
                        fontWeight: index === 0 ? 'bold' : 'normal' 
                      }}>
                        {track.track_name}
                      </Typography>
                      <Typography variant="caption" noWrap display="block" color="text.secondary">
                        {track.artist_name}
                      </Typography>
                    </Box>
                    {index === 0 && (
                      <Fade in>
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="caption" color="secondary">Next</Typography>
                        </Box>
                      </Fade>
                    )}
                  </Box>
                ))
              )}
            </Box>
          </TabPanel>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default MusicPlayer; 