require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const drones = [
    { 
        id: 1,
        name: 'DJI Mavic 3', 
        range: 10,
        speed: 65,
        weight: 895,
        frequency: 2.4,
        description: 'Компактный дрон для аэрофотосъемки с камерой Hasselblad',
        image: 'https://mydrone.ru/images/ab__webp/thumbnails/550/450/detailed/121/Квадрокоптер_DJI_Mavic_3_Classic__без_пульта__jpg.webp'
    },
    { 
        id: 2,
        name: 'DJI Matrice 300', 
        range: 50,
        speed: 82,
        weight: 3700,
        frequency: 5.8,
        description: 'Профессиональный промышленный дрон для сложных задач',
        image: 'https://m-files.cdn1.cc/lpfile/b/b/e/bbe19b5a1c7370bc972efa77de5a0122/-/resize/1920/f.jpg?11899100'
    },
    { 
        id: 3,
        name: 'Autel EVO II', 
        range: 100,
        speed: 72,
        weight: 1127,
        frequency: 2.4,
        description: 'Дрон с 8K камерой и продвинутыми функциями съемки',
        image: 'https://static.insales-cdn.com/r/Z3PCB95Z-tI/rs:fit:550:550:1/plain/images/products/1/4950/932778838/kvadrokopter-autel-robotics-evo-ii-dual-640t-rtk-rugged-bundle-v2.jpg@webp'
    },
    { 
        id: 4,
        name: 'WingtraOne', 
        range: 1000,
        speed: 58,
        weight: 3100,
        frequency: 5.8,
        description: 'Дрон-самолет для картографии и геодезии',
        image: 'https://i.pinimg.com/originals/b3/65/e7/b365e7f94b29bb230e955de85631520d.png'
    },
    { 
        id: 5,
        name: 'Особый дрон', 
        range: null,
        speed: null,
        weight: null,
        frequency: 2.4,
        description: 'Кастомная модель без ограничений по дальности',
        image: 'https://cdn-icons-png.flaticon.com/512/3447/3447594.png'
    },
];

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

function hasLineOfSight(p1, p2) {
    const elevationDiff = Math.abs(p1.elevation - p2.elevation);
    const distance = calculateDistance(p1, p2);
    return elevationDiff / distance < 0.1;
}

function calculateSignalQuality(distance, frequency, maxRange) {
    const normalizedDistance = Math.min(distance / maxRange, 1);
    return Math.pow(1 - normalizedDistance, 2);
}

// Получение всех дронов
app.get('/api/drones', (req, res) => {
    res.json(drones);
});

// Добавление нового дрона
app.post('/api/drones', (req, res) => {
    const newDrone = {
        id: drones.length + 1,
        ...req.body
    };
    drones.push(newDrone);
    res.status(201).json(newDrone);
});

// Обновление дрона
app.put('/api/drones/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = drones.findIndex(d => d.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Дрон не найден' });
    }
    
    drones[index] = { ...drones[index], ...req.body };
    res.json(drones[index]);
});

// Удаление дрона
app.delete('/api/drones/:id', (req, res) => {
    const id = parseInt(req.params.id);
    drones = drones.filter(d => d.id !== id);
    res.status(204).send();
});

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
                distance: distance / 1000,
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