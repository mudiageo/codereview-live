/**
 * Utility for parsing unified diff and patch file formats
 */

export interface ParsedDiff {
	files: DiffFile[];
	metadata: DiffMetadata;
	stats: DiffStats;
}

export interface DiffFile {
	oldPath: string;
	newPath: string;
	hunks: DiffHunk[];
	additions: number;
	deletions: number;
	isNew: boolean;
	isDeleted: boolean;
	isRenamed: boolean;
}

export interface DiffHunk {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	lines: DiffLine[];
}

export interface DiffLine {
	type: 'add' | 'delete' | 'context';
	content: string;
	oldLineNumber?: number;
	newLineNumber?: number;
}

export interface DiffMetadata {
	author?: string;
	date?: string;
	subject?: string;
	message?: string;
}

export interface DiffStats {
	filesChanged: number;
	additions: number;
	deletions: number;
}

export class DiffParser {
	/**
	 * Parse a unified diff or patch file
	 */
	static parse(diffContent: string): ParsedDiff {
		const lines = diffContent.split('\n');
		const files: DiffFile[] = [];
		const metadata: DiffMetadata = {};
		
		let currentFile: DiffFile | null = null;
		let currentHunk: DiffHunk | null = null;
		let oldLineNumber = 0;
		let newLineNumber = 0;

		// Parse metadata from git format-patch style headers
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Author
			if (line.startsWith('From: ')) {
				metadata.author = line.substring(6).trim();
				continue;
			}

			// Date
			if (line.startsWith('Date: ')) {
				metadata.date = line.substring(6).trim();
				continue;
			}

			// Subject (first line of commit message)
			if (line.startsWith('Subject: ')) {
				metadata.subject = line.substring(9).trim();
				continue;
			}

			// Start of diff section
			if (line.startsWith('diff --git')) {
				// Save previous file if exists
				if (currentFile && currentHunk) {
					currentFile.hunks.push(currentHunk);
					currentHunk = null;
				}
				if (currentFile) {
					files.push(currentFile);
				}

				// Extract file paths
				const match = line.match(/diff --git a\/(.*?) b\/(.*?)$/);
				if (match) {
					currentFile = {
						oldPath: match[1],
						newPath: match[2],
						hunks: [],
						additions: 0,
						deletions: 0,
						isNew: false,
						isDeleted: false,
						isRenamed: false
					};
				}
				continue;
			}

			// File mode changes
			if (line.startsWith('new file mode')) {
				if (currentFile) currentFile.isNew = true;
				continue;
			}

			if (line.startsWith('deleted file mode')) {
				if (currentFile) currentFile.isDeleted = true;
				continue;
			}

			if (line.startsWith('rename from') || line.startsWith('rename to')) {
				if (currentFile) currentFile.isRenamed = true;
				continue;
			}

			// Hunk header
			if (line.startsWith('@@')) {
				// Save previous hunk
				if (currentHunk && currentFile) {
					currentFile.hunks.push(currentHunk);
				}

				// Parse hunk header: @@ -oldStart,oldLines +newStart,newLines @@
				const hunkMatch = line.match(/@@\s*-(\d+)(?:,(\d+))?\s*\+(\d+)(?:,(\d+))?\s*@@/);
				if (hunkMatch) {
					oldLineNumber = parseInt(hunkMatch[1]);
					const oldLines = hunkMatch[2] ? parseInt(hunkMatch[2]) : 1;
					newLineNumber = parseInt(hunkMatch[3]);
					const newLines = hunkMatch[4] ? parseInt(hunkMatch[4]) : 1;

					currentHunk = {
						oldStart: oldLineNumber,
						oldLines,
						newStart: newLineNumber,
						newLines,
						lines: []
					};
				}
				continue;
			}

			// Diff lines (inside a hunk)
			if (currentHunk) {
				const firstChar = line[0];
				
				if (firstChar === '+') {
					currentHunk.lines.push({
						type: 'add',
						content: line.substring(1),
						newLineNumber: newLineNumber++
					});
					if (currentFile) currentFile.additions++;
				} else if (firstChar === '-') {
					currentHunk.lines.push({
						type: 'delete',
						content: line.substring(1),
						oldLineNumber: oldLineNumber++
					});
					if (currentFile) currentFile.deletions++;
				} else if (firstChar === ' ') {
					currentHunk.lines.push({
						type: 'context',
						content: line.substring(1),
						oldLineNumber: oldLineNumber++,
						newLineNumber: newLineNumber++
					});
				}
			}
		}

		// Save last hunk and file
		if (currentHunk && currentFile) {
			currentFile.hunks.push(currentHunk);
		}
		if (currentFile) {
			files.push(currentFile);
		}

		// Calculate total stats
		const stats: DiffStats = {
			filesChanged: files.length,
			additions: files.reduce((sum, file) => sum + file.additions, 0),
			deletions: files.reduce((sum, file) => sum + file.deletions, 0)
		};

		return { files, metadata, stats };
	}

	/**
	 * Convert parsed diff back to unified diff format
	 */
	static stringify(parsed: ParsedDiff): string {
		let output = '';

		// Add metadata if present
		if (parsed.metadata.author) {
			output += `From: ${parsed.metadata.author}\n`;
		}
		if (parsed.metadata.date) {
			output += `Date: ${parsed.metadata.date}\n`;
		}
		if (parsed.metadata.subject) {
			output += `Subject: ${parsed.metadata.subject}\n`;
		}
		if (parsed.metadata.message) {
			output += `\n${parsed.metadata.message}\n`;
		}

		// Add diffs
		for (const file of parsed.files) {
			output += `\ndiff --git a/${file.oldPath} b/${file.newPath}\n`;
			
			if (file.isNew) {
				output += `new file mode 100644\n`;
			}
			if (file.isDeleted) {
				output += `deleted file mode 100644\n`;
			}
			if (file.isRenamed) {
				output += `rename from ${file.oldPath}\n`;
				output += `rename to ${file.newPath}\n`;
			}

			output += `--- a/${file.oldPath}\n`;
			output += `+++ b/${file.newPath}\n`;

			for (const hunk of file.hunks) {
				output += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;
				
				for (const line of hunk.lines) {
					const prefix = line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' ';
					output += `${prefix}${line.content}\n`;
				}
			}
		}

		return output;
	}

	/**
	 * Detect language from file path
	 */
	static detectLanguage(filePath: string): string {
		const ext = filePath.split('.').pop()?.toLowerCase() || '';
		
		const languageMap: Record<string, string> = {
			js: 'javascript',
			jsx: 'javascript',
			ts: 'typescript',
			tsx: 'typescript',
			py: 'python',
			rb: 'ruby',
			java: 'java',
			go: 'go',
			rs: 'rust',
			c: 'c',
			cpp: 'cpp',
			h: 'c',
			hpp: 'cpp',
			cs: 'csharp',
			php: 'php',
			swift: 'swift',
			kt: 'kotlin',
			scala: 'scala',
			html: 'html',
			css: 'css',
			scss: 'scss',
			less: 'less',
			json: 'json',
			xml: 'xml',
			yml: 'yaml',
			yaml: 'yaml',
			md: 'markdown',
			sql: 'sql',
			sh: 'bash',
			bash: 'bash'
		};

		return languageMap[ext] || 'plaintext';
	}
}
