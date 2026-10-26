import { assertRequiredEnv } from './config/env';

assertRequiredEnv();

import app from './app';
import { startGuestCleanupJob } from './jobs/cleanupGuests';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  startGuestCleanupJob();
});
