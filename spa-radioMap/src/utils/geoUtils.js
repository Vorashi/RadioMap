import { fromLonLat, toLonLat } from 'ol/proj';

export const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI/180) * 
        Math.cos(lat2 * Math.PI/180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export const isPointInRadius = (center, point, radius) => {
    if (radius === null) return true;
    const [centerLon, centerLat] = toLonLat(center);
    const [pointLon, pointLat] = toLonLat(point);
    return getDistance(centerLat, centerLon, pointLat, pointLon) <= radius;
};

export const createRadiusPolygon = (center, radius) => {
    const coordinates = [];
    const [lon, lat] = toLonLat(center);
    const R = 6371;
    
    for (let i = 0; i <= 360; i++) {
        const angle = i * Math.PI / 180;
        const lat2 = Math.asin(Math.sin(lat * Math.PI/180) * 
                     Math.cos(radius/R) + 
                     Math.cos(lat * Math.PI/180) * 
                     Math.sin(radius/R) * 
                     Math.cos(angle));
        const lon2 = lon * Math.PI/180 + Math.atan2(
            Math.sin(angle) * Math.sin(radius/R) * Math.cos(lat * Math.PI/180),
            Math.cos(radius/R) - Math.sin(lat * Math.PI/180) * Math.sin(lat2)
        );
        coordinates.push(fromLonLat([lon2 * 180/Math.PI, lat2 * 180/Math.PI]));
    }
    
    return coordinates;
};