const dotenv = require('dotenv');
const mongose = require('mongoose');

dotenv.config({ path: `${__dirname}/.env` });
const app = require('./app');

const DB = process.env.DB_URL;
// console.log(DB);

mongose.connect(DB).then(() => {});

console.log(process.env.NODE_ENV);

const server = app.listen(process.env.PORT, process.env.HOSTNAME, () => {
  console.log(
    `server listening on ${process.env.HOSTNAME}:${process.env.PORT}`,
  );
});

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
