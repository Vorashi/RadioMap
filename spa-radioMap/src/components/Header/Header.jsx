import React, { useState, useEffect } from 'react';
import { Link } from 'react-scroll';
import './Header.css';
import logo from '../../assets/drone-map-logo.svg';

const Header = ({ showManagement, setShowManagement, isMapFullscreen }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowScrollButton(window.scrollY > window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleManagementClick = () => {
    if (!showManagement) {
      setShowManagement(true);
      setTimeout(() => {
        const element = document.getElementById('management-section');
        if (element) {
          window.scrollTo({
            top: element.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  if (isMapFullscreen) return null;

  return (
    <>
      <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <img src={logo} alt="Drone App Logo" className="logo" />
          
          <nav className="header-nav">
            <Link to="map-section" smooth={true} duration={800} offset={-80} className="nav-link">
              Карта
            </Link>
            <Link to="search-section" smooth={true} duration={800} offset={-80} className="nav-link">
              Поиск
            </Link>
            <Link to="drones-section" smooth={true} duration={800} offset={-80} className="nav-link">
              Дроны
            </Link>
            <Link to="analysis-section" smooth={true} duration={800} offset={-80} className="nav-link">
              Анализ
            </Link>
            <button 
              onClick={handleManagementClick}
              className={`nav-link ${showManagement ? 'active' : ''}`}
            >
              Управление
            </button>
          </nav>
        </div>
      </header>

      {showScrollButton && !isMapFullscreen && (
        <button 
          onClick={scrollToTop} 
          className="scroll-to-top-button"
          aria-label="Наверх"
        >
          ↑
        </button>
      )}
    </>
  );
};

export default Header;