import React, { useState, useEffect } from 'react';
import { useMap } from './hooks/useMap';
import { useDroneSelection } from './hooks/useDroneSelection';
import { useLocationSearch } from './hooks/useLocationSearch';
import { useRouteCalculation } from './hooks/useRouteCalculation';
import SearchLocation from './components/SearchLocation/SearchLocation';
import FullscreenMap from './components/FullscreenMap/FullscreenMap';
import DronesList from './components/DronesList/DronesList';
import NotificationModal from './components/NotificationModal/NotificationModal';
import RadioAnalysisLegend from './components/RadioAnalysisLegend/RadioAnalysisLegend';
import ElevationProfile from './components/ElevationProfile/ElevationProfile';
import './App.css';

const App = () => {
    const { map, mapRef } = useMap();
    const { selectedDrone, setSelectedDrone } = useDroneSelection();
    const [isLoading, setIsLoading] = useState(false);
    const [isMapFullscreen, setIsMapFullscreen] = useState(false);
    const [notification, setNotification] = useState({
        isOpen: false,
        message: '',
        type: 'info'
    });
    const [elevationPoints, setElevationPoints] = useState([]);
    const [showLegend, setShowLegend] = useState(false);
    
    const locationSearch = useLocationSearch(map, setNotification);
    const routeCalculation = useRouteCalculation(
        map, 
        selectedDrone, 
        setIsLoading, 
        setNotification,
        setElevationPoints,
        setShowLegend
    );

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        if (!map) return;
        
        const clickHandler = (event) => routeCalculation.handleMapClick(event);
        map.on('click', clickHandler);
        
        const pointerMoveHandler = (event) => {
            if (!routeCalculation.layersRef.current.elevationMarkers) return;
            
            const features = map.getFeaturesAtPixel(event.pixel, {
                layerFilter: layer => layer === routeCalculation.layersRef.current.elevationMarkers,
                hitTolerance: 10
            });
            
            if (features && features.length > 0) {
                const feature = features[0];
                routeCalculation.showHoverMarker({
                    coords: feature.getGeometry().getCoordinates(),
                    elevation: feature.get('elevation')
                });
            } else {
                routeCalculation.showHoverMarker(null);
            }
        };
        
        map.on('pointermove', pointerMoveHandler);
        
        return () => {
            map.un('click', clickHandler);
            map.un('pointermove', pointerMoveHandler);
        };
    }, [map, routeCalculation]);

    useEffect(() => {
        if (map && routeCalculation.layersRef.current.startMarker) {
            routeCalculation.updateRadius();
            
            if (selectedDrone.range === null && routeCalculation.layersRef.current.radiusLayer) {
                map.removeLayer(routeCalculation.layersRef.current.radiusLayer);
                routeCalculation.layersRef.current.radiusLayer = null;
            }
        }
    }, [map, selectedDrone, routeCalculation]);

    return (
        <div className="app-container">
            <h1>Маршрут дрона</h1>
            
            <div className="controls">
                <SearchLocation {...locationSearch} /> 
            </div>

            <FullscreenMap 
                isFullscreen={isMapFullscreen}
                toggleFullscreen={() => setIsMapFullscreen(prev => !prev)}
                mapRef={mapRef}
                map={map}
                onReset={() => {
                    routeCalculation.clearAllLayers();
                    setShowLegend(false);
                    setElevationPoints([]);
                }}
                isLoading={isLoading}
            >
                <RadioAnalysisLegend visible={showLegend} />
            </FullscreenMap>

            {showLegend && (
                <ElevationProfile 
                    elevationData={elevationPoints} 
                    radioAnalysis={routeCalculation.radioAnalysis} 
                />
            )}

            <DronesList 
                selectedDrone={selectedDrone} 
                onSelectDrone={setSelectedDrone} 
            />

            <NotificationModal 
                isOpen={notification.isOpen}
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
            />
        </div>
    );
};

export default App;