export interface SearchableReview {
	id: string;
	title: string;
	description?: string;
	codeContent: string;
	codeLanguage?: string;
	metadata?: {
		tags?: string[];
		filesChanged?: string[];
		[key: string]: any;
	};
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface SearchableProject {
	id: string;
	name: string;
	description?: string;
	repoUrl?: string;
	createdAt: Date | string;
}

export interface SearchResult<T> {
	item: T;
	score: number;
	matches: string[];
}

/**
 * Search engine utility for reviews and projects
 */
export class SearchEngine {
	/**
	 * Search and sort reviews by relevance
	 */
	static searchReviews(
		reviews: SearchableReview[],
		query: string
	): SearchResult<SearchableReview>[] {
		if (!query || query.trim().length === 0) {
			return reviews.map((item) => ({ item, score: 1, matches: [] }));
		}

		const normalizedQuery = query.toLowerCase().trim();
		const keywords = normalizedQuery.split(/\s+/);

		const results = reviews
			.map((review) => {
				const { score, matches } = this.calculateReviewScore(review, keywords);
				return { item: review, score, matches };
			})
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score);

		return results;
	}

	/**
	 * Search and sort projects by relevance
	 */
	static searchProjects(
		projects: SearchableProject[],
		query: string
	): SearchResult<SearchableProject>[] {
		if (!query || query.trim().length === 0) {
			return projects.map((item) => ({ item, score: 1, matches: [] }));
		}

		const normalizedQuery = query.toLowerCase().trim();
		const keywords = normalizedQuery.split(/\s+/);

		const results = projects
			.map((project) => {
				const { score, matches } = this.calculateProjectScore(project, keywords);
				return { item: project, score, matches };
			})
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score);

		return results;
	}

	/**
	 * Calculate relevance score for a review
	 */
	private static calculateReviewScore(
		review: SearchableReview,
		keywords: string[]
	): { score: number; matches: string[] } {
		let score = 0;
		const matches: string[] = [];

		const title = review.title.toLowerCase();
		const description = (review.description || '').toLowerCase();
		const codeContent = review.codeContent.toLowerCase();
		const language = (review.codeLanguage || '').toLowerCase();
		const tags = review.metadata?.tags?.map((t) => t.toLowerCase()) || [];
		const files = review.metadata?.filesChanged?.map((f) => f.toLowerCase()) || [];

		for (const keyword of keywords) {
			// Title match (highest weight)
			if (title.includes(keyword)) {
				score += 10;
				matches.push('title');
			}

			// Description match
			if (description.includes(keyword)) {
				score += 5;
				matches.push('description');
			}

			// Language match
			if (language.includes(keyword)) {
				score += 3;
				matches.push('language');
			}

			// Tag match
			if (tags.some((tag) => tag.includes(keyword))) {
				score += 4;
				matches.push('tags');
			}

			// File match
			if (files.some((file) => file.includes(keyword))) {
				score += 3;
				matches.push('files');
			}

			// Code content match (lowest weight, but still relevant)
			if (codeContent.includes(keyword)) {
				score += 1;
				matches.push('code');
			}
		}

		return { score, matches: [...new Set(matches)] };
	}

	/**
	 * Calculate relevance score for a project
	 */
	private static calculateProjectScore(
		project: SearchableProject,
		keywords: string[]
	): { score: number; matches: string[] } {
		let score = 0;
		const matches: string[] = [];

		const name = project.name.toLowerCase();
		const description = (project.description || '').toLowerCase();
		const repoUrl = (project.repoUrl || '').toLowerCase();

		for (const keyword of keywords) {
			// Name match (highest weight)
			if (name.includes(keyword)) {
				score += 10;
				matches.push('name');
			}

			// Description match
			if (description.includes(keyword)) {
				score += 5;
				matches.push('description');
			}

			// Repository URL match
			if (repoUrl.includes(keyword)) {
				score += 3;
				matches.push('repository');
			}
		}

		return { score, matches: [...new Set(matches)] };
	}

	/**
	 * Highlight matching text with <mark> tags
	 */
	static highlightMatch(text: string, query: string): string {
		if (!query || query.trim().length === 0) {
			return text;
		}

		const keywords = query.toLowerCase().trim().split(/\s+/);
		let highlightedText = text;

		for (const keyword of keywords) {
			// Escape special regex characters
			const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp(`(${escapedKeyword})`, 'gi');
			highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
		}

		return highlightedText;
	}

	/**
	 * Filter reviews by multiple criteria
	 */
	static filterReviews(
		reviews: SearchableReview[],
		filters: {
			language?: string;
			tags?: string[];
			dateFrom?: Date;
			dateTo?: Date;
		}
	): SearchableReview[] {
		return reviews.filter((review) => {
			// Filter by language
			if (filters.language && review.codeLanguage !== filters.language) {
				return false;
			}

			// Filter by tags
			if (filters.tags && filters.tags.length > 0) {
				const reviewTags = review.metadata?.tags || [];
				const hasMatchingTag = filters.tags.some((tag) => reviewTags.includes(tag));
				if (!hasMatchingTag) {
					return false;
				}
			}

			// Filter by date range
			const reviewDate = new Date(review.createdAt);
			if (filters.dateFrom && reviewDate < filters.dateFrom) {
				return false;
			}
			if (filters.dateTo && reviewDate > filters.dateTo) {
				return false;
			}

			return true;
		});
	}

	/**
	 * Get unique tags from reviews
	 */
	static extractTags(reviews: SearchableReview[]): string[] {
		const tagsSet = new Set<string>();

		for (const review of reviews) {
			const tags = review.metadata?.tags || [];
			tags.forEach((tag) => tagsSet.add(tag));
		}

		return Array.from(tagsSet).sort();
	}

	/**
	 * Get unique languages from reviews
	 */
	static extractLanguages(reviews: SearchableReview[]): string[] {
		const languagesSet = new Set<string>();

		for (const review of reviews) {
			if (review.codeLanguage) {
				languagesSet.add(review.codeLanguage);
			}
		}

		return Array.from(languagesSet).sort();
	}
}
