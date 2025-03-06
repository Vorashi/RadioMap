import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [elevation, setElevation] = useState(null);
    const [markerPosition, setMarkerPosition] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5000/elevation', {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
            });
            setElevation(response.data.elevation);
            setMarkerPosition([parseFloat(lat), parseFloat(lon)]);
        } catch (error) {
            console.error('Error fetching elevation data:', error);
        }
    };

    return (
        <div>
            <h1>Карта с высотой точки</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Широта"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Долгота"
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                />
                <button type="submit">Получить высоту</button>
            </form>
            <div style={{ height: '500px', width: '100%', marginTop: '20px' }}>
                <MapContainer
                    center={markerPosition || [45.0, 90.0]} // Центр карты
                    zoom={5}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {markerPosition && (
                        <Marker position={markerPosition} icon={defaultIcon}>
                            <Popup>
                                Широта: {markerPosition[0].toFixed(4)}, Долгота: {markerPosition[1].toFixed(4)} 

                                Высота: {elevation} м
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default App;