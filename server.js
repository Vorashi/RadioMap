require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const gdal = require('gdal3');
const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/graph', (req, res) => {
    let { lat, lon } = req.body;
    gdal.
    res.json();
});

app.listen(port, () => {
    console.log(`Server start ${new Date()} in http://localhost:${port}`)
});