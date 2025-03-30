import React, { useState, useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point, LineString } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Icon, Stroke, Fill, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import axios from 'axios';
import 'ol/ol.css';
import './App.css';

const drones = [
    { name: 'Дрон A', range: 10 },
    { name: 'Дрон B', range: 50 },
    { name: 'Дрон C', range: 100 },
    { name: 'Дрон D', range: 1000 },
    { name: 'Особый дрон', range: null },
];

const App = () => {
    const [map, setMap] = useState(null);
    const [selectedDrone, setSelectedDrone] = useState(drones[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const mapRef = useRef(null);
    const layersRef = useRef({
        startMarker: null,
        endMarker: null,
        radiusLayer: null,
        lineLayer: null,
        elevationMarkers: null,
        hoverMarker: null
    });

    // Инициализация карты
    useEffect(() => {
        const newMap = new Map({
            target: mapRef.current,
            layers: [new TileLayer({ source: new OSM() })],
            view: new View({ 
                center: fromLonLat([37.6, 55.7]),
                zoom: 10 
            }),
        });
        setMap(newMap);
        return () => newMap.setTarget(undefined);
    }, []);

    // Очистка всех слоев
    const clearAllLayers = () => {
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
        setHoveredPoint(null);
    };

    // Расчет расстояния
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI/180;
        const dLon = (lon2 - lon1) * Math.PI/180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * 
            Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Проверка точки на попадание в радиус
    const isPointInRadius = (center, point, radius) => {
        if (radius === null) return true;
        const [centerLon, centerLat] = toLonLat(center);
        const [pointLon, pointLat] = toLonLat(point);
        return getDistance(centerLat, centerLon, pointLat, pointLon) <= radius;
    };

    // Создание кругового полигона
    const createRadiusPolygon = (center, radius) => {
        const coordinates = [];
        const [lon, lat] = toLonLat(center);
        const R = 6371;
        
        for (let i = 0; i <= 360; i++) {
            const angle = i * Math.PI / 180;
            const lat2 = Math.asin(Math.sin(lat * Math.PI/180) * 
                         Math.cos(radius/R) + 
                         Math.cos(lat * Math.PI/180) * 
                         Math.sin(radius/R) * 
                         Math.cos(angle));
            const lon2 = lon * Math.PI/180 + Math.atan2(
                Math.sin(angle) * Math.sin(radius/R) * Math.cos(lat * Math.PI/180),
                Math.cos(radius/R) - Math.sin(lat * Math.PI/180) * Math.sin(lat2)
            );
            coordinates.push(fromLonLat([lon2 * 180/Math.PI, lat2 * 180/Math.PI]));
        }
        
        return coordinates;
    };

    // Получение высот точек вдоль маршрута
    const fetchElevationData = async (start, end) => {
        setIsLoading(true);
        try {
            const [startLon, startLat] = toLonLat(start);
            const [endLon, endLat] = toLonLat(end);
            
            const distance = getDistance(startLat, startLon, endLat, endLon);
            const numPoints = Math.max(3, Math.min(20, Math.floor(distance * 2)));
            
            const points = [];
            for (let i = 0; i <= numPoints; i++) {
                const ratio = i / numPoints;
                const lat = startLat + (endLat - startLat) * ratio;
                const lon = startLon + (endLon - startLon) * ratio;
                points.push({ lat, lng: lon });
            }
            
            const response = await axios.post('http://localhost:5000/elevation', { points });
            const elevations = response.data.elevations;
            
            const filteredPoints = [];
            let lastElevation = null;
            
            for (let i = 0; i < points.length; i++) {
                const currentElevation = Math.round(elevations[i]);
                if (currentElevation !== lastElevation || i === 0 || i === points.length - 1) {
                    filteredPoints.push({
                        coords: fromLonLat([points[i].lng, points[i].lat]),
                        elevation: currentElevation
                    });
                    lastElevation = currentElevation;
                }
            }
            
            return filteredPoints;
        } catch (error) {
            console.error('Error fetching elevation data:', error);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // Отображение точек с высотами
    const showElevationPoints = (points) => {
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
        
        // Настройка zoom на маршрут
        const lineCoords = [
            points[0].coords,
            points[points.length - 1].coords
        ];
        
        const lineExtent = new LineString(lineCoords).getExtent();
        map.getView().fit(lineExtent, {
            padding: [50, 50, 50, 50],
            duration: 1000
        });
    };

    // Показ высоты при наведении
    const showHoverMarker = (point) => {
        if (!map) return;
        
        if (layersRef.current.hoverMarker) {
            map.removeLayer(layersRef.current.hoverMarker);
        }
        
        if (!point) {
            setHoveredPoint(null);
            return;
        }
        
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
        setHoveredPoint(point);
    };

    // Обновление радиуса при смене дрона
    const updateRadius = () => {
        if (!map || !layersRef.current.startMarker) return;
        
        if (layersRef.current.radiusLayer) {
            map.removeLayer(layersRef.current.radiusLayer);
        }
        
        const startCoords = layersRef.current.startMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
        
        if (selectedDrone.range !== null) {
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
        
        if (layersRef.current.endMarker) {
            const endCoords = layersRef.current.endMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
            
            if (selectedDrone.range !== null && !isPointInRadius(startCoords, endCoords, selectedDrone.range)) {
                map.removeLayer(layersRef.current.endMarker);
                map.removeLayer(layersRef.current.lineLayer);
                if (layersRef.current.elevationMarkers) {
                    map.removeLayer(layersRef.current.elevationMarkers);
                }
                layersRef.current.endMarker = null;
                layersRef.current.lineLayer = null;
                layersRef.current.elevationMarkers = null;
                setHoveredPoint(null);
            }
        }
    };

    // Обработчик клика
    const handleMapClick = async (event) => {
        if (!selectedDrone) {
            alert('Сначала выберите дрон!');
            return;
        }

        const coordinates = event.coordinate;
        const [lng, lat] = toLonLat(coordinates);

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            alert('Координаты вне допустимого диапазона!');
            return;
        }

        if (!layersRef.current.startMarker) {
            const marker = new Feature({
                geometry: new Point(coordinates)
            });
            
            marker.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/4764/4764087.png',
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
        }
        else if (!layersRef.current.endMarker) {
            const startCoords = layersRef.current.startMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
            const [startLng, startLat] = toLonLat(startCoords);
            
            const distance = getDistance(startLat, startLng, lat, lng);

            if (selectedDrone.range !== null && distance > selectedDrone.range) {
                alert(`Точка должна быть в пределах ${selectedDrone.range} км от старта!`);
                return;
            }

            const marker = new Feature({
                geometry: new Point(coordinates)
            });
            
            marker.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/103/103228.png',
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
                style: new Style({
                    stroke: new Stroke({
                        color: '#3887be',
                        width: 3
                    })
                }),
                zIndex: 1
            });
            
            map.addLayer(lineLayer);
            layersRef.current.lineLayer = lineLayer;

            const elevationPoints = await fetchElevationData(startCoords, coordinates);
            showElevationPoints(elevationPoints);
        }
    };

    // Подписка на события
    useEffect(() => {
        if (!map) return;
        
        const clickHandler = (event) => handleMapClick(event);
        map.on('click', clickHandler);
        
        // Обработчик наведения на точки высот
        const pointerMoveHandler = (event) => {
            if (!layersRef.current.elevationMarkers) return;
            
            const features = map.getFeaturesAtPixel(event.pixel, {
                layerFilter: layer => layer === layersRef.current.elevationMarkers,
                hitTolerance: 10
            });
            
            if (features && features.length > 0) {
                const feature = features[0];
                showHoverMarker({
                    coords: feature.getGeometry().getCoordinates(),
                    elevation: feature.get('elevation')
                });
            } else {
                showHoverMarker(null);
            }
        };
        
        map.on('pointermove', pointerMoveHandler);
        
        return () => {
            map.un('click', clickHandler);
            map.un('pointermove', pointerMoveHandler);
        };
    }, [map, selectedDrone]);

    // Обновляем радиус при смене дрона
    useEffect(() => {
        if (layersRef.current.startMarker) {
            updateRadius();
            
            if (selectedDrone.range === null && layersRef.current.radiusLayer) {
                map.removeLayer(layersRef.current.radiusLayer);
                layersRef.current.radiusLayer = null;
            }
        }
    }, [selectedDrone]);

    return (
        <div className="app-container">
            <h1>Маршрут дрона</h1>
            <div className="controls">
                <label>Выберите дрон: </label>
                <select 
                    onChange={(e) => {
                        setSelectedDrone(drones[e.target.value]);
                    }}
                    className="drone-select"
                >
                    {drones.map((drone, index) => (
                        <option key={index} value={index}>
                            {drone.name} {drone.range ? `(${drone.range} км)` : ''}
                        </option>
                    ))}
                </select>
                <button 
                    onClick={clearAllLayers}
                    className="reset-button"
                >
                    Сбросить
                </button>
                {isLoading && <div className="loading">Загрузка данных о высотах...</div>}
            </div>
            <div 
                ref={mapRef} 
                className="map-container"
                style={{ height: 'calc(100vh - 120px)' }}
            />
        </div>
    );
};

export default App;