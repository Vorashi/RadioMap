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
    const [startMarker, setStartMarker] = useState(null);
    const [endMarker, setEndMarker] = useState(null);
    const [radiusLayer, setRadiusLayer] = useState(null);
    const [lineLayer, setLineLayer] = useState(null);
    const [selectedDrone, setSelectedDrone] = useState(drones[0]);
    const mapRef = useRef(null);

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

    // Очистка слоёв
    const clearLayers = () => {
        if (!map) return;
        map.getLayers().forEach(layer => {
            if (layer instanceof VectorLayer) {
                map.removeLayer(layer);
            }
        });
        setStartMarker(null);
        setEndMarker(null);
        setRadiusLayer(null);
        setLineLayer(null);
    };

    // Расстояние между точками (в км)
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Обработчик клика
    const handleMapClick = (coordinates) => {
        if (!selectedDrone) {
            alert('Сначала выберите дрон!');
            return;
        }

        const [lng, lat] = toLonLat(coordinates);
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            alert('Координаты вне допустимого диапазона!');
            return;
        }

        // Стартовая точка
        if (!startMarker) {
            const marker = new Feature({ geometry: new Point(coordinates) });
            marker.setStyle(
                new Style({
                    image: new Icon({
                        src: 'https://cdn-icons-png.flaticon.com/512/3473/3473785.png', // Иконка дрона
                        scale: 0.2, // Уменьшенный размер
                        anchor: [0.5, 1],
                    }),
                })
            );

            const markerSource = new VectorSource({ features: [marker] });
            const markerLayer = new VectorLayer({ source: markerSource });
            map.addLayer(markerLayer);
            setStartMarker(marker);

            // Радиус для дрона
            if (selectedDrone.range !== null) {
                const radius = selectedDrone.range * 1000;
                const radiusFeature = new Feature({
                    geometry: new CircleGeometry(coordinates, radius),
                });

                const radiusSource = new VectorSource({ features: [radiusFeature] });
                const radiusLayer = new VectorLayer({
                    source: radiusSource,
                    style: new Style({
                        stroke: new Stroke({ color: 'rgba(0, 0, 255, 0.5)', width: 2 }),
                        fill: new Fill({ color: 'rgba(0, 0, 255, 0.1)' }),
                    }),
                });

                map.addLayer(radiusLayer);
                setRadiusLayer(radiusLayer);
            }
        }
        // Конечная точка
        else if (!endMarker) {
            const startCoords = startMarker.getGeometry().getCoordinates();
            const [startLng, startLat] = toLonLat(startCoords);
            const distance = getDistance(startLat, startLng, lat, lng);

            if (selectedDrone.range !== null && distance > selectedDrone.range) {
                alert(`Конечная точка должна быть в пределах ${selectedDrone.range} км!`);
                return;
            }

            const marker = new Feature({ geometry: new Point(coordinates) });
            marker.setStyle(
                new Style({
                    image: new Icon({
                        src: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png', // Иконка цели
                        scale: 0.2, // Уменьшенный размер
                        anchor: [0.5, 1],
                    }),
                })
            );

            const markerSource = new VectorSource({ features: [marker] });
            const markerLayer = new VectorLayer({ source: markerSource });
            map.addLayer(markerLayer);
            setEndMarker(marker);

            // Линия между точками
            const line = new Feature({
                geometry: new LineString([startCoords, coordinates]),
            });
            const lineSource = new VectorSource({ features: [line] });
            const lineLayer = new VectorLayer({
                source: lineSource,
                style: new Style({
                    stroke: new Stroke({ color: '#3887be', width: 3 }),
                }),
            });
            map.addLayer(lineLayer);
            setLineLayer(lineLayer);
        }
    };

    // Подписка на клики
    useEffect(() => {
        if (!map) return;
        const clickHandler = (event) => handleMapClick(event.coordinate);
        map.on('click', clickHandler);
        return () => map.un('click', clickHandler);
    }, [map, startMarker, endMarker, selectedDrone]);

    return (
        <div>
            <h1>Маршрут дрона</h1>
            <div style={{ marginBottom: '10px' }}>
                <label>Выберите дрон: </label>
                <select 
                    onChange={(e) => { 
                        clearLayers(); 
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
            <button onClick={clearLayers}>Сбросить</button>
            <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
        </div>
    );
};

export default App;