import Shield from '@lucide/svelte/icons/shield';
import Zap from '@lucide/svelte/icons/zap';
import CheckSquare from '@lucide/svelte/icons/check-square';
import Code from '@lucide/svelte/icons/code';
import Server from '@lucide/svelte/icons/server';

export interface ChecklistItem {
  id: string;
  text: string;
  category: 'general' | 'security' | 'performance' | 'style' | 'logic' | 'testing';
  autoCheck: boolean;
  description?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  items: ChecklistItem[];
}

export const checklistTemplates: ChecklistTemplate[] = [
  {
    id: 'general',
    name: 'General Review',
    description: 'Standard code review checklist',
    icon: CheckSquare,
    items: [
      { id: 'gen-1', text: 'Code follows style guide', category: 'style', autoCheck: true },
      { id: 'gen-2', text: 'Variable naming is clear', category: 'style', autoCheck: true },
      { id: 'gen-3', text: 'No unused variables/imports', category: 'style', autoCheck: true },
      { id: 'gen-4', text: 'Error handling implemented', category: 'logic', autoCheck: true },
      { id: 'gen-5', text: 'Tests included', category: 'testing', autoCheck: false },
    ]
  },
  {
    id: 'security',
    name: 'Security Audit',
    description: 'Security-focused review',
    icon: Shield,
    items: [
      { id: 'sec-1', text: 'Input validation', category: 'security', autoCheck: true },
      { id: 'sec-2', text: 'No secrets in code', category: 'security', autoCheck: true },
      { id: 'sec-3', text: 'Authentication checks', category: 'security', autoCheck: true },
      { id: 'sec-4', text: 'SQL injection prevention', category: 'security', autoCheck: true },
    ]
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Performance optimization review',
    icon: Zap,
    items: [
      { id: 'perf-1', text: 'No N+1 queries', category: 'performance', autoCheck: true },
      { id: 'perf-2', text: 'Memoization used appropriately', category: 'performance', autoCheck: true },
      { id: 'perf-3', text: 'Efficient algorithms', category: 'performance', autoCheck: true },
    ]
  }
];

export function getTemplate(id: string) {
  return checklistTemplates.find(t => t.id === id);
}
