import { useRef, useCallback, useState } from 'react';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Icon, Stroke, Fill, Text } from 'ol/style';
import { toLonLat } from 'ol/proj';
import { createRadiusPolygon, getDistance } from '../utils/geoUtils';
import { fetchElevationData } from '../utils/api';
import { useRadioAnalysis } from './useRadioAnalysis';

export const useRouteCalculation = (
    map, 
    selectedDrone, 
    setIsLoading, 
    setNotification,
    setElevationPoints,
    setShowLegend
) => {
    const layersRef = useRef({
        startMarker: null,
        endMarker: null,
        radiusLayer: null,
        lineLayer: null,
        elevationMarkers: null,
        hoverMarker: null
    });

    const [radioAnalysis, setRadioAnalysis] = useState(null);
    const { analyzeRoute } = useRadioAnalysis();

    const clearAllLayers = useCallback(() => {
        if (!map) return;
        
        Object.values(layersRef.current).forEach(layer => {
            if (layer) map.removeLayer(layer);
        });
        
        layersRef.current = {
            startMarker: null,
            endMarker: null,
            radiusLayer: null,
            lineLayer: null,
            elevationMarkers: null,
            hoverMarker: null
        };
        setRadioAnalysis(null);
        setElevationPoints([]);
    }, [map, setElevationPoints]);

    const updateRadius = useCallback(() => {
        if (!map || !layersRef.current.startMarker) return;
        
        if (layersRef.current.radiusLayer) {
            map.removeLayer(layersRef.current.radiusLayer);
        }
        
        const startCoords = layersRef.current.startMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
        
        if (selectedDrone?.range !== null) {
            const radiusCoords = createRadiusPolygon(startCoords, selectedDrone.range);
            const radiusFeature = new Feature({
                geometry: new LineString(radiusCoords)
            });

            const radiusLayer = new VectorLayer({
                source: new VectorSource({ features: [radiusFeature] }),
                style: new Style({
                    stroke: new Stroke({
                        color: 'rgba(0, 0, 255, 0.7)',
                        width: 2
                    }),
                    fill: new Fill({
                        color: 'rgba(0, 0, 255, 0.1)'
                    })
                }),
                zIndex: 1
            });
            
            map.addLayer(radiusLayer);
            layersRef.current.radiusLayer = radiusLayer;
        }
    }, [map, selectedDrone]);

    const showElevationPoints = useCallback((points) => {
        if (!map || !points.length) return;
        
        if (layersRef.current.elevationMarkers) {
            map.removeLayer(layersRef.current.elevationMarkers);
        }
        
        const features = points.map(point => {
            const feature = new Feature({
                geometry: new Point(point.coords),
                elevation: point.elevation
            });
            
            feature.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/484/484167.png',
                    scale: 0.03,
                    anchor: [0.5, 1],
                })
            }));
            
            return feature;
        });
        
        const markersLayer = new VectorLayer({
            source: new VectorSource({ features }),
            zIndex: 3
        });
        
        map.addLayer(markersLayer);
        layersRef.current.elevationMarkers = markersLayer;
    }, [map]);

    const showHoverMarker = useCallback((point) => {
        if (!map) return;
        
        if (layersRef.current.hoverMarker) {
            map.removeLayer(layersRef.current.hoverMarker);
        }
        
        if (!point) return;
        
        const feature = new Feature({
            geometry: new Point(point.coords)
        });
        
        feature.setStyle(new Style({
            text: new Text({
                text: `${point.elevation}m`,
                offsetY: -20,
                font: 'bold 14px Arial',
                fill: new Fill({ color: '#000' }),
                stroke: new Stroke({ color: '#fff', width: 3 })
            })
        }));
        
        const markerLayer = new VectorLayer({
            source: new VectorSource({ features: [feature] }),
            zIndex: 4
        });
        
        map.addLayer(markerLayer);
        layersRef.current.hoverMarker = markerLayer;
    }, [map]);

    const styleRouteSegments = useCallback((analysis) => {
        if (!map || !analysis || !layersRef.current.lineLayer) return;
        
        const source = layersRef.current.lineLayer.getSource();
        const line = source.getFeatures()[0];
        
        const styles = analysis.map(segment => {
            let color;
            if (segment.isCritical) {
                color = 'rgba(255, 0, 0, 0.7)';
            } else if (!segment.hasLOS) {
                color = 'rgba(255, 165, 0, 0.7)';
            } else {
                color = 'rgba(0, 255, 0, 0.7)';
            }
            
            return new Style({
                stroke: new Stroke({
                    color,
                    width: 3,
                    lineDash: segment.isCritical ? [5, 5] : undefined
                })
            });
        });
        
        line.setStyle(styles);
    }, [map]);

    const handleMapClick = useCallback(async (event) => {
        if (!selectedDrone) {
            setNotification({
                isOpen: true,
                message: 'Сначала выберите дрон!',
                type: 'warning'
            });
            return;
        }

        const coordinates = event.coordinate;
        const [lng, lat] = toLonLat(coordinates);

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            setNotification({
                isOpen: true,
                message: 'Координаты вне допустимого диапазона!',
                type: 'error'
            });
            return;
        }

        if (!layersRef.current.startMarker) {
            const marker = new Feature({
                geometry: new Point(coordinates)
            });
            
            marker.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                    scale: 0.05,
                    anchor: [0.5, 1],
                })
            }));

            const markerLayer = new VectorLayer({
                source: new VectorSource({ features: [marker] }),
                zIndex: 2
            });
            
            map.addLayer(markerLayer);
            layersRef.current.startMarker = markerLayer;

            if (selectedDrone.range !== null) {
                updateRadius();
            }

            map.getView().animate({
                center: coordinates,
                zoom: 14,
                duration: 1000
            });

        } else if (!layersRef.current.endMarker) {
            const startCoords = layersRef.current.startMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
            const [startLng, startLat] = toLonLat(startCoords);
            
            const distance = getDistance(startLat, startLng, lat, lng);

            if (selectedDrone.range !== null && distance > selectedDrone.range) {
                setNotification({
                    isOpen: true,
                    message: `Точка должна быть в пределах ${selectedDrone.range} км от старта!`,
                    type: 'warning'
                });
                return;
            }

            const marker = new Feature({
                geometry: new Point(coordinates)
            });
            
            marker.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                    scale: 0.05,
                    anchor: [0.5, 1],
                })
            }));

            const markerLayer = new VectorLayer({
                source: new VectorSource({ features: [marker] }),
                zIndex: 2
            });
            
            map.addLayer(markerLayer);
            layersRef.current.endMarker = markerLayer;

            const line = new Feature({
                geometry: new LineString([startCoords, coordinates])
            });

            const lineLayer = new VectorLayer({
                source: new VectorSource({ features: [line] }),
                zIndex: 1
            });
            
            map.addLayer(lineLayer);
            layersRef.current.lineLayer = lineLayer;

            const extent = line.getGeometry().getExtent();
            map.getView().fit(extent, {
                padding: [50, 50, 50, 50],
                duration: 1000,
                maxZoom: 14
            });

            setIsLoading(true);
            try {
                const elevationPoints = await fetchElevationData(startCoords, coordinates);
                setElevationPoints(elevationPoints);
                showElevationPoints(elevationPoints);
                
                const radioAnalysisResults = await analyzeRoute(
                    elevationPoints.map(p => ({
                        lat: toLonLat(p.coords)[1],
                        lng: toLonLat(p.coords)[0],
                        elevation: p.elevation
                    })),
                    selectedDrone.range,
                    selectedDrone.frequency
                );
                
                setRadioAnalysis(radioAnalysisResults);
                styleRouteSegments(radioAnalysisResults);
                setShowLegend(true);
            } catch (error) {
                console.error('Error calculating route:', error);
                setNotification({
                    isOpen: true,
                    message: 'Ошибка при расчете маршрута',
                    type: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        }
    }, [map, selectedDrone, updateRadius, showElevationPoints, setIsLoading, setNotification, analyzeRoute, styleRouteSegments, setElevationPoints, setShowLegend]);

    return {
        layersRef,
        radioAnalysis,
        clearAllLayers,
        handleMapClick,
        showHoverMarker,
        updateRadius,
        styleRouteSegments
    };
};