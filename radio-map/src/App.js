import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point, LineString, Circle as CircleGeometry } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Icon, Stroke, Circle as CircleStyle, Fill, Text } from 'ol/style';
import 'ol/ol.css';

const drones = [
    { name: 'Дрон A', range: 10 }, // 10 км
    { name: 'Дрон B', range: 50 }, // 50 км
    { name: 'Дрон C', range: 100 }, // 100 км
    { name: 'Дрон D', range: 1000 }, // 1000 км
    { name: 'Особый дрон', range: null }, // Без ограничений
];

const App = () => {
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [elevations, setElevations] = useState([]);
    const [selectedDrone, setSelectedDrone] = useState(null);
    const [radiusLayer, setRadiusLayer] = useState(null);
    const mapRef = useRef(null);

    // Инициализация карты
    useEffect(() => {
        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(), // Используем OpenStreetMap как базовый слой
                }),
            ],
            view: new View({
                center: [4182518, 7508900], // Центр карты (Москва)
                zoom: 10,
            }),
        });

        setMap(map);

        // Очистка карты при размонтировании компонента
        return () => map.setTarget(null);
    }, []);

    // Функция для интерполяции между двумя точками
    const interpolatePoints = (start, end, numPoints) => {
        const points = [];
        for (let i = 0; i <= numPoints; i++) {
            const fraction = i / numPoints;
            const lat = start[1] + (end[1] - start[1]) * fraction;
            const lng = start[0] + (end[0] - start[0]) * fraction;
            points.push([lng, lat]);
        }
        return points;
    };

    // Обработчик клика по карте
    const handleMapClick = async (coordinates) => {
        if (!selectedDrone) {
            alert('Сначала выберите дрон!');
            return;
        }

        try {
            const response = await axios.post('http://localhost:3000/elevation', {
                points: [{ lat: coordinates[1], lng: coordinates[0] }],
            });
            const elevation = response.data.elevations[0];

            // Добавляем маркер
            const marker = new Feature({
                geometry: new Point(coordinates),
            });

            marker.setStyle(
                new Style({
                    image: new Icon({
                        src: 'https://docs.maptiler.com/openlayers/default-marker/marker-icon.png',
                        scale: 0.5,
                    }),
                })
            );

            const vectorSource = new VectorSource({
                features: [marker],
            });

            const vectorLayer = new VectorLayer({
                source: vectorSource,
            });

            map.addLayer(vectorLayer);
            setMarkers((prevMarkers) => [...prevMarkers, marker]);
            setElevations((prevElevations) => [...prevElevations, elevation]);

            // Если это первая точка, добавляем радиус
            if (markers.length === 0 && selectedDrone.range !== null) {
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

            // Если маркеров два, строим линию и добавляем промежуточные точки
            if (markers.length === 1) {
                const start = markers[0].getGeometry().getCoordinates();
                const end = coordinates;

                // Интерполируем 5 промежуточных точек
                const intermediatePoints = interpolatePoints(start, end, 5);

                // Запрашиваем высоты для промежуточных точек
                const elevationsResponse = await axios.post('http://localhost:3000/elevation', {
                    points: intermediatePoints.map(([lng, lat]) => ({ lat, lng })),
                });

                // Добавляем промежуточные точки на карту
                intermediatePoints.forEach((point, index) => {
                    const intermediateMarker = new Feature({
                        geometry: new Point(point),
                    });

                    intermediateMarker.setStyle(
                        new Style({
                            image: new CircleStyle({
                                radius: 5,
                                fill: new Fill({ color: 'blue' }),
                                stroke: new Stroke({ color: 'white', width: 2 }),
                            }),
                            text: new Text({
                                text: `${elevationsResponse.data.elevations[index].toFixed(2)} м`,
                                offsetY: -15,
                                fill: new Fill({ color: 'black' }),
                                stroke: new Stroke({ color: 'white', width: 2 }),
                            }),
                        })
                    );

                    const intermediateSource = new VectorSource({
                        features: [intermediateMarker],
                    });

                    const intermediateLayer = new VectorLayer({
                        source: intermediateSource,
                    });

                    map.addLayer(intermediateLayer);
                });

                // Строим линию
                const line = new Feature({
                    geometry: new LineString([start, ...intermediatePoints, end]),
                });

                line.setStyle(
                    new Style({
                        stroke: new Stroke({
                            color: '#3887be',
                            width: 5,
                        }),
                    })
                );

                const lineSource = new VectorSource({
                    features: [line],
                });

                const lineLayer = new VectorLayer({
                    source: lineSource,
                });

                map.addLayer(lineLayer);
            }
        } catch (error) {
            console.error('Error fetching elevation data:', error);
        }
    };

    // Обработчик клика по карте
    useEffect(() => {
        if (map) {
            map.on('click', (event) => {
                handleMapClick(event.coordinate);
            });
        }
    }, [map, markers, selectedDrone]);

    const handleReset = () => {
        if (map) {
            map.getLayers().forEach((layer) => {
                if (layer instanceof VectorLayer) {
                    map.removeLayer(layer);
                }
            });
            setMarkers([]);
            setElevations([]);
            setRadiusLayer(null);
        }
    };

    return (
        <div>
            <h1>Карта с высотой точек (OpenLayers)</h1>
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
