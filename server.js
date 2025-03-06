require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = process.env.port;
// https://open-meteo.com/en/docs/elevation-api#latitude=57&longitude=39 - был использован для получения высот 
app.use(cors());
app.use(express.json());

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