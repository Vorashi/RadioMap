require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.get('/graph', (req, res) => {
    res.send('Пока пусто приходи потом');
});

app.listen(port, () => {
    console.log(`Server start ${new Date()} in http://localhost:${port}`)
});