require('dotenv').config({ quiet: true });
const { buildConfig } = require('./config');
const { createStore } = require('./db');
const { createApp } = require('./app');

const config = buildConfig();
const store = createStore(config.dbFile);
const app = createApp({ store, config });

app.listen(config.port, () => {
  console.log(`AccessHub running at http://localhost:${config.port}`);
  if (store.all().length === 0) {
    console.log('No users yet. Run "npm run seed" to create demo accounts, or sign up in the browser.');
  }
});
