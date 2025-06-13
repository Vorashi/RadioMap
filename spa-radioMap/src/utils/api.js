import axios from 'axios';
import { toLonLat, fromLonLat } from 'ol/proj';
import { getDistance } from './geoUtils';
import { NOMINATIM_URL } from './constants';

export const searchLocations = async (query) => {
    if (!query || query.length < 3) {
        return [];
    }
    
    try {
        const response = await axios.get(NOMINATIM_URL, {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: 10,
                'accept-language': 'ru'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Ошибка поиска:', error);
        return [];
    }
};

export const fetchElevationData = async (start, end) => {
    try {
        const [startLon, startLat] = toLonLat(start);
        const [endLon, endLat] = toLonLat(end);
        
        const distance = getDistance(startLat, startLon, endLat, endLon);
        const numPoints = Math.max(3, Math.min(20, Math.floor(distance * 2)));
        
        const points = [];
        for (let i = 0; i <= numPoints; i++) {
            const ratio = i / numPoints;
            const lat = startLat + (endLat - startLat) * ratio;
            const lon = startLon + (endLon - startLon) * ratio;
            points.push({ lat, lng: lon });
        }
        
        const response = await axios.post('http://localhost:5000/elevation', { points });
        const elevations = response.data.elevations;
        
        const filteredPoints = [];
        let lastElevation = null;
        
        for (let i = 0; i < points.length; i++) {
            const currentElevation = Math.round(elevations[i]);
            if (currentElevation !== lastElevation || i === 0 || i === points.length - 1) {
                filteredPoints.push({
                    coords: fromLonLat([points[i].lng, points[i].lat]),
                    elevation: currentElevation
                });
                lastElevation = currentElevation;
            }
        }
        
        return filteredPoints;
    } catch (error) {
        console.error('Error fetching elevation data:', error);
        return [];
    }
};