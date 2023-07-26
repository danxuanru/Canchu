require('dotenv').config();
const express = require('express');\

const port = 5000;
const app = express();

app.set('trust proxy', 5);
app.get('/ip', (request, response) => response.send(request.ip));

app.listen(port, () => {
    console.log('web server');
})
