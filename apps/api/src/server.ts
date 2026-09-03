import { PORT, HAS_DATABASE_URL } from './env.js';
import { createApp } from './app.js';

if (!HAS_DATABASE_URL) {
  console.warn(
    '[api] DATABASE_URL is not set. Add your Neon connection string to packages/db/.env ' +
      '(see packages/db/.env.example). Data routes will fail until it is set.',
  );
}

const app = createApp();

app.listen(PORT, () => {
  console.log(`Chukta API listening on http://localhost:${PORT}`);
});
