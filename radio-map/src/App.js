import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import Input from './Input';

const defaultIcon = L.icon({
    iconUrl: './img/marker-icon.png',
    iconRetinaUrl: './img/marker-icon-2x.png',
    shadowUrl: './img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const App = () => {
    const [points, setPoints] = useState([]); 
    const [elevations, setElevations] = useState([]); 
    const [linePositions, setLinePositions] = useState([]); 

    const handleAddPoint = async (lat, lng) => {
        const newPoints = [...points, { lat, lng }];
        setPoints(newPoints);

        try {
            const response = await axios.post('http://localhost:5000/elevation', {
                points: [{ lat, lng }], 
            });
            setElevations([...elevations, response.data.elevations[0]]);

            if (newPoints.length === 2) {
                setLinePositions(newPoints.map((p) => [p.lat, p.lng]));
            }
        } catch (error) {
            console.error('Error fetching elevation data:', error);
        }
    };

    const handleReset = () => {
        setPoints([]);
        setElevations([]);
        setLinePositions([]);
    };


    return (
        <div>
            <h1>Карта с высотой точек</h1>
            <Input onAddPoint={handleAddPoint} onReset={handleReset} />
            <div style={{ height: '500px', width: '100%', marginTop: '20px' }}>
                <MapContainer
                    center={[55.7558, 37.6173]}
                    zoom={8}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {points.map((point, index) => (
                        <Marker key={index} position={[point.lat, point.lng]} icon={defaultIcon}>
                            <Popup>
                                Широта: {point.lat.toFixed(4)}, Долгота: {point.lng.toFixed(4)} <br />
                                Высота: {elevations[index]} м
                            </Popup>
                        </Marker>
                    ))}
                    {linePositions.length === 2 && (
                        <Polyline positions={linePositions} color="blue" />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default App;