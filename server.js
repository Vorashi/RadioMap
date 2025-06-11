require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Функция расчета расстояния между точками
function calculateDistance(p1, p2) {
    const R = 6371e3;
    const φ1 = p1.lat * Math.PI/180;
    const φ2 = p2.lat * Math.PI/180;
    const Δφ = (p2.lat - p1.lat) * Math.PI/180;
    const Δλ = (p2.lng - p1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Функция проверки прямой видимости (упрощенная)
function hasLineOfSight(p1, p2) {
    const elevationDiff = Math.abs(p1.elevation - p2.elevation);
    const distance = calculateDistance(p1, p2);
    return elevationDiff / distance < 0.1; // 10% уклон
}

// Функция расчета качества сигнала
function calculateSignalQuality(distance, frequency, maxRange) {
    const normalizedDistance = Math.min(distance / maxRange, 1);
    return Math.pow(1 - normalizedDistance, 2);
}

// Эндпоинт для анализа радиосвязи
app.post('/radio-analysis', async (req, res) => {
    const { points, droneRange, frequency = 2.4 } = req.body;
    
    try {
        const results = [];
        for (let i = 0; i < points.length - 1; i++) {
            const point1 = points[i];
            const point2 = points[i+1];
            
            const distance = calculateDistance(point1, point2);
            const los = hasLineOfSight(point1, point2);
            const signalQuality = calculateSignalQuality(distance, frequency, droneRange * 1000);
            
            results.push({
                segment: i,
                start: point1,
                end: point2,
                distance: distance / 1000, // в км
                hasLOS: los,
                signalQuality,
                isCritical: signalQuality < 0.3 || !los
            });
        }
        res.json({ analysis: results });
    } catch (error) {
        console.error('Error in radio analysis:', error);
        res.status(500).json({ error: 'Failed to analyze radio connection' });
    }
});

// Эндпоинт для получения данных о высотах
app.post('/elevation', async (req, res) => {
    const { points } = req.body; 

    try {
        const elevations = [];
        for (const point of points) {
            const response = await axios.get(`https://api.open-meteo.com/v1/elevation?latitude=${point.lat}&longitude=${point.lng}`);
            elevations.push(response.data.elevation[0]);
        }
        res.json({ elevations });
    } catch (error) {
        console.error('Error fetching elevation data:', error);
        res.status(500).json({ error: 'Failed to fetch elevation data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});