export interface VirtualScrollConfig {
	itemHeight: number;
	containerHeight: number;
	items: any[];
	overscan?: number; // Number of extra items to render above/below visible area
}

export interface VirtualScrollRange {
	start: number;
	end: number;
	offsetY: number;
	visibleItems: any[];
}

/**
 * Virtual scrolling utility for efficiently rendering large lists
 */
export class VirtualScroller {
	private itemHeight: number;
	private containerHeight: number;
	private items: any[];
	private overscan: number;
	private totalHeight: number;

	constructor(config: VirtualScrollConfig) {
		this.itemHeight = config.itemHeight;
		this.containerHeight = config.containerHeight;
		this.items = config.items;
		this.overscan = config.overscan || 3;
		this.totalHeight = this.items.length * this.itemHeight;
	}

	/**
	 * Update items array
	 */
	updateItems(items: any[]): void {
		this.items = items;
		this.totalHeight = this.items.length * this.itemHeight;
	}

	/**
	 * Update container height
	 */
	updateContainerHeight(height: number): void {
		this.containerHeight = height;
	}

	/**
	 * Get the range of visible items based on scroll position
	 */
	getVisibleRange(scrollTop: number): { start: number; end: number } {
		const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
		const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
		const end = Math.min(
			this.items.length,
			start + visibleCount + this.overscan * 2
		);

		return { start, end };
	}

	/**
	 * Get visible items with offset for rendering
	 */
	getVisibleItems(scrollTop: number): VirtualScrollRange {
		const { start, end } = this.getVisibleRange(scrollTop);
		const visibleItems = this.items.slice(start, end);
		const offsetY = start * this.itemHeight;

		return {
			start,
			end,
			offsetY,
			visibleItems
		};
	}

	/**
	 * Get total scrollable height
	 */
	getTotalHeight(): number {
		return this.totalHeight;
	}

	/**
	 * Get item count
	 */
	getItemCount(): number {
		return this.items.length;
	}

	/**
	 * Scroll to specific item index
	 */
	scrollToIndex(index: number): number {
		const clampedIndex = Math.max(0, Math.min(index, this.items.length - 1));
		return clampedIndex * this.itemHeight;
	}

	/**
	 * Get item index at scroll position
	 */
	getItemIndexAtScroll(scrollTop: number): number {
		return Math.floor(scrollTop / this.itemHeight);
	}

	/**
	 * Check if item is visible at current scroll position
	 */
	isItemVisible(index: number, scrollTop: number): boolean {
		const { start, end } = this.getVisibleRange(scrollTop);
		return index >= start && index < end;
	}
}

/**
 * Create a virtual scroller instance
 */
export function createVirtualScroller(config: VirtualScrollConfig): VirtualScroller {
	return new VirtualScroller(config);
}
