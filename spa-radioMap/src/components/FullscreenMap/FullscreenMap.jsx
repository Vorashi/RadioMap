import React, { useEffect } from 'react';
import './FullscreenMap.css';

const FullscreenMap = ({ isFullscreen, toggleFullscreen, mapRef }) => {
    useEffect(() => {
        if (isFullscreen) {
            // Получаем текущий элемент карты
            const mapElement = mapRef.current;
            if (!mapElement) return;

            // Создаем клон элемента карты
            const mapClone = mapElement.cloneNode(true);
            mapClone.id = 'fullscreen-map-clone';
            mapClone.style.position = 'fixed';
            mapClone.style.top = '0';
            mapClone.style.left = '0';
            mapClone.style.width = '100vw';
            mapClone.style.height = '100vh';
            mapClone.style.zIndex = '1000';
            mapClone.style.backgroundColor = 'white';

            // Создаем кнопку закрытия
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.position = 'fixed';
            closeButton.style.top = '20px';
            closeButton.style.right = '20px';
            closeButton.style.zIndex = '1001';
            closeButton.style.fontSize = '24px';
            closeButton.style.background = 'rgba(255,255,255,0.7)';
            closeButton.style.border = 'none';
            closeButton.style.borderRadius = '50%';
            closeButton.style.width = '40px';
            closeButton.style.height = '40px';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = toggleFullscreen;

            // Добавляем элементы в DOM
            document.body.appendChild(mapClone);
            document.body.appendChild(closeButton);

            // Блокируем прокрутку страницы
            document.body.style.overflow = 'hidden';

            return () => {
                // Очистка при размонтировании
                document.body.style.overflow = '';
                document.getElementById('fullscreen-map-clone')?.remove();
                closeButton.remove();
            };
        }
    }, [isFullscreen, toggleFullscreen, mapRef]);

    return (
        <div className={`map-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
            <div 
                ref={mapRef} 
                className="map-container"
                style={{ height: isFullscreen ? '100vh' : '50vh' }}
            />
            <button 
                className="fullscreen-button"
                onClick={toggleFullscreen}
            >
                {isFullscreen ? (
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                    </svg>
                )}
            </button>
        </div>
    );
};

export default FullscreenMap;