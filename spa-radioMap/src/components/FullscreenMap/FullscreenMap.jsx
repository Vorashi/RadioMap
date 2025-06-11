import React, { useEffect, useRef } from 'react';
import './FullscreenMap.css';

const FullscreenMap = ({ isFullscreen, toggleFullscreen, mapRef }) => {
    const buttonRef = useRef(null);
    const cleanupRef = useRef(null);

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
            const originalStyles = {
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
                Object.assign(mapContainer.style, originalStyles);
                document.body.classList.remove('fullscreen-map-active');
            };
        } else {
            cleanup();
        }

        return cleanup;
    }, [isFullscreen, mapRef]);

    return (
        <div className={`map-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
            <div 
                ref={mapRef} 
                className="map-container"
                style={{ height: isFullscreen ? '100vh' : '50vh' }}
            />
            <button
                ref={buttonRef}
                className={`map-control-button ${isFullscreen ? 'exit-fullscreen-button' : 'enter-fullscreen-button'}`}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFullscreen();
                }}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
                {isFullscreen ? (
                    <span className="button-icon">×</span>
                ) : (
                    <span className="button-icon">⤢</span>
                )}
            </button>
        </div>
    );
};

export default FullscreenMap;