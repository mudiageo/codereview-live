/**
 * Utility class for encryption/decryption using Web Crypto API
 * Uses AES-GCM encryption with PBKDF2 key derivation
 */
export class EncryptionUtil {
	private static readonly ALGORITHM = 'AES-GCM';
	private static readonly KEY_LENGTH = 256;
	private static readonly ITERATIONS = 100000;
	private static readonly SALT_LENGTH = 16;
	private static readonly IV_LENGTH = 12;

	/**
	 * Derive a cryptographic key from a password using PBKDF2
	 */
	static async getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
		const encoder = new TextEncoder();
		const passwordBuffer = encoder.encode(password);

		// Import the password as a key
		const baseKey = await crypto.subtle.importKey(
			'raw',
			passwordBuffer,
			'PBKDF2',
			false,
			['deriveBits', 'deriveKey']
		);

		// Derive the actual encryption key
		return crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt,
				iterations: this.ITERATIONS,
				hash: 'SHA-256'
			},
			baseKey,
			{
				name: this.ALGORITHM,
				length: this.KEY_LENGTH
			},
			false,
			['encrypt', 'decrypt']
		);
	}

	/**
	 * Encrypt data using AES-GCM
	 * @returns Base64-encoded string containing salt, iv, and encrypted data
	 */
	static async encrypt(data: string, password: string): Promise<string> {
		const encoder = new TextEncoder();
		const dataBuffer = encoder.encode(data);

		// Generate random salt and IV
		const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
		const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

		// Derive key from password
		const key = await this.getKey(password, salt);

		// Encrypt the data
		const encryptedBuffer = await crypto.subtle.encrypt(
			{
				name: this.ALGORITHM,
				iv
			},
			key,
			dataBuffer
		);

		// Combine salt, iv, and encrypted data
		const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
		combined.set(salt, 0);
		combined.set(iv, salt.length);
		combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

		// Convert to base64
		return btoa(String.fromCharCode(...combined));
	}

	/**
	 * Decrypt data using AES-GCM
	 * @param encryptedData Base64-encoded string from encrypt()
	 */
	static async decrypt(encryptedData: string, password: string): Promise<string> {
		try {
			// Decode from base64
			const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

			// Extract salt, iv, and encrypted data
			const salt = combined.slice(0, this.SALT_LENGTH);
			const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
			const encrypted = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);

			// Derive key from password
			const key = await this.getKey(password, salt);

			// Decrypt the data
			const decryptedBuffer = await crypto.subtle.decrypt(
				{
					name: this.ALGORITHM,
					iv
				},
				key,
				encrypted
			);

			// Convert back to string
			const decoder = new TextDecoder();
			return decoder.decode(decryptedBuffer);
		} catch (error) {
			throw new Error('Decryption failed. Invalid password or corrupted data.');
		}
	}

	/**
	 * Generate a random secure password
	 */
	static generatePassword(length = 32): string {
		const charset =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
		const randomValues = crypto.getRandomValues(new Uint8Array(length));

		return Array.from(randomValues)
			.map((value) => charset[value % charset.length])
			.join('');
	}
}
