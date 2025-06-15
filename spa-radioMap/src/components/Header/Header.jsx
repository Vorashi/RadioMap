import React, { useState, useEffect } from 'react';
import { Link } from 'react-scroll';
import './Header.css';
import logo from '../../assets/drone-map-logo.png';
import GithubIcon from '../../assets/github-logo-icons.svg';
import SunIcon from '../../assets/icons8-sun.svg';
import MoonIcon from '../../assets/clear-night-weather-symbol-of-crescent-moon-with-stars_icon-icons.com_64205.svg';
import GlobeIcon from '../../assets/languages-svgrepo-com.svg';

const Header = ({ showManagement, setShowManagement, isMapFullscreen }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('ru');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-theme');
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    setShowLanguageDropdown(false);
    // Здесь можно добавить логику смены языка
  };

  if (isMapFullscreen) return null;

  return (
    <>
      <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <img src={logo} alt="Drone App Logo" className="logo" />
          
          <nav className="header-nav">
            <Link to="map-section" smooth={true} duration={800} offset={-80} className="nav-link">
              {language === 'ru' ? 'Карта' : 'Map'}
            </Link>
            <Link to="search-section" smooth={true} duration={800} offset={-80} className="nav-link">
              {language === 'ru' ? 'Поиск' : 'Search'}
            </Link>
            <Link to="drones-section" smooth={true} duration={800} offset={-80} className="nav-link">
              {language === 'ru' ? 'Дроны' : 'Drones'}
            </Link>
            <Link to="analysis-section" smooth={true} duration={800} offset={-80} className="nav-link">
              {language === 'ru' ? 'Анализ' : 'Analysis'}
            </Link>
            <button 
              onClick={handleManagementClick}
              className={`nav-link ${showManagement ? 'active' : ''}`}
            >
              {language === 'ru' ? 'Управление' : 'Management'}
            </button>
          </nav>

          <div className="header-right-controls">
            <a 
              href="https://github.com/Vorashi/RadioMap" 
              target="_blank" 
              rel="noopener noreferrer"
              className="github-link"
            >
              <img src={GithubIcon} alt="Ссылка на Github" className="icon" />
            </a>
            
            <button 
              onClick={toggleDarkMode}
              className="theme-toggle"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <img src={SunIcon} className="icon" /> : <img src={MoonIcon} className="icon" />}
            </button>
            
            <div className="language-selector">
              <button 
                className="language-toggle"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              >
                <img src={GlobeIcon} alt='Изменение языка' className="icon" />
                <span>{language.toUpperCase()}</span>
              </button>
              
              {showLanguageDropdown && (
                <div className="language-dropdown">
                  <button onClick={() => changeLanguage('ru')}>Русский</button>
                  <button onClick={() => changeLanguage('en')}>English</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showScrollButton && !isMapFullscreen && (
        <button 
          onClick={scrollToTop} 
          className="scroll-to-top-button"
          aria-label={language === 'ru' ? 'Наверх' : 'To top'}
        >
          ↑
        </button>
      )}
    </>
  );
};

export default Header;