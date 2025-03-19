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
    const [selectedDrone, setSelectedDrone] = useState(drones[0]); 
    const [radiusLayer, setRadiusLayer] = useState(null);
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
                console.error('Error fetching elevation data:', error);
            }
        }
        return allElevations;
    };

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

            if (markers.length === 1) {
                const start = markers[0].getGeometry().getCoordinates();
                const end = coordinates;
                const intermediatePoints = interpolatePoints(start, end, 100);
                const allPoints = [start, ...intermediatePoints, end].map((point) => toLonLat(point));
                const elevations = await getElevations(allPoints);

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
                                text: `${elevations[index + 1].toFixed(2)} м`,
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

                const line = new Feature({
                    geometry: new LineString(allPoints),
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
            <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
        </div>
    );
};

export default App;
