/* eslint-disable semi */
const app = require('./router');
const port = 5000;

app.listen(port, () => {
  console.log(`CORS-enabled web server is listening on port ${port}`);
});
