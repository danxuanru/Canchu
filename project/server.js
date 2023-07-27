/* eslint-disable semi */
const app = require('./router');
const port = 80;

app.listen(port, () => {
  console.log(`CORS-enabled web server is listening on port ${port}`);
});
