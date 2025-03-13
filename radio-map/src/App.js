import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point, LineString } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Icon, Stroke } from 'ol/style';
import 'ol/ol.css';

const App = () => {
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [elevations, setElevations] = useState([]);
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
                center: [4182518, 7508900],
                zoom: 10,
            }),
        });

        // Обработчик клика по карте
        map.on('click', async (event) => {
            const coordinates = event.coordinate;

            try {
                const response = await axios.post('http://localhost:3000/elevation', {
                    points: [{ lat: coordinates[1], lng: coordinates[0] }],
                });
                const elevation = response.data.elevations[0];

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

                if (markers.length === 1) {
                    const line = new Feature({
                        geometry: new LineString([
                            markers[0].getGeometry().getCoordinates(),
                            coordinates,
                        ]),
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
        });

        setMap(map);

        return () => map.setTarget(null);
    }, []);

    const handleReset = () => {
        if (map) {
            map.getLayers().forEach((layer) => {
                if (layer instanceof VectorLayer) {
                    map.removeLayer(layer);
                }
            });
            setMarkers([]);
            setElevations([]);
        }
    };

    return (
        <div>
            <h1>Карта с высотой точек (OpenLayers)</h1>
            <button onClick={handleReset} style={{ marginBottom: '10px' }}>
                Сбросить
            </button>
            <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
        </div>
    );
};

export default App;
