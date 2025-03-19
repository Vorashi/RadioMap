import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point, Circle as CircleGeometry } from 'ol/geom';
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
    const [markerLayer, setMarkerLayer] = useState(null); // Слой для маркера
    const [radiusLayer, setRadiusLayer] = useState(null); // Слой для радиуса
    const [selectedDrone, setSelectedDrone] = useState(drones[0]);
    const mapRef = useRef(null);

    useEffect(() => {
        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(), 
                }),
            ],
            view: new View({
                center: [0, 0],
                zoom: 0,
            }),
        });

        setMap(map);

        return () => map.setTarget(null);
    }, []);

    // Очистка всех слоев, кроме базового (OSM)
    const clearLayers = () => {
        if (map) {
            map.getLayers().forEach((layer) => {
                if (layer instanceof VectorLayer) {
                    map.removeLayer(layer);
                }
            });
        }
        setMarkerLayer(null);
        setRadiusLayer(null);
    };

    // Обработчик клика по карте
    const handleMapClick = (coordinates) => {
        if (!selectedDrone) {
            alert('Сначала выберите дрон!');
            return;
        }

        const [lng, lat] = toLonLat(coordinates);

        if (lat < -90 || lat > 90) {
            alert('Широта должна быть в диапазоне от -90 до 90°!');
            return;
        }

        if (lng < -180 || lng > 180) {
            alert('Долгота должна быть в диапазоне от -180 до 180°!');
            return;
        }

        // Очищаем предыдущие слои
        clearLayers();

        // Создаем маркер
        const marker = new Feature({
            geometry: new Point(coordinates),
        });

        marker.setStyle(
            new Style({
                image: new Icon({
                    src: './radio-map/public/img/marker-icon.png',
                    scale: 1,
                }),
            })
        );

        const markerSource = new VectorSource({
            features: [marker],
        });

        const markerLayer = new VectorLayer({
            source: markerSource,
        });

        map.addLayer(markerLayer);
        setMarkerLayer(markerLayer);

        // Если у дрона есть радиус, создаем слой с кругом
        if (selectedDrone.range !== null) {
            const radius = selectedDrone.range * 1000; // Переводим км в метры
            const radiusFeature = new Feature({
                geometry: new CircleGeometry(coordinates, radius),
            });

            const radiusSource = new VectorSource({
                features: [radiusFeature],
            });

            const radiusLayer = new VectorLayer({
                source: radiusSource,
                style: new Style({
                    stroke: new Stroke({
                        color: 'rgba(0, 0, 255, 0.5)',
                        width: 2,
                    }),
                    fill: new Fill({
                        color: 'rgba(0, 0, 255, 0.1)',
                    }),
                }),
            });

            map.addLayer(radiusLayer);
            setRadiusLayer(radiusLayer);
        }
    };

    useEffect(() => {
        if (map) {
            map.on('click', (event) => {
                handleMapClick(event.coordinate);
            });
        }
    }, [map, selectedDrone]);

    const handleReset = () => {
        clearLayers();
    };

    return (
        <div>
            <h1>Карта с радиусом дрона</h1>
            <div style={{ marginBottom: '10px' }}>
                <label>Выберите дрон: </label>
                <select onChange={(e) => setSelectedDrone(drones[e.target.value])}>
                    {drones.map((drone, index) => (
                        <option key={index} value={index}>
                            {drone.name} {drone.range ? `(${drone.range} км)` : ''}
                        </option>
                    ))}
                </select>
            </div>
            <button onClick={handleReset} style={{ marginBottom: '10px' }}>
                Сбросить
            </button>
            <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
        </div>
    );
};

export default App;