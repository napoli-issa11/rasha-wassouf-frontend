import React from 'react';
import { Box } from '@mui/material';
import Navbar from '../../components/layout/Navbar';
import HeroSection from '../../components/sections/HeroSection';
import CategoriesSection from '../../components/sections/CategoriesSection';
import AboutSection from '../../components/sections/AboutSection';
import ContactSection from '../../components/sections/ContactSection';
import Footer from '../../components/layout/Footer';

export const Home: React.FC = () => {
  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh' }}>
      {/* Fixed Luxury Responsive Navbar */}
      <Navbar />

      {/* Main Single Page Application Content */}
      <Box component="main">
        {/* 1. Hero Section (id="home") */}
        <HeroSection />

        {/* 2. Categories & Dynamic Projects Section (id="categories") */}
        <CategoriesSection />

        {/* 3. About Section (id="about") */}
        <AboutSection />

        {/* 4. Contact & Consultation Section (id="contact") */}
        <ContactSection />
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default Home;
