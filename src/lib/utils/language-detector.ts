/**
 * Language detection utility for code files
 */
export class LanguageDetector {
	private static readonly EXTENSION_MAP: Record<string, string> = {
		// JavaScript/TypeScript
		js: 'javascript',
		jsx: 'javascript',
		ts: 'typescript',
		tsx: 'typescript',
		mjs: 'javascript',
		cjs: 'javascript',
		mts: 'typescript',
		cts: 'typescript',

		// Web
		html: 'html',
		htm: 'html',
		css: 'css',
		scss: 'scss',
		sass: 'sass',
		less: 'less',
		vue: 'vue',
		svelte: 'svelte',

		// Python
		py: 'python',
		pyw: 'python',
		pyx: 'python',

		// Ruby
		rb: 'ruby',
		erb: 'ruby',

		// Java
		java: 'java',
		class: 'java',
		jar: 'java',

		// C/C++
		c: 'c',
		h: 'c',
		cpp: 'cpp',
		cc: 'cpp',
		cxx: 'cpp',
		hpp: 'cpp',
		hh: 'cpp',
		hxx: 'cpp',

		// C#
		cs: 'csharp',
		csx: 'csharp',

		// Go
		go: 'go',

		// Rust
		rs: 'rust',

		// PHP
		php: 'php',
		phtml: 'php',

		// Shell
		sh: 'shell',
		bash: 'shell',
		zsh: 'shell',
		fish: 'shell',

		// Other languages
		sql: 'sql',
		swift: 'swift',
		kt: 'kotlin',
		kts: 'kotlin',
		scala: 'scala',
		r: 'r',
		dart: 'dart',
		lua: 'lua',
		pl: 'perl',
		pm: 'perl',
		ex: 'elixir',
		exs: 'elixir',
		elm: 'elm',
		clj: 'clojure',
		cljs: 'clojure',
		ml: 'ocaml',
		hs: 'haskell',
		erl: 'erlang',
		jl: 'julia',

		// Config/Data
		json: 'json',
		yaml: 'yaml',
		yml: 'yaml',
		toml: 'toml',
		xml: 'xml',
		md: 'markdown',
		mdx: 'markdown',
		txt: 'plaintext',

		// Docker/Infrastructure
		dockerfile: 'dockerfile',
		tf: 'terraform',
		tfvars: 'terraform'
	};

	private static readonly CONTENT_PATTERNS: Array<{
		pattern: RegExp;
		language: string;
	}> = [
		{ pattern: /^#!\/.*\/python/, language: 'python' },
		{ pattern: /^#!\/.*\/node/, language: 'javascript' },
		{ pattern: /^#!\/.*\/ruby/, language: 'ruby' },
		{ pattern: /^#!\/.*\/bash/, language: 'shell' },
		{ pattern: /^#!\/.*\/sh/, language: 'shell' },
		{ pattern: /^#!\/.*\/perl/, language: 'perl' },
		{ pattern: /^#!\/.*\/php/, language: 'php' },
		{ pattern: /^package\s+\w+\s*;/, language: 'java' },
		{ pattern: /^namespace\s+\w+/, language: 'csharp' },
		{ pattern: /^using\s+System/, language: 'csharp' },
		{ pattern: /^import\s+\w+/, language: 'python' },
		{ pattern: /^from\s+\w+\s+import/, language: 'python' },
		{ pattern: /^def\s+\w+\s*\(/, language: 'python' },
		{ pattern: /^class\s+\w+\s*:/, language: 'python' },
		{ pattern: /^function\s+\w+\s*\(/, language: 'javascript' },
		{ pattern: /^const\s+\w+\s*=/, language: 'javascript' },
		{ pattern: /^let\s+\w+\s*=/, language: 'javascript' },
		{ pattern: /^var\s+\w+\s*=/, language: 'javascript' },
		{ pattern: /^export\s+(default|const|function)/, language: 'javascript' },
		{ pattern: /^import\s+.*\s+from/, language: 'javascript' },
		{ pattern: /^<\?php/, language: 'php' },
		{ pattern: /^<!DOCTYPE\s+html>/i, language: 'html' },
		{ pattern: /^<html/i, language: 'html' },
		{ pattern: /^SELECT\s+.*\s+FROM/i, language: 'sql' },
		{ pattern: /^CREATE\s+TABLE/i, language: 'sql' },
		{ pattern: /^package\s+main/, language: 'go' },
		{ pattern: /^func\s+\w+\s*\(/, language: 'go' },
		{ pattern: /^fn\s+\w+\s*\(/, language: 'rust' },
		{ pattern: /^use\s+std::/, language: 'rust' }
	];

	/**
	 * Detect programming language from filename
	 */
	static detectFromFilename(filename: string): string {
		// Handle special cases
		const lowerFilename = filename.toLowerCase();
		if (lowerFilename === 'dockerfile' || lowerFilename.startsWith('dockerfile.')) {
			return 'dockerfile';
		}
		if (lowerFilename === 'makefile') {
			return 'makefile';
		}
		if (lowerFilename === 'rakefile') {
			return 'ruby';
		}
		if (lowerFilename === 'gemfile' || lowerFilename === 'gemfile.lock') {
			return 'ruby';
		}
		if (lowerFilename === 'package.json' || lowerFilename === 'tsconfig.json') {
			return 'json';
		}

		// Extract extension
		const parts = filename.split('.');
		if (parts.length < 2) {
			return 'plaintext';
		}

		const extension = parts[parts.length - 1].toLowerCase();
		return this.EXTENSION_MAP[extension] || 'plaintext';
	}

	/**
	 * Detect programming language from code content using heuristics
	 */
	static detectFromContent(content: string): string {
		if (!content || content.trim().length === 0) {
			return 'plaintext';
		}

		// Check for shebang and common patterns
		const lines = content.split('\n').slice(0, 20); // Check first 20 lines
		const firstLines = lines.join('\n');

		for (const { pattern, language } of this.CONTENT_PATTERNS) {
			if (pattern.test(firstLines)) {
				return language;
			}
		}

		// Fallback to keyword frequency analysis
		const languageScores: Record<string, number> = {};

		// JavaScript/TypeScript keywords
		const jsKeywords = ['const', 'let', 'var', 'function', 'async', 'await', 'import', 'export'];
		languageScores.javascript = this.countKeywords(content, jsKeywords);

		// TypeScript specific
		const tsKeywords = ['interface', 'type', 'enum', 'readonly', 'private', 'public'];
		languageScores.typescript = this.countKeywords(content, tsKeywords);

		// Python keywords
		const pyKeywords = ['def', 'class', 'import', 'from', 'print', 'lambda', 'self'];
		languageScores.python = this.countKeywords(content, pyKeywords);

		// Java keywords
		const javaKeywords = ['public', 'private', 'class', 'interface', 'extends', 'implements'];
		languageScores.java = this.countKeywords(content, javaKeywords);

		// Find language with highest score
		const maxScore = Math.max(...Object.values(languageScores));
		if (maxScore > 2) {
			const detectedLanguage = Object.entries(languageScores).find(
				([, score]) => score === maxScore
			)?.[0];
			if (detectedLanguage) {
				return detectedLanguage;
			}
		}

		return 'plaintext';
	}

	/**
	 * Count occurrences of keywords in content
	 */
	private static countKeywords(content: string, keywords: string[]): number {
		let count = 0;
		const contentLower = content.toLowerCase();

		for (const keyword of keywords) {
			const regex = new RegExp(`\\b${keyword}\\b`, 'g');
			const matches = contentLower.match(regex);
			if (matches) {
				count += matches.length;
			}
		}

		return count;
	}

	/**
	 * Detect language from filename and content (preferred method)
	 */
	static detect(filename: string, content?: string): string {
		// First try filename detection
		const fromFilename = this.detectFromFilename(filename);

		// If we have content and filename detection was ambiguous, use content
		if (content && (fromFilename === 'plaintext' || fromFilename === 'txt')) {
			return this.detectFromContent(content);
		}

		return fromFilename;
	}
}
