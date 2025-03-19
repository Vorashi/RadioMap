import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point, LineString, Circle as CircleGeometry } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Icon, Stroke, Circle as CircleStyle, Fill, Text } from 'ol/style';
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
    const [markers, setMarkers] = useState([]);
    const [elevations, setElevations] = useState([]);
    const [selectedDrone, setSelectedDrone] = useState([]); 
    const [radiusLayer, setRadiusLayer] = useState(null);
    const [lineLayer, setLineLayer] = useState(null);
    const [hoveredElevation, setHoveredElevation] = useState(null)
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
                center: [0,0], //Открепил начальное положние от Москвы теперь нормально показывает не от привязанной начальной точки, а от моей ручной Начало и Конец
                zoom: 0, //Чтобы в море не улетал
            }),
        });

        setMap(map);

        return () => map.setTarget(null);
    }, []);

  
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

    //получение высот через разбиение
    const getElevations = async (points) => {
        const chunkSize = 100; 
        const chunks = [];
        for (let i = 0; i < points.length; i += chunkSize) {
            chunks.push(points.slice(i, i + chunkSize));
        }

        const allElevations = [];
        for (const chunk of chunks) {
            try {
                const response = await axios.post('http://localhost:5000/elevation', {
                    points: chunk.map(([lng, lat]) => ({ lat, lng })),
                });
                allElevations.push(...response.data.elevations);
            } catch (error) {
                console.error('Error fetching elevation data Fetch GetElevations:', error);
            }
        }
        return allElevations;
    };

    //Мап кликер просто чудище огромное
    const handleMapClick = async (coordinates) => {
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

        // Есть ли у нас 2 точка и ограничение по радиусу полета
        if(markers.length === 1 && selectedDrone.range !== null) {
            const start = markers[0].getGeometry().getCoordinates();
            const [startLng, startLat] = toLonLat(start);
            const distance = getDistance(startLat, startLng, lat, lng); //Расстояние между точек

            if (distance > selectedDrone.range) {
                alert(`Дрон не может лететь дальше своего максимального ${selectedDrone.range} км!`);
                return;
            }
        }

        try {
            const marker = new Feature({
                geometry: new Point(coordinates),
            });

            marker.setStyle(
                new Style({
                    image: new Icon({
                        src: '/radio-map/public/img/marker-icon.png',
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

            //Проверка первой точки (Начало)
            if (markers.length === 0 && selectedDrone.range !== null) {
                const radius = selectedDrone.range * 1000; 
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

            // Построение линии возможна ошибка
            if (markers.length === 1) {
                const start = markers[0].getGeometry().getCoordinates();
                const end = coordinates;
                const intermediatePoints = interpolatePoints(start, end, 100);
                const allPoints = [start, ...intermediatePoints, end].map((point) => toLonLat(point));
                const elevations = await getElevations(allPoints);

                const line = new Feature({
                    geometry: new LineString([start, end])
                });

                const lineSource = new VectorSource({
                    features: [line],
                });

                const lineLayer = new VectorLayer({
                    source: lineSource,
                    style: new Style({
                        stroke: new Stroke({
                            color: '#3887be',
                            width: 5,
                        }),
                    }),
                });

                map.addLayer(lineLayer);
                setLineLayer(lineLayer);

                map.on('pointermove', (event) => {
                    if (lineLayer) {
                        const pixel = map.getEventPixel(event.originalEvent);
                        const feature = map.forEachFeatureAtPixel(pixel, (feature) => feature);

                        if (feature && feature.getGeometry().getType() === 'LineString') {
                            const closestPoint = feature.getGeometry().getClosestPoint(event.coordinate);
                            const [lng, lat] = toLonLat(closestPoint);

                            const closestIndex = intermediatePoints.reduce((closest, point, index) => {
                                const distance = getDistance(lat, lng, point[1], point[0]);
                                return distance < closest.distance ? { index, distance } : closest;
                            }, { index: 0, distance: Infinity }).index;

                            if (elevations && elevations[closestIndex + 1]) {
                                setHoveredElevation(elevations[closestIndex + 1]);
                            } else {
                                setHoveredElevation(null);
                            }
                        } else {
                            setHoveredElevation(null);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching elevation data', error);
        }
    };               

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
            setLineLayer(null);
            setHoveredElevation(null);
        }
    };

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    return (
        <div>
            <h1>Карта с высотой точек</h1>
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
            {hoveredElevation != null && (
                <div className='high' style={{ position: 'absolute', top: '10px', right: '10px', background:'white', padding: '10px', zIndex: 1000 }}>  
                    Высота: {hoveredElevation.toFixed(2)} м
                </div>
            )}
            <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
        </div>
    );
};

export default App;