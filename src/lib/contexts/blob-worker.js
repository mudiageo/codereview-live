/**
 * Web Worker for non-blocking blob consolidation
 * Handles consolidation of recorded chunks without blocking the main thread
 */

self.onmessage = (e) => {
	const { chunks, mimeType } = e.data;

	try {
		// Consolidate all chunks into a single blob
		const consolidatedBlob = new Blob(chunks, { type: mimeType });

		// Send the consolidated blob back to the main thread
		self.postMessage(consolidatedBlob);
	} catch (error) {
		// Post error back to main thread
		self.postMessage({ error: error.message || 'Blob consolidation failed' });
	}
};
