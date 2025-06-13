import React, { useState, useEffect, useCallback } from 'react';
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
import DroneManagement from './components/DroneManagement/DroneManagement';
import Header from './components/Header/Header';
import './App.css';

const App = () => {
  const { 
    map, 
    mapRef,
    currentStyle,
    toggleMapStyle,
    mapStyles,
    obstaclesLayer,
    isMapLoaded,
    loadingProgress
  } = useMap();
  
  const { selectedDrone, setSelectedDrone, drones, loading, error } = useDroneSelection();
  const [isLoading, setIsLoading] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    message: '',
    type: 'info'
  });
  const [elevationPoints, setElevationPoints] = useState([]);
  const [showLegend, setShowLegend] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  
  const locationSearch = useLocationSearch(map, setNotification);
  const routeCalculation = useRouteCalculation(
    map, 
    selectedDrone, 
    setIsLoading, 
    setNotification,
    setElevationPoints,
    setShowLegend
  );

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleToggleMapStyle = useCallback(() => {
    toggleMapStyle();
    routeCalculation.clearAllLayers();
    setShowLegend(false);
    setElevationPoints([]);
  }, [toggleMapStyle, routeCalculation]);

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
    if (!map || !routeCalculation.layersRef.current.startMarker) {
      setShowLegend(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      // eslint-disable-next-line no-unused-vars
      const extent = map.getView().calculateExtent(map.getSize());
      if (obstaclesLayer) {
        obstaclesLayer.getSource().clear();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, obstaclesLayer, routeCalculation.layersRef.current.startMarker]);

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
    <div className="app-container" style={{ paddingTop: '80px' }}>
  		<Header showManagement={showManagement} setShowManagement={setShowManagement} />
  
		<section id="search-section">
			<div className="controls">
				<SearchLocation {...locationSearch} />
			</div>
		</section>

			<section id="map-section">
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
						currentStyle={currentStyle}
						toggleMapStyle={handleToggleMapStyle}
						mapStyles={mapStyles}
						isMapLoaded={isMapLoaded}
						loadingProgress={loadingProgress}
					>
						<RadioAnalysisLegend visible={showLegend} />
					</FullscreenMap>
				</section>

				{showLegend && elevationPoints.length > 0 && (
					<section id="analysis-section">
						<ElevationProfile 
							elevationData={elevationPoints} 
							radioAnalysis={routeCalculation.radioAnalysis} 
						/>
					</section>
      	)}

			<section id="drones-section">
				<DronesList 
					selectedDrone={selectedDrone} 
					onSelectDrone={setSelectedDrone}
					drones={drones}
					loading={loading}
					error={error} 
				/>
			</section>

      <button 
        onClick={() => setShowManagement(!showManagement)}
        className="management-toggle"
      >
        {showManagement ? 'Закрыть управление' : 'Управление дронами'}
      </button>
      
      {showManagement && (
				<section id="management-section">
					<DroneManagement />
				</section>
			)}

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