import { assertRequiredEnv } from './config/env';

assertRequiredEnv();

import app from './app';
import { startGuestCleanupJob } from './jobs/cleanupGuests';
import { warmEmbeddingModel } from './services/embeddingService';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  startGuestCleanupJob();
  // Loads the local embedding model now (first-call cost is a few seconds)
  // so it's not the first real search request that pays for it.
  void warmEmbeddingModel();
});
