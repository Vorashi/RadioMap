import React, { useEffect, useRef, useState } from 'react';
import './FullscreenMap.css';

const FullscreenMap = ({ 
  isFullscreen, 
  toggleFullscreen, 
  mapRef, 
  map, 
  onReset, 
  isLoading,
  children,
  currentStyle,
  toggleMapStyle,
  mapStyles,
  isMapLoaded,
  loadingProgress
}) => {
  const buttonRef = useRef(null);
  const cleanupRef = useRef(null);
  const originalStylesRef = useRef(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer) return;

    const cleanup = () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };

    if (isFullscreen) {
      originalStylesRef.current = {
        position: mapContainer.style.position,
        top: mapContainer.style.top,
        left: mapContainer.style.left,
        width: mapContainer.style.width,
        height: mapContainer.style.height,
        zIndex: mapContainer.style.zIndex,
        marginBottom: mapContainer.style.marginBottom
      };

      Object.assign(mapContainer.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '1000',
        marginBottom: '0'
      });

      document.body.classList.add('fullscreen-map-active');

      cleanupRef.current = () => {
        if (originalStylesRef.current) {
          Object.assign(mapContainer.style, originalStylesRef.current);
        }
        document.body.classList.remove('fullscreen-map-active');
      };
    } else {
      cleanup();
    }

    return cleanup;
  }, [isFullscreen, mapRef]);

  useEffect(() => {
    const animateProgress = () => {
      setDisplayProgress(prev => {
        const nextProgress = Math.min(loadingProgress, prev + 1);
        if (nextProgress < loadingProgress) {
          animationRef.current = requestAnimationFrame(animateProgress);
        }
        return nextProgress;
      });
    };

    if (loadingProgress > displayProgress) {
      animationRef.current = requestAnimationFrame(animateProgress);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loadingProgress, displayProgress]);

  const handleZoomIn = () => {
    if (!map) return;
    const view = map.getView();
    const currentZoom = view.getZoom();
    view.animate({ zoom: currentZoom + 1, duration: 200 });
  };

  const handleZoomOut = () => {
    if (!map) return;
    const view = map.getView();
    const currentZoom = view.getZoom();
    view.animate({ zoom: currentZoom - 1, duration: 200 });
  };

  const getStyleIcon = () => {
    switch(currentStyle) {
      case 'topo': return '🗻';
      case 'satellite': return '🛰️';
      default: return '🌍';
    }
  };

  return (
    <div className={`map-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isMapLoaded && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner"></div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          <p>Загрузка карты: {Math.round(displayProgress)}%</p>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="map-container"
        style={{ visibility: isMapLoaded ? 'visible' : 'hidden' }}
      />
      {children}
      
      <div className={`map-controls-group ${isFullscreen ? 'fullscreen-controls' : ''}`}>
        <div className="map-actions-container">
          <button 
            onClick={onReset} 
            className="reset-button"
            disabled={isLoading || !isMapLoaded}
          >
            Сбросить маршрут
          </button>
          {isLoading && <div className="loading-indicator">Загрузка...</div>}
        </div>
        
        <div className="map-controls-container">
          <button 
            className="map-control-button zoom-in-button"
            onClick={handleZoomIn}
            aria-label="Увеличить масштаб"
            title="Увеличить масштаб"
            disabled={!isMapLoaded}
          >
            <span className="button-icon">+</span>
          </button>
          <button 
            className="map-control-button zoom-out-button"
            onClick={handleZoomOut}
            aria-label="Уменьшить масштаб"
            title="Уменьшить масштаб"
            disabled={!isMapLoaded}
          >
            <span className="button-icon">−</span>
          </button>
          <button 
            className="map-control-button style-toggle-button"
            onClick={toggleMapStyle}
            aria-label="Переключить стиль карты"
            title={`Текущий стиль: ${mapStyles[currentStyle].name}`}
            disabled={!isMapLoaded}
          >
            <span className="button-icon">{getStyleIcon()}</span>
          </button>
        </div>
      </div>

      <button
        ref={buttonRef}
        className={`fullscreen-toggle-button ${isFullscreen ? 'exit-fullscreen' : 'enter-fullscreen'}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFullscreen();
        }}
        aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
        disabled={!isMapLoaded}
      >
        {isFullscreen ? (
          <span className="button-icon">✕</span>
        ) : (
          <span className="button-icon">⛶</span>
        )}
      </button>
    </div>
  );
};

export default FullscreenMap;