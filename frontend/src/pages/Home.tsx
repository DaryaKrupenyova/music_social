import { Typography, Box, Button, Card, CardContent, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Share Your Music',
      description: 'Add your favorite tracks, artists, and genres to your profile.',
      icon: <MusicNoteIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
    },
    {
      title: 'Connect with People',
      description: 'Find like-minded music lovers with similar tastes.',
      icon: <PeopleIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
    },
    {
      title: 'Discover Nearby',
      description: 'Use geolocation to find music enthusiasts in your area.',
      icon: <LocationOnIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 4, md: 8 },
          mb: 8,
        }}
      >
        <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Connect Through Music
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Share your musical taste and discover people with similar preferences in your area.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/map')}
            >
              Explore Map
            </Button>
          </Box>
        </Box>

        <Box sx={{ 
          flex: 1, 
          display: { xs: 'none', md: 'flex' },
          justifyContent: 'center'
        }}>
          <Box 
            component="img"
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1470&auto=format&fit=crop"
            alt="People enjoying music"
            sx={{
              width: '100%',
              maxWidth: 500,
              height: 'auto',
              borderRadius: 4,
              boxShadow: 5,
            }}
          />
        </Box>
      </Box>

      {/* Features Section */}
      <Typography variant="h3" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        How It Works
      </Typography>
      
      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
              <Box sx={{ p: 2 }}>
                {feature.icon}
              </Box>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Home; 