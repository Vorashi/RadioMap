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

export const calculateRadioConnection = (startCoords, endCoords, elevationPoints, drone) => {
    if (!elevationPoints || elevationPoints.length < 2) {
        return {
            quality: 'none',
            fresnelZone: () => 0,
            totalDistance: 0,
            maxDistance: 0,
            obstacles: []
        };
    }

    const [startLon, startLat] = toLonLat(startCoords);
    const [endLon, endLat] = toLonLat(endCoords);
    
    const totalDistance = getDistance(startLat, startLon, endLat, endLon);
    const maxDistance = drone.range || 50;
    
    const frequency = 2.4;
    const fresnelZone = (distance) => 8.656 * Math.sqrt(distance / frequency);
    
    const startElevation = elevationPoints[0].elevation;
    const endElevation = elevationPoints[elevationPoints.length - 1].elevation;
    
    let lineOfSight = true;
    const obstacles = [];
    
    elevationPoints.forEach((point, i) => {
        if (i === 0 || i === elevationPoints.length - 1) return;
        
        const segmentDistance = getDistance(startLat, startLon, point.lat, point.lng);
        const expectedElevation = startElevation + 
            (endElevation - startElevation) * (segmentDistance / totalDistance);
        const clearance = fresnelZone(segmentDistance);
        const elevationDiff = point.elevation - expectedElevation;
        
        if (elevationDiff > clearance) {
            lineOfSight = false;
            obstacles.push({
                position: segmentDistance,
                elevation: point.elevation,
                expected: expectedElevation,
                clearance
            });
        }
    });
    
    return {
        quality: lineOfSight ? 'good' : totalDistance > maxDistance ? 'none' : 'weak',
        fresnelZone,
        totalDistance,
        maxDistance,
        obstacles,
        startElevation,
        endElevation
    };
};