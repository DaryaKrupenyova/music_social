import { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Avatar,
  useTheme,
  Chip,
  Grid,
  Tab,
  Tabs,
  Container,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Delete as DeleteIcon,
  MusicNote as MusicNoteIcon,
  Person as PersonIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  UploadFile as UploadFileIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

interface MusicPreference {
  id: number;
  track_name: string;
  artist_name: string;
  genre: string;
  file_path: string;
  user_id?: number;
}

interface User {
  id: number;
  username: string;
  music_preferences: MusicPreference[];
}

const Profile = () => {
  const theme = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [newTrack, setNewTrack] = useState({
    track_name: '',
    artist_name: '',
    genre: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    pauseTrack,
    addToQueue,
    addToPlaylist
  } = useMusicPlayer();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/me/');
      setUser(response.data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        // If unauthorized, redirect to login
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users/music/', newTrack);
      setNewTrack({ track_name: '', artist_name: '', genre: '' });
      fetchUserProfile();
    } catch (error: any) {
      console.error('Error adding track:', error);
      setError(error.response?.data?.detail || 'Failed to add track. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Try to extract track name and artist from filename
      // Format could be "Artist - Track.mp3" or just "Track.mp3"
      const filename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const parts = filename.split(" - ");
      
      if (parts.length > 1) {
        setNewTrack({
          ...newTrack,
          artist_name: parts[0] || '',
          track_name: parts[1] || ''
        });
      } else {
        setNewTrack({
          ...newTrack,
          track_name: filename
        });
      }
    }
  };

  const handleUploadTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('track_name', newTrack.track_name);
      formData.append('artist_name', newTrack.artist_name);
      formData.append('genre', newTrack.genre);
      
      await api.post('/users/music/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setNewTrack({ track_name: '', artist_name: '', genre: '' });
      setSelectedFile(null);
      fetchUserProfile();
    } catch (error: any) {
      console.error('Error uploading track:', error);
      setError(error.response?.data?.detail || 'Failed to upload track. Please try again.');
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePlayTrack = (track: MusicPreference) => {
    if (!track.file_path) return;
    
    if (currentTrack?.id === track.id) {
      // This is the current track, toggle play/pause
      if (isPlaying) {
        pauseTrack();
      } else {
        playTrack(track);
      }
    } else {
      // Play a new track
      playTrack(track);
    }
  };

  const handleDeleteTrack = async (trackId: number) => {
    try {
      await api.delete(`/users/music/${trackId}`);
      fetchUserProfile();
    } catch (error: any) {
      console.error('Error deleting track:', error);
      setError(error.response?.data?.detail || 'Failed to delete track. Please try again.');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, trackId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTrackId(trackId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTrackId(null);
  };

  const handleAddToQueue = () => {
    if (selectedTrackId === null || !user) return;
    
    const track = user.music_preferences.find(t => t.id === selectedTrackId);
    if (track && track.file_path) {
      addToQueue(track);
    }
    handleMenuClose();
  };

  const handleAddToPlaylist = () => {
    if (selectedTrackId === null || !user) return;
    
    const track = user.music_preferences.find(t => t.id === selectedTrackId);
    if (track && track.file_path) {
      addToPlaylist(track);
    }
    handleMenuClose();
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6">Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Profile" 
              subheader="Your account information"
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <PersonIcon />
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: 40,
                    bgcolor: theme.palette.primary.main,
                    mb: 2
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h5" component="h2" gutterBottom>
                  {user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Member ID: {user.id}
                </Typography>
              </Box>
              
              <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>
                Music Stats:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {user.music_preferences.length}
                  </Typography>
                  <Typography variant="body2">Tracks</Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {Array.from(new Set(user.music_preferences.map(pref => pref.genre))).length}
                  </Typography>
                  <Typography variant="body2">Genres</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Add New Music */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Add Music" 
              subheader="Share your favorite tracks"
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                  <MusicNoteIcon />
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Tabs value={tabValue} onChange={handleTabChange} centered>
                <Tab label="Manual Entry" />
                <Tab label="Upload File" />
              </Tabs>
              
              {tabValue === 0 ? (
                <Box component="form" onSubmit={handleAddTrack} sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Track Name"
                        value={newTrack.track_name}
                        onChange={(e) =>
                          setNewTrack({ ...newTrack, track_name: e.target.value })
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Artist Name"
                        value={newTrack.artist_name}
                        onChange={(e) =>
                          setNewTrack({ ...newTrack, artist_name: e.target.value })
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Genre"
                        value={newTrack.genre}
                        onChange={(e) =>
                          setNewTrack({ ...newTrack, genre: e.target.value })
                        }
                        required
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<MusicNoteIcon />}
                    >
                      Add Track
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleUploadTrack} sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        startIcon={<UploadFileIcon />}
                        sx={{ height: '56px' }}
                      >
                        {selectedFile ? selectedFile.name : "Choose Audio File"}
                        <input
                          type="file"
                          accept="audio/*"
                          hidden
                          onChange={handleFileChange}
                        />
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Track Name"
                        value={newTrack.track_name}
                        onChange={(e) =>
                          setNewTrack({ ...newTrack, track_name: e.target.value })
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Artist Name"
                        value={newTrack.artist_name}
                        onChange={(e) =>
                          setNewTrack({ ...newTrack, artist_name: e.target.value })
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Genre"
                        value={newTrack.genre}
                        onChange={(e) =>
                          setNewTrack({ ...newTrack, genre: e.target.value })
                        }
                        required
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<UploadFileIcon />}
                      disabled={!selectedFile}
                    >
                      Upload Track
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
          
          {/* Music Preferences List */}
          <Card sx={{ mt: 3 }}>
            <CardHeader title="My Music Library" />
            <Divider />
            {user.music_preferences.length === 0 ? (
              <CardContent>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  You haven't added any music preferences yet.
                </Typography>
              </CardContent>
            ) : (
              <List sx={{ py: 0 }}>
                {user.music_preferences.map((track: MusicPreference) => (
                  <ListItem
                    key={track.id}
                    secondaryAction={
                      <>
                        {track.file_path && (
                          <>
                            <IconButton
                              edge="end"
                              aria-label="play"
                              onClick={() => handlePlayTrack(track)}
                              sx={{ mr: 1 }}
                            >
                              {currentTrack?.id === track.id && isPlaying ? 
                                <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>
                            <IconButton
                              edge="end"
                              aria-label="more"
                              onClick={(e) => handleMenuOpen(e, track.id)}
                              sx={{ mr: 1 }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </>
                        )}
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteTrack(track.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    }
                    sx={{
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:last-child': {
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight="bold">
                            {track.track_name}
                          </Typography>
                          <Typography variant="body2" sx={{ mx: 1 }}>
                            by
                          </Typography>
                          <Typography variant="body1">
                            {track.artist_name}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Chip 
                            label={track.genre} 
                            size="small" 
                            variant="outlined"
                            sx={{ mr: 1 }} 
                          />
                          {track.file_path && (
                            <Chip 
                              label="Playable" 
                              size="small" 
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            {/* Track options menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleAddToQueue}>Add to Queue</MenuItem>
              <MenuItem onClick={handleAddToPlaylist}>Add to Playlist</MenuItem>
            </Menu>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 