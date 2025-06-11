import React, { useEffect, useRef } from 'react';
import './FullscreenMap.css';

const FullscreenMap = ({ isFullscreen, toggleFullscreen, mapRef, map, onReset, isLoading }) => {
    const buttonRef = useRef(null);
    const cleanupRef = useRef(null);
    const originalStylesRef = useRef(null);

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
            // Сохраняем оригинальные стили перед входом в полноэкранный режим
            originalStylesRef.current = {
                position: mapContainer.style.position,
                top: mapContainer.style.top,
                left: mapContainer.style.left,
                width: mapContainer.style.width,
                height: mapContainer.style.height,
                zIndex: mapContainer.style.zIndex,
                marginBottom: mapContainer.style.marginBottom
            };

            // Применяем полноэкранные стили
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
                // Восстанавливаем оригинальные стили
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

    return (
        <div className={`map-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
            <div 
                ref={mapRef} 
                className="map-container"
            />
            
            <div className={`map-controls-group ${isFullscreen ? 'fullscreen-controls' : ''}`}>
                <div className="map-actions-container">
                    <button 
                        onClick={onReset} 
                        className="reset-button"
                        disabled={isLoading}
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
                    >
                        <span className="button-icon">+</span>
                    </button>
                    <button 
                        className="map-control-button zoom-out-button"
                        onClick={handleZoomOut}
                        aria-label="Уменьшить масштаб"
                        title="Уменьшить масштаб"
                    >
                        <span className="button-icon">−</span>
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