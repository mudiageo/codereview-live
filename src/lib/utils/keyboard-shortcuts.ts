export interface KeyboardShortcut {
	key: string;
	mod?: boolean; // Ctrl on Windows/Linux, Cmd on Mac
	shift?: boolean;
	alt?: boolean;
	action: () => void;
	description: string;
	category?: string;
}

/**
 * Keyboard shortcuts utility
 */
export class KeyboardShortcuts {
	private shortcuts: Map<string, KeyboardShortcut> = new Map();
	private isEnabled = true;

	constructor() {
		this.setupDefaultShortcuts();
	}

	/**
	 * Setup default application shortcuts
	 */
	private setupDefaultShortcuts(): void {
		// These are placeholders - actual actions will be set by the application
		const defaults: KeyboardShortcut[] = [
			{
				key: 'k',
				mod: true,
				action: () => {},
				description: 'Open search',
				category: 'Navigation'
			},
			{
				key: '/',
				mod: true,
				action: () => {},
				description: 'Show keyboard shortcuts',
				category: 'Help'
			},
			{
				key: 'd',
				action: () => {},
				description: 'Go to dashboard (press g then d)',
				category: 'Navigation'
			},
			{
				key: 'p',
				action: () => {},
				description: 'Go to projects (press g then p)',
				category: 'Navigation'
			},
			{
				key: 'r',
				action: () => {},
				description: 'Go to reviews (press g then r)',
				category: 'Navigation'
			},
			{
				key: 'c',
				action: () => {},
				description: 'Create new review',
				category: 'Actions'
			}
		];

		defaults.forEach((shortcut) => {
			this.register(shortcut);
		});
	}

	/**
	 * Register a keyboard shortcut
	 */
	register(shortcut: KeyboardShortcut): void {
		const key = this.getShortcutKey(shortcut);
		this.shortcuts.set(key, shortcut);
	}

	/**
	 * Unregister a keyboard shortcut
	 */
	unregister(shortcut: Partial<KeyboardShortcut>): void {
		const key = this.getShortcutKey(shortcut as KeyboardShortcut);
		this.shortcuts.delete(key);
	}

	/**
	 * Handle keyboard event
	 */
	handleKeyDown(event: KeyboardEvent): boolean {
		if (!this.isEnabled) {
			return false;
		}

		// Don't handle shortcuts when typing in inputs, textareas, or contenteditable
		const target = event.target as HTMLElement;
		if (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable
		) {
			// Exception: Allow Cmd/Ctrl+K for search even in inputs
			if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
				event.preventDefault();
				const shortcut = this.findShortcut(event);
				if (shortcut) {
					shortcut.action();
					return true;
				}
			}
			return false;
		}

		const shortcut = this.findShortcut(event);
		if (shortcut) {
			event.preventDefault();
			shortcut.action();
			return true;
		}

		return false;
	}

	/**
	 * Find matching shortcut for keyboard event
	 */
	private findShortcut(event: KeyboardEvent): KeyboardShortcut | undefined {
		const mod = event.metaKey || event.ctrlKey;
		const shift = event.shiftKey;
		const alt = event.altKey;
		const key = event.key.toLowerCase();

		for (const [, shortcut] of this.shortcuts) {
			if (
				shortcut.key.toLowerCase() === key &&
				!!shortcut.mod === mod &&
				!!shortcut.shift === shift &&
				!!shortcut.alt === alt
			) {
				return shortcut;
			}
		}

		return undefined;
	}

	/**
	 * Get unique key for shortcut
	 */
	private getShortcutKey(shortcut: KeyboardShortcut): string {
		const parts = [];
		if (shortcut.mod) parts.push('mod');
		if (shortcut.shift) parts.push('shift');
		if (shortcut.alt) parts.push('alt');
		parts.push(shortcut.key.toLowerCase());
		return parts.join('+');
	}

	/**
	 * Get all registered shortcuts
	 */
	getAll(): KeyboardShortcut[] {
		return Array.from(this.shortcuts.values());
	}

	/**
	 * Get shortcuts by category
	 */
	getByCategory(category: string): KeyboardShortcut[] {
		return Array.from(this.shortcuts.values()).filter(
			(shortcut) => shortcut.category === category
		);
	}

	/**
	 * Get all categories
	 */
	getCategories(): string[] {
		const categories = new Set<string>();
		for (const shortcut of this.shortcuts.values()) {
			if (shortcut.category) {
				categories.add(shortcut.category);
			}
		}
		return Array.from(categories);
	}

	/**
	 * Format shortcut key for display
	 */
	static formatKey(shortcut: KeyboardShortcut): string {
		const parts = [];

		if (shortcut.mod) {
			// Detect platform
			const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
			parts.push(isMac ? '⌘' : 'Ctrl');
		}

		if (shortcut.shift) {
			parts.push('Shift');
		}

		if (shortcut.alt) {
			parts.push('Alt');
		}

		parts.push(shortcut.key.toUpperCase());

		return parts.join(' + ');
	}

	/**
	 * Enable keyboard shortcuts
	 */
	enable(): void {
		this.isEnabled = true;
	}

	/**
	 * Disable keyboard shortcuts
	 */
	disable(): void {
		this.isEnabled = false;
	}

	/**
	 * Check if shortcuts are enabled
	 */
	isActive(): boolean {
		return this.isEnabled;
	}

	/**
	 * Clear all shortcuts
	 */
	clear(): void {
		this.shortcuts.clear();
	}
}

// Create and export singleton instance
export const keyboardShortcuts = new KeyboardShortcuts();
