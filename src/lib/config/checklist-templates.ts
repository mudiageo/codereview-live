/**
 * Review Checklist Templates
 *
 * Predefined templates for different types of code reviews
 */

export interface ChecklistItem {
    id: string;
    text: string;
    category: 'security' | 'performance' | 'style' | 'logic' | 'testing';
    autoCheck: boolean;
    description?: string;
}

export interface ChecklistTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    items: ChecklistItem[];
}

export const checklistTemplates: ChecklistTemplate[] = [
    {
        id: 'security',
        name: 'Security Review',
        description: 'Critical security checks for production code',
        icon: '🔒',
        items: [
            {
                id: 'sec-1',
                text: 'SQL injection prevention verified',
                category: 'security',
                autoCheck: true,
                description: 'Check for parameterized queries',
            },
            {
                id: 'sec-2',
                text: 'XSS prevention in place',
                category: 'security',
                autoCheck: true,
                description: 'Output encoding and sanitization',
            },
            {
                id: 'sec-3',
                text: 'Authentication properly implemented',
                category: 'security',
                autoCheck: false,
                description: 'Verify auth flows and token handling',
            },
            {
                id: 'sec-4',
                text: 'Sensitive data not exposed',
                category: 'security',
                autoCheck: true,
                description: 'No API keys, passwords in code',
            },
            {
                id: 'sec-5',
                text: 'Input validation on all user inputs',
                category: 'security',
                autoCheck: true,
                description: 'Server-side validation for forms',
            },
            {
                id: 'sec-6',
                text: 'CSRF protection enabled',
                category: 'security',
                autoCheck: false,
                description: 'Check for CSRF tokens on forms',
            },
            {
                id: 'sec-7',
                text: 'Rate limiting implemented',
                category: 'security',
                autoCheck: false,
                description: 'API endpoints protected from abuse',
            },
        ],
    },
    {
        id: 'performance',
        name: 'Performance Review',
        description: 'Optimize for speed and efficiency',
        icon: '⚡',
        items: [
            {
                id: 'perf-1',
                text: 'No N+1 query issues',
                category: 'performance',
                autoCheck: true,
                description: 'Database queries are optimized',
            },
            {
                id: 'perf-2',
                text: 'Proper caching implemented',
                category: 'performance',
                autoCheck: false,
                description: 'Cache expensive operations',
            },
            {
                id: 'perf-3',
                text: 'No unnecessary re-renders',
                category: 'performance',
                autoCheck: true,
                description: 'React/Svelte components optimized',
            },
            {
                id: 'perf-4',
                text: 'Images and assets optimized',
                category: 'performance',
                autoCheck: false,
                description: 'Proper sizing, compression, lazy loading',
            },
            {
                id: 'perf-5',
                text: 'Database indexes used properly',
                category: 'performance',
                autoCheck: true,
                description: 'Queries use appropriate indexes',
            },
            {
                id: 'perf-6',
                text: 'Async operations handled correctly',
                category: 'performance',
                autoCheck: true,
                description: 'No blocking operations on main thread',
            },
        ],
    },
    {
        id: 'general',
        name: 'General Review',
        description: 'Standard code quality checks',
        icon: '✅',
        items: [
            {
                id: 'gen-1',
                text: 'Code follows project conventions',
                category: 'style',
                autoCheck: false,
                description: 'Naming, formatting, structure',
            },
            {
                id: 'gen-2',
                text: 'No obvious logic errors',
                category: 'logic',
                autoCheck: true,
                description: 'Control flow and conditions correct',
            },
            {
                id: 'gen-3',
                text: 'Error handling is comprehensive',
                category: 'logic',
                autoCheck: true,
                description: 'Edge cases and errors handled',
            },
            {
                id: 'gen-4',
                text: 'Code is readable and well-documented',
                category: 'style',
                autoCheck: false,
                description: 'Comments where needed, clear naming',
            },
            {
                id: 'gen-5',
                text: 'No dead code or unused imports',
                category: 'style',
                autoCheck: true,
                description: 'Clean up unused code',
            },
            {
                id: 'gen-6',
                text: 'Tests cover critical paths',
                category: 'testing',
                autoCheck: false,
                description: 'Unit and integration tests present',
            },
            {
                id: 'gen-7',
                text: 'No hardcoded values',
                category: 'style',
                autoCheck: true,
                description: 'Use constants or config',
            },
        ],
    },
    {
        id: 'frontend',
        name: 'Frontend Review',
        description: 'UI/UX and frontend-specific checks',
        icon: '🎨',
        items: [
            {
                id: 'fe-1',
                text: 'Responsive design verified',
                category: 'style',
                autoCheck: false,
                description: 'Works on mobile, tablet, desktop',
            },
            {
                id: 'fe-2',
                text: 'Accessibility requirements met',
                category: 'style',
                autoCheck: true,
                description: 'ARIA labels, keyboard navigation',
            },
            {
                id: 'fe-3',
                text: 'Loading states implemented',
                category: 'logic',
                autoCheck: true,
                description: 'Spinners, skeletons for async ops',
            },
            {
                id: 'fe-4',
                text: 'Error states handled gracefully',
                category: 'logic',
                autoCheck: true,
                description: 'User-friendly error messages',
            },
            {
                id: 'fe-5',
                text: 'Form validation present',
                category: 'logic',
                autoCheck: true,
                description: 'Client-side validation for forms',
            },
            {
                id: 'fe-6',
                text: 'No console errors or warnings',
                category: 'style',
                autoCheck: false,
                description: 'Clean console output',
            },
        ],
    },
    {
        id: 'api',
        name: 'API Review',
        description: 'Backend API and database checks',
        icon: '🔌',
        items: [
            {
                id: 'api-1',
                text: 'Proper HTTP status codes used',
                category: 'logic',
                autoCheck: true,
                description: '200, 201, 400, 401, 404, 500 etc.',
            },
            {
                id: 'api-2',
                text: 'Request validation implemented',
                category: 'security',
                autoCheck: true,
                description: 'Validate body, params, query',
            },
            {
                id: 'api-3',
                text: 'Authorization checks in place',
                category: 'security',
                autoCheck: false,
                description: 'Users can only access their data',
            },
            {
                id: 'api-4',
                text: 'Database transactions used correctly',
                category: 'logic',
                autoCheck: true,
                description: 'Atomic operations where needed',
            },
            {
                id: 'api-5',
                text: 'API responses are consistent',
                category: 'style',
                autoCheck: true,
                description: 'Standard response format',
            },
            {
                id: 'api-6',
                text: 'Logging and monitoring ready',
                category: 'logic',
                autoCheck: false,
                description: 'Proper logging for debugging',
            },
        ],
    },
];

/**
 * Get a template by ID
 */
export function getTemplate(id: string): ChecklistTemplate | undefined {
    return checklistTemplates.find(t => t.id === id);
}

/**
 * Get all templates as a simple list
 */
export function getTemplateList(): Array<{ id: string; name: string; icon: string }> {
    return checklistTemplates.map(t => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
    }));
}

/**
 * Create a checklist state from a template
 */
export function createChecklistState(templateId: string): Record<string, boolean> {
    const template = getTemplate(templateId);
    if (!template) return {};

    return template.items.reduce((acc, item) => {
        acc[item.id] = false;
        return acc;
    }, {} as Record<string, boolean>);
}
