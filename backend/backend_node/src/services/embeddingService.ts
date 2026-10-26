import { pipeline, env } from '@huggingface/transformers';

// Runs the embedding model in-process via ONNX (WASM/CPU) instead of
// calling the Hugging Face Inference API. The app previously depended on
// that API's free credits, which ran out silently — every search then
// fell back to a crude keyword matcher with no visible error, since
// generateEmbedding() degrades to [] on any failure by design (see the
// fallback path below and in searchService.ts). Running locally removes
// that external dependency (and its billing) entirely.
env.allowLocalModels = false; // always fetch the model from the HF Hub CDN (a free, keyless file download — unrelated to the paid Inference API above)
env.useBrowserCache = false;

// Xenova/all-MiniLM-L6-v2 is the ONNX port of the exact sentence-transformers
// model this app already used via the HF Inference API, so it produces the
// same 384-dim embedding space as the "descriptionVector vector(384)" column.
// Product vectors were recomputed against this exact pipeline (see
// prisma/update_vectors.ts) so query-time and stored embeddings are
// consistent — mixing embeddings from two slightly different runtimes would
// quietly degrade similarity quality.
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

type Extractor = (text: string, options: { pooling: 'mean'; normalize: boolean }) => Promise<{ data: Float32Array }>;

let extractorPromise: Promise<Extractor> | null = null;

const getExtractor = (): Promise<Extractor> => {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_ID) as unknown as Promise<Extractor>;
  }
  return extractorPromise;
};

/** Loads (and caches) the model so the first real request isn't the one
 * that pays the ~seconds-long load cost. Call once at server boot. */
export const warmEmbeddingModel = async (): Promise<void> => {
  const started = Date.now();
  try {
    await generateEmbedding('warmup');
    console.log(`[EMBEDDING] Model ready in ${Date.now() - started}ms`);
  } catch (error) {
    console.error('[EMBEDDING] Failed to warm model:', error);
  }
};

/** Converts text into a 384-dim vector. Returns [] on failure so callers
 * can degrade to the keyword fallback instead of throwing. */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const extractor = await getExtractor();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error('[EMBEDDING] Failed to generate embedding:', error);
    return [];
  }
};
