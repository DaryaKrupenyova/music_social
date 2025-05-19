import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import type { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container 
        component="main" 
        maxWidth={isDesktop ? "lg" : "sm"}
        sx={{ 
          flexGrow: 1, 
          py: 4,
          px: isDesktop ? 4 : 2,
          mt: 2,
          width: '100%',
          maxWidth: isDesktop ? '1200px' : '100%',
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout; 