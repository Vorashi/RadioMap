import React, { useState, useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point, LineString } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Icon, Stroke, Fill } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
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
    const mapRef = useRef(null);
    const layersRef = useRef({
        startMarker: null,
        endMarker: null,
        radiusLayer: null,
        lineLayer: null
    });

    // Инициализация карты
    useEffect(() => {
        const newMap = new Map({
            target: mapRef.current,
            layers: [new TileLayer({ source: new OSM() })],
            view: new View({ 
                center: fromLonLat([37.6, 55.7]), // Москва
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
            lineLayer: null
        };
    };

    // Расчет расстояния
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Радиус Земли в км
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
        if (radius === null) return true; // Особый дрон без ограничений
        const [centerLon, centerLat] = toLonLat(center);
        const [pointLon, pointLat] = toLonLat(point);
        return getDistance(centerLat, centerLon, pointLat, pointLon) <= radius;
    };

    // Создание кругового полигона
    const createRadiusPolygon = (center, radius) => {
        const coordinates = [];
        const [lon, lat] = toLonLat(center);
        const R = 6371; // Радиус Земли в км
        
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

    // Обновление радиуса при смене дрона
    const updateRadius = () => {
        if (!map || !layersRef.current.startMarker) return;
        
        // Удаляем старый радиус
        if (layersRef.current.radiusLayer) {
            map.removeLayer(layersRef.current.radiusLayer);
        }
        
        const startCoords = layersRef.current.startMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
        
        // Если у дрона есть радиус - создаем новый
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
        
        // Проверяем конечную точку (если она есть)
        if (layersRef.current.endMarker) {
            const endCoords = layersRef.current.endMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
            
            if (selectedDrone.range !== null && !isPointInRadius(startCoords, endCoords, selectedDrone.range)) {
                // Удаляем конечную точку и линию, так как она вне нового радиуса
                map.removeLayer(layersRef.current.endMarker);
                map.removeLayer(layersRef.current.lineLayer);
                layersRef.current.endMarker = null;
                layersRef.current.lineLayer = null;
            }
        }
    };

    // Обработчик клика
    const handleMapClick = (event) => {
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

        // Стартовая точка
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

            // Создаем радиус если у дрона есть ограничение
            if (selectedDrone.range !== null) {
                updateRadius();
            }
        }
        // Конечная точка
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

            // Линия между точками
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
        }
    };

    // Подписка на события
    useEffect(() => {
        if (!map) return;
        
        const clickHandler = (event) => handleMapClick(event);
        map.on('click', clickHandler);
        
        return () => {
            map.un('click', clickHandler);
        };
    }, [map, selectedDrone]);

    // Обновляем радиус при смене дрона
    useEffect(() => {
        if (layersRef.current.startMarker) {
            updateRadius();
            
            // Если есть конечная точка, но дрон теперь без ограничений - просто обновляем радиус
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