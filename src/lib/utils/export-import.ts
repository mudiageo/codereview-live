import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ReviewExportData {
	id: string;
	title: string;
	description?: string;
	codeContent: string;
	codeLanguage: string;
	videoUrl?: string;
	thumbnailUrl?: string;
	metadata?: {
		codeLineCount?: number;
		filesChanged?: string[];
		tags?: string[];
		[key: string]: any;
	};
	createdAt: string;
	updatedAt: string;
}

/**
 * Review export/import utility using JSZip
 * Creates .crl (CodeReview Live) files which are zip archives
 */
export class ReviewExporter {
	private static readonly FILE_VERSION = '1.0';
	private static readonly MAGIC_BYTES = 'CRLV1';

	/**
	 * Export review to .crl file
	 */
	static async exportReview(review: ReviewExportData, videoBlob?: Blob): Promise<void> {
		try {
			const zip = new JSZip();

			// Add metadata
			const metadata = {
				version: this.FILE_VERSION,
				magic: this.MAGIC_BYTES,
				exportedAt: new Date().toISOString(),
				review: {
					id: review.id,
					title: review.title,
					description: review.description,
					codeLanguage: review.codeLanguage,
					metadata: review.metadata,
					createdAt: review.createdAt,
					updatedAt: review.updatedAt
				}
			};

			zip.file('metadata.json', JSON.stringify(metadata, null, 2));

			// Add code content
			zip.file('code.txt', review.codeContent);

			// Add video if provided
			if (videoBlob) {
				zip.file('video.mp4', videoBlob);
			} else if (review.videoUrl) {
				// Try to fetch video from URL
				try {
					const videoResponse = await fetch(review.videoUrl);
					if (videoResponse.ok) {
						const blob = await videoResponse.blob();
						zip.file('video.mp4', blob);
					}
				} catch (error) {
					console.warn('Failed to fetch video from URL:', error);
				}
			}

			// Add thumbnail if available
			if (review.thumbnailUrl) {
				try {
					const thumbnailResponse = await fetch(review.thumbnailUrl);
					if (thumbnailResponse.ok) {
						const blob = await thumbnailResponse.blob();
						zip.file('thumbnail.jpg', blob);
					}
				} catch (error) {
					console.warn('Failed to fetch thumbnail:', error);
				}
			}

			// Generate zip file
			const blob = await zip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE',
				compressionOptions: {
					level: 6
				}
			});

			// Save file
			const filename = `${this.sanitizeFilename(review.title)}.crl`;
			saveAs(blob, filename);
		} catch (error) {
			console.error('Failed to export review:', error);
			throw new Error('Failed to export review');
		}
	}

	/**
	 * Import review from .crl file
	 */
	static async importReview(file: File): Promise<{
		review: ReviewExportData;
		videoBlob?: Blob;
		thumbnailBlob?: Blob;
	}> {
		try {
			// Validate file
			await this.validateCrlFile(file);

			// Load zip file
			const zip = await JSZip.loadAsync(file);

			// Read metadata
			const metadataFile = zip.file('metadata.json');
			if (!metadataFile) {
				throw new Error('Invalid .crl file: missing metadata.json');
			}

			const metadataContent = await metadataFile.async('string');
			const metadata = JSON.parse(metadataContent);

			// Validate magic bytes and version
			if (metadata.magic !== this.MAGIC_BYTES) {
				throw new Error('Invalid .crl file: incorrect magic bytes');
			}

			// Read code content
			const codeFile = zip.file('code.txt');
			if (!codeFile) {
				throw new Error('Invalid .crl file: missing code.txt');
			}
			const codeContent = await codeFile.async('string');

			// Read video if present
			let videoBlob: Blob | undefined;
			const videoFile = zip.file('video.mp4');
			if (videoFile) {
				videoBlob = await videoFile.async('blob');
			}

			// Read thumbnail if present
			let thumbnailBlob: Blob | undefined;
			const thumbnailFile = zip.file('thumbnail.jpg');
			if (thumbnailFile) {
				thumbnailBlob = await thumbnailFile.async('blob');
			}

			// Construct review data
			const review: ReviewExportData = {
				...metadata.review,
				codeContent
			};

			return {
				review,
				videoBlob,
				thumbnailBlob
			};
		} catch (error) {
			console.error('Failed to import review:', error);
			throw new Error(
				error instanceof Error ? error.message : 'Failed to import review'
			);
		}
	}

	/**
	 * Validate .crl file format
	 */
	static async validateCrlFile(file: File): Promise<boolean> {
		try {
			// Check file extension
			if (!file.name.endsWith('.crl')) {
				throw new Error('Invalid file extension. Expected .crl file');
			}

			// Check if it's a valid zip file
			try {
				const zip = await JSZip.loadAsync(file);

				// Check for required files
				const hasMetadata = zip.file('metadata.json') !== null;
				const hasCode = zip.file('code.txt') !== null;

				if (!hasMetadata || !hasCode) {
					throw new Error('Invalid .crl file: missing required files');
				}

				return true;
			} catch (error) {
				throw new Error('Invalid .crl file: not a valid zip archive');
			}
		} catch (error) {
			console.error('Validation failed:', error);
			throw error;
		}
	}

	/**
	 * Sanitize filename for safe file system usage
	 */
	private static sanitizeFilename(filename: string): string {
		return filename
			.replace(/[^a-z0-9]/gi, '_')
			.replace(/_+/g, '_')
			.toLowerCase()
			.substring(0, 50);
	}

	/**
	 * Get file size estimate for export
	 */
	static estimateExportSize(review: ReviewExportData, videoSize?: number): number {
		const metadataSize = JSON.stringify(review).length;
		const codeSize = review.codeContent.length;
		const baseSize = metadataSize + codeSize;

		return baseSize + (videoSize || 0);
	}

	/**
	 * Export multiple reviews to a single archive
	 */
	static async exportMultipleReviews(
		reviews: ReviewExportData[],
		archiveName = 'reviews'
	): Promise<void> {
		try {
			const zip = new JSZip();

			// Add index file
			const index = {
				version: this.FILE_VERSION,
				magic: this.MAGIC_BYTES,
				exportedAt: new Date().toISOString(),
				count: reviews.length,
				reviews: reviews.map((r) => ({
					id: r.id,
					title: r.title,
					folder: `review_${r.id}`
				}))
			};

			zip.file('index.json', JSON.stringify(index, null, 2));

			// Add each review in its own folder
			for (const review of reviews) {
				const folderName = `review_${review.id}`;
				const folder = zip.folder(folderName);

				if (folder) {
					folder.file('metadata.json', JSON.stringify(review, null, 2));
					folder.file('code.txt', review.codeContent);
				}
			}

			// Generate and save
			const blob = await zip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE',
				compressionOptions: {
					level: 6
				}
			});

			saveAs(blob, `${archiveName}.zip`);
		} catch (error) {
			console.error('Failed to export multiple reviews:', error);
			throw new Error('Failed to export multiple reviews');
		}
	}
}
