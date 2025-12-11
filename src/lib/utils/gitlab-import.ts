/**
 * GitLab API integration for importing code reviews from merge requests
 */

export interface GitLabRepository {
	id: number;
	name: string;
	path_with_namespace: string;
	description: string | null;
	visibility: string;
	web_url: string;
	last_activity_at: string;
}

export interface MergeRequest {
	iid: number;
	title: string;
	state: string;
	web_url: string;
	created_at: string;
	updated_at: string;
	author: {
		username: string;
		avatar_url: string;
	};
	source_branch: string;
	target_branch: string;
}

export interface MergeRequestChange {
	old_path: string;
	new_path: string;
	diff: string;
	new_file: boolean;
	renamed_file: boolean;
	deleted_file: boolean;
}

export class GitLabImporter {
	private baseUrl: string;
	private accessToken: string;

	constructor(accessToken: string, baseUrl = 'https://gitlab.com') {
		this.accessToken = accessToken;
		this.baseUrl = baseUrl;
	}

	private async fetch(endpoint: string, options: RequestInit = {}) {
		const url = `${this.baseUrl}/api/v4${endpoint}`;
		const response = await fetch(url, {
			...options,
			headers: {
				'PRIVATE-TOKEN': this.accessToken,
				'Content-Type': 'application/json',
				...options.headers
			}
		});

		if (!response.ok) {
			throw new Error(`GitLab API error: ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * Get user's repositories
	 */
	async getUserRepos(options: { search?: string; page?: number; perPage?: number } = {}) {
		const { search, page = 1, perPage = 30 } = options;
		const params = new URLSearchParams({
			page: page.toString(),
			per_page: perPage.toString(),
			membership: 'true',
			order_by: 'last_activity_at',
			sort: 'desc'
		});

		if (search) {
			params.append('search', search);
		}

		const repos = await this.fetch(`/projects?${params}`);
		return repos as GitLabRepository[];
	}

	/**
	 * Get merge requests for a repository
	 */
	async getRepoMergeRequests(
		projectId: number,
		options: { state?: 'opened' | 'closed' | 'merged'; page?: number; perPage?: number } = {}
	) {
		const { state = 'opened', page = 1, perPage = 30 } = options;
		const params = new URLSearchParams({
			state,
			page: page.toString(),
			per_page: perPage.toString(),
			order_by: 'updated_at',
			sort: 'desc'
		});

		const mrs = await this.fetch(`/projects/${projectId}/merge_requests?${params}`);
		return mrs as MergeRequest[];
	}

	/**
	 * Get merge request diff
	 */
	async getMergeRequestDiff(projectId: number, mrIid: number) {
		const changes = await this.fetch(`/projects/${projectId}/merge_requests/${mrIid}/changes`);
		return changes.changes as MergeRequestChange[];
	}

	/**
	 * Get merge request commits
	 */
	async getMergeRequestCommits(projectId: number, mrIid: number) {
		const commits = await this.fetch(`/projects/${projectId}/merge_requests/${mrIid}/commits`);
		return commits;
	}

	/**
	 * Generate unified diff from merge request
	 */
	async getMergeRequestUnifiedDiff(projectId: number, mrIid: number): Promise<string> {
		const changes = await this.getMergeRequestDiff(projectId, mrIid);
		
		let unifiedDiff = '';
		for (const change of changes) {
			if (change.diff) {
				unifiedDiff += `diff --git a/${change.old_path} b/${change.new_path}\n`;
				unifiedDiff += change.diff + '\n';
			}
		}
		
		return unifiedDiff;
	}

	/**
	 * Exchange OAuth code for access token
	 */
	static async getAccessToken(
		code: string,
		clientId: string,
		clientSecret: string,
		redirectUri: string,
		baseUrl = 'https://gitlab.com'
	) {
		const response = await fetch(`${baseUrl}/oauth/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
				grant_type: 'authorization_code',
				redirect_uri: redirectUri
			})
		});

		if (!response.ok) {
			throw new Error(`Failed to exchange code for token: ${response.statusText}`);
		}

		const data = await response.json();
		return {
			access_token: data.access_token,
			refresh_token: data.refresh_token,
			expires_in: data.expires_in
		};
	}
}
