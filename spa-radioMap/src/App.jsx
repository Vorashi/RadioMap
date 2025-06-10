import React, { useState, useEffect } from 'react';
import { useMap } from './hooks/useMap';
import { useDroneSelection } from './hooks/useDroneSelection';
import { useLocationSearch } from './hooks/useLocationSearch';
import { useRouteCalculation } from './hooks/useRouteCalculation';
import MapControls from './components/MapControls/MapControls';
import SearchLocation from './components/SearchLocation/SearchLocation';
import FullscreenMap from './components/FullscreenMap/FullscreenMap';
import DronesList from './components/DronesList/DronesList';
import './App.css';

const App = () => {
    const { map, mapRef } = useMap();
    const { selectedDrone, setSelectedDrone } = useDroneSelection();
    const [isLoading, setIsLoading] = useState(false);
    const [isMapFullscreen, setIsMapFullscreen] = useState(false);
    
    const locationSearch = useLocationSearch(map);
    const routeCalculation = useRouteCalculation(map, selectedDrone, setIsLoading);

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
                <MapControls 
                    onReset={routeCalculation.clearAllLayers} 
                    isLoading={isLoading} 
                />
            </div>

              <FullscreenMap 
                isFullscreen={isMapFullscreen} 
                toggleFullscreen={() => setIsMapFullscreen(!isMapFullscreen)}
                mapRef={mapRef}
            	/>

            <DronesList 
                selectedDrone={selectedDrone} 
                onSelectDrone={setSelectedDrone} 
            />
        </div>
    );
};

export default App;