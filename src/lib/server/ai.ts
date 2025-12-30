/**
 * Core AI Service - Gemini Integration for Code Review
 * 
 * Provides AI-powered code analysis including:
 * - Code explanation
 * - Bug detection  
 * - Security analysis
 * - Performance suggestions
 * - Review summarization
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { db } from '$lib/server/db';
import { aiUsage } from '$lib/server/db/schema';

// Types for AI responses
export interface CodeAnalysis {
    summary: string;
    explanation: string;
    bugs: BugReport[];
    suggestions: Suggestion[];
    securityIssues: SecurityIssue[];
    performanceNotes: PerformanceNote[];
    codeSmells: CodeSmell[];
    overallScore: number; // 0-100
    reviewTime: number; // estimated time saved in minutes
}

export interface BugReport {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    line?: number;
    description: string;
    suggestion: string;
    codeSnippet?: string;
}

export interface Suggestion {
    id: string;
    type: 'refactor' | 'optimization' | 'best-practice' | 'readability';
    line?: number;
    description: string;
    before?: string;
    after?: string;
    impact: 'high' | 'medium' | 'low';
}

export interface SecurityIssue {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    recommendation: string;
    cweId?: string;
}

export interface PerformanceNote {
    id: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
}

export interface CodeSmell {
    id: string;
    type: string;
    description: string;
    line?: number;
    suggestion: string;
}

interface AIParams {
    code: string;
    language: string;
    apiKey: string;
    userId: string;
    reviewId?: string;
}

// Initialize Gemini client
function getModel(apiKey: string): GenerativeModel {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// Track AI usage
async function trackUsage(
    userId: string,
    reviewId: string | undefined,
    feature: string,
    tokensUsed: number,
    success: boolean
) {
    try {
        await db.insert(aiUsage).values({
            userId,
            reviewId,
            feature,
            tokensUsed,
            success,
        });
    } catch (error) {
        console.error('Failed to track AI usage:', error);
    }
}

// Parse JSON from Gemini response (handles markdown code blocks)
function parseAIResponse<T>(text: string): T {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    return JSON.parse(cleaned.trim());
}

/**
 * Explain what the code does in plain English
 */
export async function explainCode(params: AIParams): Promise<{ explanation: string }> {
    const { code, language, apiKey, userId, reviewId } = params;
    const model = getModel(apiKey);

    const prompt = `You are a senior software engineer. Explain the following ${language} code in clear, concise terms.
Focus on:
- What the code does overall
- Key functions and their purposes  
- Important data flow
- Notable patterns or techniques used

Keep the explanation professional but accessible. Format as markdown.

Code:
\`\`\`${language}
${code}
\`\`\`

Provide a clear explanation:`;

    try {
        const result = await model.generateContent(prompt);
        const explanation = result.response.text();

        await trackUsage(userId, reviewId, 'explain', explanation.length, true);

        return { explanation };
    } catch (error) {
        await trackUsage(userId, reviewId, 'explain', 0, false);
        throw error;
    }
}

/**
 * Generate improvement suggestions for the code
 */
export async function generateReviewSuggestions(params: AIParams): Promise<{ suggestions: Suggestion[] }> {
    const { code, language, apiKey, userId, reviewId } = params;
    const model = getModel(apiKey);

    const prompt = `You are a senior code reviewer. Analyze this ${language} code and provide improvement suggestions.

For each suggestion, provide:
- type: "refactor" | "optimization" | "best-practice" | "readability"
- line: approximate line number (optional)
- description: what should be improved
- before: current code snippet (optional)
- after: suggested improvement (optional)  
- impact: "high" | "medium" | "low"

Return as JSON array of suggestions. Only include substantive, actionable suggestions.

Code:
\`\`\`${language}
${code}
\`\`\`

Return JSON:
{ "suggestions": [...] }`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = parseAIResponse<{ suggestions: Omit<Suggestion, 'id'>[] }>(text);

        const suggestions = parsed.suggestions.map((s, i) => ({
            ...s,
            id: `sug-${i + 1}`,
        }));

        await trackUsage(userId, reviewId, 'suggestions', text.length, true);

        return { suggestions };
    } catch (error) {
        await trackUsage(userId, reviewId, 'suggestions', 0, false);
        throw error;
    }
}

/**
 * Generate a summary of the code for review
 */
export async function summarizeReview(params: AIParams & { description?: string }): Promise<{ summary: string }> {
    const { code, language, apiKey, userId, reviewId, description } = params;
    const model = getModel(apiKey);

    const prompt = `You are a technical writer. Create a concise review summary for this ${language} code change.

${description ? `Context: ${description}` : ''}

The summary should:
- Describe what the code does in 2-3 sentences
- Highlight key changes or additions
- Note any important considerations for reviewers

Keep it under 150 words. Write in a professional tone.

Code:
\`\`\`${language}
${code}
\`\`\`

Summary:`;

    try {
        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        await trackUsage(userId, reviewId, 'summary', summary.length, true);

        return { summary };
    } catch (error) {
        await trackUsage(userId, reviewId, 'summary', 0, false);
        throw error;
    }
}

/**
 * Detect code smells and quality issues
 */
export async function detectCodeSmells(params: AIParams): Promise<{ codeSmells: CodeSmell[] }> {
    const { code, language, apiKey, userId, reviewId } = params;
    const model = getModel(apiKey);

    const prompt = `You are a code quality expert. Identify code smells in this ${language} code.

Look for:
- Long methods or functions
- Deep nesting
- Duplicate code
- Magic numbers/strings
- Poor naming
- Complex conditionals
- Dead code
- Missing error handling
- Tight coupling

For each smell, provide:
- type: category of the smell
- description: what the issue is
- line: approximate line number (optional)
- suggestion: how to fix it

Return as JSON. Only flag genuine issues.

Code:
\`\`\`${language}
${code}
\`\`\`

Return JSON:
{ "codeSmells": [...] }`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = parseAIResponse<{ codeSmells: Omit<CodeSmell, 'id'>[] }>(text);

        const codeSmells = parsed.codeSmells.map((s, i) => ({
            ...s,
            id: `smell-${i + 1}`,
        }));

        await trackUsage(userId, reviewId, 'code-smells', text.length, true);

        return { codeSmells };
    } catch (error) {
        await trackUsage(userId, reviewId, 'code-smells', 0, false);
        throw error;
    }
}

/**
 * Comprehensive code analysis - combines all analysis types
 */
export async function analyzeCode(params: AIParams): Promise<CodeAnalysis> {
    const { code, language, apiKey, userId, reviewId } = params;
    const model = getModel(apiKey);

    const prompt = `You are an expert code reviewer. Perform a comprehensive analysis of this ${language} code.

Analyze for:
1. BUGS: Logic errors, potential crashes, edge cases
2. SECURITY: SQL injection, XSS, auth issues, data exposure
3. PERFORMANCE: Inefficient operations, memory issues, N+1 queries
4. CODE QUALITY: Smells, maintainability, readability
5. BEST PRACTICES: Modern patterns, language idioms

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of the code",
  "explanation": "Detailed explanation of what the code does",
  "bugs": [
    {
      "severity": "critical|high|medium|low",
      "type": "category",
      "line": number or null,
      "description": "what's wrong",
      "suggestion": "how to fix",
      "codeSnippet": "relevant code"
    }
  ],
  "securityIssues": [
    {
      "severity": "critical|high|medium|low",
      "type": "category",
      "description": "the issue",
      "recommendation": "how to fix",
      "cweId": "CWE-XXX if applicable"
    }
  ],
  "performanceNotes": [
    {
      "impact": "high|medium|low",
      "description": "the issue",
      "recommendation": "how to improve"
    }
  ],
  "suggestions": [
    {
      "type": "refactor|optimization|best-practice|readability",
      "line": number or null,
      "description": "what to improve",
      "before": "current code",
      "after": "suggested code",
      "impact": "high|medium|low"
    }
  ],
  "codeSmells": [
    {
      "type": "category",
      "description": "the smell",
      "line": number or null,
      "suggestion": "how to fix"
    }
  ],
  "overallScore": 0-100,
  "reviewTime": estimated minutes this analysis saved
}

Be thorough but avoid false positives. Only report genuine issues.

Code:
\`\`\`${language}
${code}
\`\`\`

Return the JSON analysis:`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = parseAIResponse<Omit<CodeAnalysis, 'bugs' | 'securityIssues' | 'performanceNotes' | 'suggestions' | 'codeSmells'> & {
            bugs: Omit<BugReport, 'id'>[];
            securityIssues: Omit<SecurityIssue, 'id'>[];
            performanceNotes: Omit<PerformanceNote, 'id'>[];
            suggestions: Omit<Suggestion, 'id'>[];
            codeSmells: Omit<CodeSmell, 'id'>[];
        }>(text);

        // Add IDs to all items
        const analysis: CodeAnalysis = {
            ...parsed,
            bugs: parsed.bugs?.map((b, i) => ({ ...b, id: `bug-${i + 1}` })) || [],
            securityIssues: parsed.securityIssues?.map((s, i) => ({ ...s, id: `sec-${i + 1}` })) || [],
            performanceNotes: parsed.performanceNotes?.map((p, i) => ({ ...p, id: `perf-${i + 1}` })) || [],
            suggestions: parsed.suggestions?.map((s, i) => ({ ...s, id: `sug-${i + 1}` })) || [],
            codeSmells: parsed.codeSmells?.map((c, i) => ({ ...c, id: `smell-${i + 1}` })) || [],
        };

        await trackUsage(userId, reviewId, 'full-analysis', text.length, true);

        return analysis;
    } catch (error) {
        await trackUsage(userId, reviewId, 'full-analysis', 0, false);
        throw error;
    }
}

/**
 * Auto-check review checklist items based on code analysis
 */
export async function checkReviewItems(
    params: AIParams,
    checklistItems: { id: string; text: string; category: string }[]
): Promise<{ checkedItems: string[]; notes: Record<string, string> }> {
    const { code, language, apiKey, userId, reviewId } = params;
    const model = getModel(apiKey);

    const itemsList = checklistItems
        .map(item => `- [${item.id}] ${item.text} (${item.category})`)
        .join('\n');

    const prompt = `You are a code reviewer. Based on this ${language} code, determine which checklist items can be verified as passing.

Checklist items:
${itemsList}

For each item, analyze the code and determine if it passes. Only mark items as checked if you are confident they pass.

Return JSON:
{
  "checkedItems": ["id1", "id2"],
  "notes": {
    "id1": "Brief note on why it passes or concerns"
  }
}

Code:
\`\`\`${language}
${code}
\`\`\`

Return the JSON:`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = parseAIResponse<{ checkedItems: string[]; notes: Record<string, string> }>(text);

        await trackUsage(userId, reviewId, 'checklist', text.length, true);

        return parsed;
    } catch (error) {
        await trackUsage(userId, reviewId, 'checklist', 0, false);
        throw error;
    }
}

/**
 * Estimate review time based on code complexity
 */
export async function estimateReviewTime(params: AIParams): Promise<{ minutes: number; complexity: string; factors: string[] }> {
    const { code, language, apiKey, userId, reviewId } = params;
    const model = getModel(apiKey);

    const lineCount = code.split('\n').length;

    const prompt = `Estimate how long it would take an experienced developer to review this ${language} code.

Consider:
- ${lineCount} lines of code
- Complexity of logic
- Number of functions/classes
- Dependencies and integrations
- Testing requirements

Return JSON:
{
  "minutes": estimated minutes,
  "complexity": "low|medium|high|very-high",
  "factors": ["list of factors affecting time"]
}

Code:
\`\`\`${language}
${code}
\`\`\`

Return JSON:`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = parseAIResponse<{ minutes: number; complexity: string; factors: string[] }>(text);

        await trackUsage(userId, reviewId, 'time-estimate', text.length, true);

        return parsed;
    } catch (error) {
        await trackUsage(userId, reviewId, 'time-estimate', 0, false);
        throw error;
    }
}
