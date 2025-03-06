require('dotenv').config();
const express = require('express');
// const GeoTIFF = require('geotiff');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = process.env.port;
// https://open-meteo.com/en/docs/elevation-api#latitude=57&longitude=39 - был использован для получения высот 
app.use(cors());
app.use(express.json());

// async function getElevation(lat, lon) {
//     const arrayBuffer = fs.readFileSync('data/dem.tif').buffer;
//     const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
//     const image = await tiff.getImage();
//     const [x, y] = image.getCoordsFromLatLon(lat, lon); 
//     const elevation = await image.readRasters({ window: [x, y, x + 1, y + 1] });
//     return elevation[0][0];
// }

app.post('/elevation', async (req, res) => {
    const { lat, lon } = req.body;

    try {
        // const elevation = await getElevation(lat, lon);
        // res.json({ elevation });
        const response = await axios.get(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`);
        const elevation = response.data.elevation;
        return res.json({ elevation });
    } catch (error) {
        console.error('Error reading elevation data:', error);
        res.status(500).json({ error: 'Failed to read elevation data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});