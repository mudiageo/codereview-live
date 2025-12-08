import { Octokit } from '@octokit/rest';

export interface Repository {
	id: number;
	name: string;
	full_name: string;
	description: string | null;
	private: boolean;
	html_url: string;
	updated_at: string;
}

export interface PullRequest {
	number: number;
	title: string;
	state: string;
	html_url: string;
	created_at: string;
	updated_at: string;
	user: {
		login: string;
		avatar_url: string;
	};
	head: {
		ref: string;
	};
	base: {
		ref: string;
	};
}

export interface PullRequestFile {
	filename: string;
	status: string;
	additions: number;
	deletions: number;
	changes: number;
	patch?: string;
}

/**
 * GitHub API integration for importing code reviews from pull requests
 */
export class GitHubImporter {
	private octokit: Octokit;

	constructor(accessToken: string) {
		this.octokit = new Octokit({
			auth: accessToken
		});
	}

	/**
	 * Get list of user repositories
	 */
	async getUserRepos(perPage = 30, page = 1): Promise<Repository[]> {
		try {
			const { data } = await this.octokit.repos.listForAuthenticatedUser({
				sort: 'updated',
				per_page: perPage,
				page
			});

			return data.map((repo) => ({
				id: repo.id,
				name: repo.name,
				full_name: repo.full_name,
				description: repo.description,
				private: repo.private,
				html_url: repo.html_url,
				updated_at: repo.updated_at || ''
			}));
		} catch (error) {
			console.error('Failed to fetch repositories:', error);
			throw new Error('Failed to fetch repositories from GitHub');
		}
	}

	/**
	 * Get pull requests for a repository
	 */
	async getRepoPullRequests(
		owner: string,
		repo: string,
		state: 'open' | 'closed' | 'all' = 'all',
		perPage = 30,
		page = 1
	): Promise<PullRequest[]> {
		try {
			const { data } = await this.octokit.pulls.list({
				owner,
				repo,
				state,
				sort: 'updated',
				direction: 'desc',
				per_page: perPage,
				page
			});

			return data.map((pr) => ({
				number: pr.number,
				title: pr.title,
				state: pr.state,
				html_url: pr.html_url,
				created_at: pr.created_at,
				updated_at: pr.updated_at,
				user: {
					login: pr.user?.login || 'unknown',
					avatar_url: pr.user?.avatar_url || ''
				},
				head: {
					ref: pr.head.ref
				},
				base: {
					ref: pr.base.ref
				}
			}));
		} catch (error) {
			console.error('Failed to fetch pull requests:', error);
			throw new Error('Failed to fetch pull requests from GitHub');
		}
	}

	/**
	 * Get unified diff for a pull request
	 */
	async getPullRequestDiff(owner: string, repo: string, pullNumber: number): Promise<string> {
		try {
			const { data } = await this.octokit.pulls.get({
				owner,
				repo,
				pull_number: pullNumber,
				mediaType: {
					format: 'diff'
				}
			});

			return data as unknown as string;
		} catch (error) {
			console.error('Failed to fetch pull request diff:', error);
			throw new Error('Failed to fetch pull request diff from GitHub');
		}
	}

	/**
	 * Get files changed in a pull request
	 */
	async getPullRequestFiles(
		owner: string,
		repo: string,
		pullNumber: number
	): Promise<PullRequestFile[]> {
		try {
			const { data } = await this.octokit.pulls.listFiles({
				owner,
				repo,
				pull_number: pullNumber
			});

			return data.map((file) => ({
				filename: file.filename,
				status: file.status,
				additions: file.additions,
				deletions: file.deletions,
				changes: file.changes,
				patch: file.patch
			}));
		} catch (error) {
			console.error('Failed to fetch pull request files:', error);
			throw new Error('Failed to fetch pull request files from GitHub');
		}
	}

	/**
	 * Exchange GitHub OAuth code for access token
	 * Note: This should be called from the server-side
	 */
	static async getAccessToken(
		code: string,
		clientId: string,
		clientSecret: string
	): Promise<string> {
		try {
			const response = await fetch('https://github.com/login/oauth/access_token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({
					client_id: clientId,
					client_secret: clientSecret,
					code
				})
			});

			const data = await response.json();

			if (data.error) {
				throw new Error(data.error_description || 'Failed to get access token');
			}

			return data.access_token;
		} catch (error) {
			console.error('Failed to exchange code for token:', error);
			throw new Error('Failed to authenticate with GitHub');
		}
	}
}
