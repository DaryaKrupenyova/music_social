import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  Box, 
  Typography, 
  Paper, 
  Alert, 
  Card, 
  CardHeader, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  useTheme, 
  useMediaQuery, 
  ListItemButton,
  CircularProgress,
  Skeleton,
  CardContent,
  IconButton,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import api from '../api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Pause as PauseIcon, PlayArrow as PlayArrowIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons - load outside of component to avoid re-creation
const userIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Selected user marker icon - regular marker for now to debug
const selectedUserIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

interface User {
  id: number;
  username: string;
  latitude: number;
  longitude: number;
  music_preferences: MusicPreference[];
}

interface MusicPreference {
  track_name: string;
  artist_name: string;
  genre: string;
  file_path?: string;
}

// Auto-center map component
const MapUpdater = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position[0] !== 0 && position[1] !== 0) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  
  return null;
};

// Utility component to capture map reference
const SetMapRef = ({ setMap }: { setMap: (map: L.Map) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    setMap(map);
  }, [map, setMap]);
  
  return null;
};

// Component to pan to selected user
interface FocusUserProps {
  user: User | null;
  map: L.Map | null;
}

const FocusUser = ({ user, map }: FocusUserProps) => {
  useEffect(() => {
    if (user && map) {
      map.setView([user.latitude, user.longitude], 14);
    }
  }, [user, map]);
  
  return null;
};

const Map = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [users, setUsers] = useState<User[]>([]);
  const [position, setPosition] = useState<[number, number]>([55.7522, 37.6156]); // Default coordinates (Moscow)
  const [error, setError] = useState<string | null>(null);
  const [locationLoaded, setLocationLoaded] = useState<boolean>(false);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const { currentTrack, isPlaying, playTrack, pauseTrack, addToQueue, addToPlaylist } = useMusicPlayer();
  
  // For queue menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTrack, setSelectedTrack] = useState<{track: MusicPreference, id: number} | null>(null);

  // Get user's current position - optimized with useCallback
  const getUserLocation = useCallback(() => {
    console.log("Getting user location...");
    setLoadingLocation(true);
    
    // Use browser geolocation API with timeout
    const locationTimeout = setTimeout(() => {
      console.log("Location request timed out, using default location");
      setPosition([51.505, -0.09]);
      setLocationLoaded(true);
      setLoadingLocation(false);
      fetchNearbyUsers(51.505, -0.09);
    }, 5000); // 5 second timeout
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(locationTimeout);
        console.log("Got user location:", position.coords);
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        fetchNearbyUsers(latitude, longitude);
        updateUserLocation(latitude, longitude);
        setLocationLoaded(true);
        setLoadingLocation(false);
      },
      (error) => {
        clearTimeout(locationTimeout);
        console.error('Error getting location:', error);
        setError('Unable to get your location. Using default location.');
        // Still try to fetch users with default location
        fetchNearbyUsers(position[0], position[1]);
        setLocationLoaded(true);
        setLoadingLocation(false);
      },
      { 
        enableHighAccuracy: false, // Set to false for faster response
        timeout: 5000,
        maximumAge: 60000 // Cache location for 1 minute
      }
    );
  }, []);

  useEffect(() => {
    getUserLocation();
    
    // Clean up function
    return () => {
      console.log("Cleaning up Map component");
      // Clear any references
      markersRef.current = {};
    };
  }, [getUserLocation]);

  const updateUserLocation = async (latitude: number, longitude: number) => {
    try {
      await api.put(`/users/location/?latitude=${latitude}&longitude=${longitude}`);
    } catch (error) {
      console.error('Error updating location:', error);
      // Not showing this error to the user as it's not critical
    }
  };

  const fetchNearbyUsers = async (latitude: number, longitude: number) => {
    setLoadingUsers(true);
    console.log("Fetching nearby users...");
    try {
      const response = await api.get(
        `/users/nearby/?latitude=${latitude}&longitude=${longitude}`
      );
      console.log("Users fetched:", response.data.length);
      setUsers(response.data);
    } catch (error: any) {
      console.error('Error fetching nearby users:', error);
      setError(error.response?.data?.detail || 'Failed to load nearby users. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Function to handle user selection from the list
  const handleUserSelect = useCallback((user: User) => {
    console.log("Selected user:", user.username);
    setSelectedUser(user);
    
    // Pan to the user's location
    if (map) {
      map.setView([user.latitude, user.longitude], 14);
      
      // Open popup for this user
      setTimeout(() => {
        const marker = markersRef.current[user.id];
        if (marker) {
          marker.openPopup();
        }
      }, 100);
    }
  }, [map]);

  // Store marker reference
  const registerMarker = useCallback((id: number, markerInstance: L.Marker) => {
    if (markerInstance) {
      markersRef.current[id] = markerInstance;
    }
  }, []);

  // Replace the handlePlayTrack function with this
  const handlePlayTrack = (track: MusicPreference, trackId: number) => {
    if (!track.file_path) return;
    
    // Create a complete track object for the music player
    const completeTrack = {
      ...track,
      id: trackId, // Using the trackId as the unique identifier
      file_path: track.file_path // This is guaranteed to be defined because of the check above
    };
    
    if (currentTrack?.id === trackId) {
      // This is the current track, toggle play/pause
      if (isPlaying) {
        pauseTrack();
      } else {
        playTrack(completeTrack as any); // Use type assertion to bypass TypeScript check
      }
    } else {
      // Play a new track
      playTrack(completeTrack as any); // Use type assertion to bypass TypeScript check
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, track: MusicPreference, trackId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTrack({track, id: trackId});
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTrack(null);
  };

  const handleAddToQueue = () => {
    if (!selectedTrack || !selectedTrack.track.file_path) return;
    
    // Create a complete track object for the music player
    const completeTrack = {
      ...selectedTrack.track,
      id: selectedTrack.id,
      file_path: selectedTrack.track.file_path
    };
    
    addToQueue(completeTrack as any);
    handleMenuClose();
  };

  const handleAddToPlaylist = () => {
    if (!selectedTrack || !selectedTrack.track.file_path) return;
    
    // Create a complete track object for the music player
    const completeTrack = {
      ...selectedTrack.track,
      id: selectedTrack.id,
      file_path: selectedTrack.track.file_path
    };
    
    addToPlaylist(completeTrack as any);
    handleMenuClose();
  };

  // Update renderUserMusicPreferences function
  const renderUserMusicPreferences = (user: User) => (
    <Paper sx={{ p: 1, minWidth: 200 }}>
      <Typography variant="h6">{user.username}</Typography>
      <Typography variant="subtitle2" sx={{ mt: 1 }}>Music Preferences:</Typography>
      {user.music_preferences.length === 0 ? (
        <Typography variant="body2">No music preferences yet</Typography>
      ) : (
        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
          {user.music_preferences.map((pref, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                borderBottom: index < user.music_preferences.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                py: 0.5
              }}
            >
              {pref.file_path && (
                <>
                  <IconButton 
                    size="small" 
                    onClick={() => handlePlayTrack(pref, index)}
                    sx={{ mr: 1 }}
                  >
                    {currentTrack?.id === index && isPlaying ? 
                      <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, pref, index)}
                    sx={{ mr: 1 }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </>
              )}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {pref.track_name} 
                </Typography>
                <Typography variant="caption" display="block">
                  {pref.artist_name} • {pref.genre}
                  {pref.file_path && <Chip size="small" label="Playable" sx={{ ml: 1 }} color="success" variant="outlined" />}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );

  // Memoize map component to prevent unnecessary re-renders
  const mapComponent = useMemo(() => {
    if (!locationLoaded) return null;
    
    return (
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
        zoomControl={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        dragging={true}
        easeLinearity={0.35}
      >
        <SetMapRef setMap={setMap} />
        <MapUpdater position={position} />
        <FocusUser user={selectedUser} map={map} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Current user marker */}
        <Marker position={position} icon={userIcon}>
          <Popup>
            <Paper sx={{ p: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Your location</Typography>
            </Paper>
          </Popup>
        </Marker>
        
        {/* Other users markers */}
        {users.map((user) => {
          // Decide which icon to use
          const icon = selectedUser?.id === user.id ? selectedUserIcon : L.Icon.Default.prototype;
          
          return (
            <Marker
              key={user.id}
              position={[user.latitude, user.longitude]}
              eventHandlers={{
                click: () => handleUserSelect(user)
              }}
              ref={(marker) => {
                if (marker) registerMarker(user.id, marker);
              }}
            >
              <Popup>
                {renderUserMusicPreferences(user)}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    );
  }, [locationLoaded, position, users, selectedUser, handleUserSelect, map, registerMarker]);

  // Render loading skeletons for the user list
  const renderUserListSkeleton = () => (
    <Box sx={{ px: 2, py: 1 }}>
      {[1, 2, 3, 4, 5].map((item) => (
        <Box key={item} sx={{ mb: 2 }}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      ))}
    </Box>
  );

  // Update renderSelectedUserDetails function (mobile view)
  const renderSelectedUserDetails = () => {
    if (!selectedUser) return null;
    
    return (
      <Card sx={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        maxHeight: '40%',
        overflowY: 'auto'
      }}>
        <CardHeader 
          title={selectedUser.username} 
          sx={{ pb: 1 }}
        />
        <Divider />
        <CardContent sx={{ pt: 1, pb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Music Preferences:</Typography>
          {selectedUser.music_preferences.length === 0 ? (
            <Typography variant="body2">No music preferences yet</Typography>
          ) : (
            selectedUser.music_preferences.map((pref, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  borderBottom: index < selectedUser.music_preferences.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                  py: 0.5
                }}
              >
                {pref.file_path && (
                  <>
                    <IconButton 
                      size="small" 
                      onClick={() => handlePlayTrack(pref, index)}
                      sx={{ mr: 1 }}
                    >
                      {currentTrack?.id === index && isPlaying ? 
                        <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, pref, index)}
                      sx={{ mr: 1 }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {pref.track_name} 
                  </Typography>
                  <Typography variant="caption" display="block">
                    {pref.artist_name} • {pref.genre}
                    {pref.file_path && <Chip size="small" label="Playable" sx={{ ml: 1 }} color="success" variant="outlined" />}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ 
      height: '70vh', 
      width: '100%', 
      position: 'relative',
      display: 'flex',
      flexDirection: isDesktop ? 'row' : 'column',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: 2
    }}>
      {error && (
        <Alert severity="error" sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, maxWidth: '80%' }}>
          {error}
        </Alert>
      )}
      
      {/* Sidebar for desktop */}
      {isDesktop && (
        <Card sx={{ 
          width: 320, 
          height: '100%', 
          overflowY: 'auto', 
          borderRadius: 0,
          borderRight: `1px solid ${theme.palette.divider}`
        }}>
          <CardHeader 
            title="Nearby Music Lovers" 
            action={loadingUsers && <CircularProgress size={24} color="primary" />}
          />
          <Divider />
          <List sx={{ py: 0 }}>
            {loadingUsers ? (
              renderUserListSkeleton()
            ) : users.length === 0 ? (
              <ListItem>
                <ListItemText primary="No users found nearby" secondary="Try expanding your search radius" />
              </ListItem>
            ) : (
              users.map((user) => (
                <ListItem key={user.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleUserSelect(user)}
                    selected={selectedUser?.id === user.id}
                    sx={{
                      borderLeft: selectedUser?.id === user.id ? `4px solid ${theme.palette.primary.main}` : 'none'
                    }}
                  >
                    <ListItemText 
                      primary={user.username}
                      secondary={`${user.music_preferences.length} music preferences`}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </Card>
      )}
      
      {/* Map container */}
      <Box sx={{ flex: 1, height: '100%', position: 'relative' }}>
        {loadingLocation && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} />
              <Typography sx={{ mt: 2, color: 'white' }}>Loading map...</Typography>
            </Box>
          </Box>
        )}
        
        {mapComponent}
        
        {/* Show selected user details on mobile */}
        {!isDesktop && selectedUser && renderSelectedUserDetails()}
      </Box>
      
      {/* Track options menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleAddToQueue}>Add to Queue</MenuItem>
        <MenuItem onClick={handleAddToPlaylist}>Add to Playlist</MenuItem>
      </Menu>
    </Box>
  );
};

export default Map; 