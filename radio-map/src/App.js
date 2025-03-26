import React, { useState, useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point, Circle as CircleGeometry, LineString } from 'ol/geom';
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
    
    // Используем ref для хранения слоев
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
            view: new View({ center: [0, 0], zoom: 2 }),
        });
        setMap(newMap);
        return () => newMap.setTarget(undefined);
    }, []);

    // Очистка всех слоев
    const clearAllLayers = () => {
        if (!map) return;
        
        // Удаляем все пользовательские слои
        Object.values(layersRef.current).forEach(layer => {
            if (layer) {
                map.removeLayer(layer);
            }
        });
        
        // Сбрасываем ссылки
        layersRef.current = {
            startMarker: null,
            endMarker: null,
            radiusLayer: null,
            lineLayer: null
        };
    };

    // Расчет расстояния между точками
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Радиус Земли в км
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * (Math.PI / 180)) * 
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Обработчик клика по карте
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

        // Если нет стартовой точки
        if (!layersRef.current.startMarker) {
            // Создаем стартовую точку
            const marker = new Feature({
                geometry: new Point(coordinates)
            });
            
            marker.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/4764/4764087.png',
                    scale: 0.05,
                    anchor: [0.5, 1]
                })
            }));

            const markerLayer = new VectorLayer({
                source: new VectorSource({ features: [marker] })
            });
            
            map.addLayer(markerLayer);
            layersRef.current.startMarker = markerLayer;

            // Создаем радиус для дронов с ограничением
            if (selectedDrone.range !== null) {
                const radiusFeature = new Feature({
                    geometry: new CircleGeometry(coordinates, selectedDrone.range * 1000)
                });

                const radiusLayer = new VectorLayer({
                    source: new VectorSource({ features: [radiusFeature] }),
                    style: new Style({
                        stroke: new Stroke({
                            color: 'rgba(0, 0, 255, 0.5)',
                            width: 2
                        }),
                        fill: new Fill({
                            color: 'rgba(0, 0, 255, 0.1)'
                        })
                    })
                });
                
                map.addLayer(radiusLayer);
                layersRef.current.radiusLayer = radiusLayer;
            }
        }
        // Если есть стартовая, но нет конечной точки
        else if (!layersRef.current.endMarker) {
            const startCoords = layersRef.current.startMarker.getSource().getFeatures()[0].getGeometry().getCoordinates();
            const [startLng, startLat] = toLonLat(startCoords);
            const distance = getDistance(startLat, startLng, lat, lng);

            // Проверка радиуса для дронов с ограничением
            if (selectedDrone.range !== null && distance > selectedDrone.range) {
                alert(`Конечная точка должна быть в пределах ${selectedDrone.range} км от старта!`);
                return;
            }

            // Создаем конечную точку
            const marker = new Feature({
                geometry: new Point(coordinates)
            });
            
            marker.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/103/103228.png',
                    scale: 0.05,
                    anchor: [0.5, 1]
                })
            }));

            const markerLayer = new VectorLayer({
                source: new VectorSource({ features: [marker] })
            });
            
            map.addLayer(markerLayer);
            layersRef.current.endMarker = markerLayer;

            // Создаем линию между точками
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
                })
            });
            
            map.addLayer(lineLayer);
            layersRef.current.lineLayer = lineLayer;
        }
    };

    // Подписка на события клика
    useEffect(() => {
        if (!map) return;
        
        const clickHandler = (event) => handleMapClick(event);
        map.on('click', clickHandler);
        
        return () => {
            map.un('click', clickHandler);
        };
    }, [map, selectedDrone]);

    return (
        <div>
            <h1>Маршрут дрона</h1>
            <div style={{ marginBottom: '10px' }}>
                <label>Выберите дрон: </label>
                <select 
                    onChange={(e) => {
                        clearAllLayers();
                        setSelectedDrone(drones[e.target.value]);
                    }}
                >
                    {drones.map((drone, index) => (
                        <option key={index} value={index}>
                            {drone.name} {drone.range ? `(${drone.range} км)` : ''}
                        </option>
                    ))}
                </select>
            </div>
            <button onClick={clearAllLayers}>Сбросить</button>
            <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
        </div>
    );
};

export default App;