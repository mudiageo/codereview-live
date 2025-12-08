import Peer, { DataConnection } from 'peerjs';
import { EncryptionUtil } from './encryption';

export interface P2PCallbacks {
	onProgress?: (progress: number) => void;
	onComplete?: () => void;
	onError?: (error: Error) => void;
	onReceive?: (data: any) => void;
	onConnect?: () => void;
	onDisconnect?: () => void;
}

const CHUNK_SIZE = 16384; // 16KB chunks

/**
 * P2P file and data sharing utility using PeerJS
 */
export class P2PSharing {
	private peer: Peer | null = null;
	private connection: DataConnection | null = null;
	private callbacks: P2PCallbacks = {};
	private peerId: string | null = null;

	/**
	 * Initialize peer connection
	 */
	async initialize(peerId?: string): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				this.peer = new Peer(peerId || undefined, {
					debug: 2
				});

				this.peer.on('open', (id) => {
					this.peerId = id;
					console.log('Peer initialized with ID:', id);
					resolve(id);
				});

				this.peer.on('error', (error) => {
					console.error('Peer error:', error);
					this.callbacks.onError?.(error);
					reject(error);
				});

				this.peer.on('connection', (conn) => {
					this.handleIncomingConnection(conn);
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Connect to another peer
	 */
	async connect(peerId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.peer) {
				reject(new Error('Peer not initialized'));
				return;
			}

			try {
				this.connection = this.peer.connect(peerId, {
					reliable: true
				});

				this.connection.on('open', () => {
					console.log('Connected to peer:', peerId);
					this.callbacks.onConnect?.();
					resolve();
				});

				this.setupConnectionHandlers(this.connection);

				this.connection.on('error', (error) => {
					console.error('Connection error:', error);
					this.callbacks.onError?.(error);
					reject(error);
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Handle incoming connection
	 */
	private handleIncomingConnection(conn: DataConnection): void {
		this.connection = conn;
		this.setupConnectionHandlers(conn);

		conn.on('open', () => {
			console.log('Incoming connection opened');
			this.callbacks.onConnect?.();
		});
	}

	/**
	 * Setup connection event handlers
	 */
	private setupConnectionHandlers(conn: DataConnection): void {
		conn.on('data', async (data: any) => {
			try {
				if (data.type === 'review') {
					this.callbacks.onReceive?.(data.payload);
				} else if (data.type === 'file') {
					await this.handleFileReceive(data);
				} else if (data.type === 'encrypted') {
					this.callbacks.onReceive?.(data);
				}
			} catch (error) {
				console.error('Error handling received data:', error);
				this.callbacks.onError?.(error as Error);
			}
		});

		conn.on('close', () => {
			console.log('Connection closed');
			this.callbacks.onDisconnect?.();
		});
	}

	/**
	 * Send review data
	 */
	async sendReview(review: any, encrypt = false): Promise<void> {
		if (!this.connection) {
			throw new Error('No active connection');
		}

		try {
			let payload = review;

			if (encrypt) {
				const password = EncryptionUtil.generatePassword();
				const encrypted = await EncryptionUtil.encrypt(JSON.stringify(review), password);

				payload = {
					type: 'encrypted',
					data: encrypted,
					password
				};
			}

			this.connection.send({
				type: encrypt ? 'encrypted' : 'review',
				payload
			});

			this.callbacks.onComplete?.();
		} catch (error) {
			console.error('Failed to send review:', error);
			this.callbacks.onError?.(error as Error);
			throw error;
		}
	}

	/**
	 * Send file in chunks
	 */
	async sendFile(file: File, encrypt = false): Promise<void> {
		if (!this.connection) {
			throw new Error('No active connection');
		}

		try {
			const fileData = await this.readFileAsArrayBuffer(file);
			const chunks = this.splitIntoChunks(fileData);

			// Send file metadata
			this.connection.send({
				type: 'file',
				action: 'start',
				name: file.name,
				size: file.size,
				totalChunks: chunks.length,
				encrypted
			});

			// Send chunks
			for (let i = 0; i < chunks.length; i++) {
				let chunkData = chunks[i];

				if (encrypt) {
					const password = EncryptionUtil.generatePassword();
					const encrypted = await EncryptionUtil.encrypt(
						String.fromCharCode(...new Uint8Array(chunkData)),
						password
					);
					chunkData = new TextEncoder().encode(encrypted);
				}

				this.connection.send({
					type: 'file',
					action: 'chunk',
					index: i,
					data: Array.from(new Uint8Array(chunkData))
				});

				const progress = ((i + 1) / chunks.length) * 100;
				this.callbacks.onProgress?.(progress);
			}

			// Send completion
			this.connection.send({
				type: 'file',
				action: 'complete'
			});

			this.callbacks.onComplete?.();
		} catch (error) {
			console.error('Failed to send file:', error);
			this.callbacks.onError?.(error as Error);
			throw error;
		}
	}

	/**
	 * Handle file receive
	 */
	private async handleFileReceive(data: any): Promise<void> {
		if (data.action === 'start') {
			// Initialize file receive
			console.log('Receiving file:', data.name);
		} else if (data.action === 'chunk') {
			// Receive chunk
			const progress = ((data.index + 1) / data.totalChunks) * 100;
			this.callbacks.onProgress?.(progress);
		} else if (data.action === 'complete') {
			// File receive complete
			this.callbacks.onComplete?.();
		}
	}

	/**
	 * Set callback handlers
	 */
	setCallbacks(callbacks: P2PCallbacks): void {
		this.callbacks = { ...this.callbacks, ...callbacks };
	}

	/**
	 * Disconnect and cleanup
	 */
	disconnect(): void {
		if (this.connection) {
			this.connection.close();
			this.connection = null;
		}

		if (this.peer) {
			this.peer.destroy();
			this.peer = null;
		}

		this.peerId = null;
		console.log('P2P connection disconnected');
	}

	/**
	 * Get current peer ID
	 */
	getPeerId(): string | null {
		return this.peerId;
	}

	/**
	 * Helper: Read file as ArrayBuffer
	 */
	private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as ArrayBuffer);
			reader.onerror = reject;
			reader.readAsArrayBuffer(file);
		});
	}

	/**
	 * Helper: Split ArrayBuffer into chunks
	 */
	private splitIntoChunks(buffer: ArrayBuffer): ArrayBuffer[] {
		const chunks: ArrayBuffer[] = [];
		const totalSize = buffer.byteLength;

		for (let offset = 0; offset < totalSize; offset += CHUNK_SIZE) {
			const size = Math.min(CHUNK_SIZE, totalSize - offset);
			chunks.push(buffer.slice(offset, offset + size));
		}

		return chunks;
	}
}
