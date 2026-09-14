import { sheet, drill, scroll, fade, snap, swap } from '@ssgoi/svelte/view-transitions';

// Define the order of settings tabs for directional snapping
const settingsTabs = [
	'/settings', // Profile
	'/settings/appearance',
	'/settings/video',
	'/settings/ai',
	'/settings/notifications',
	'/settings/integrations',
	'/settings/billing',
	'/settings/team',
	'/settings/security'
];

// Generate snap transitions for settings tabs
const settingsTransitions = [];
for (let i = 0; i < settingsTabs.length; i++) {
	for (let j = 0; j < settingsTabs.length; j++) {
		if (i === j) continue;

		const from = settingsTabs[i];
		const to = settingsTabs[j];

		// If moving to a later tab (higher index), slide to left (enter from right)
		// If moving to an earlier tab (lower index), slide to right (enter from left)
		const direction = i < j ? 'left' : 'right';

		settingsTransitions.push({
			from,
			to,
			transition: snap({ direction })
		});
	}
}

export const transitionConfig = {
	defaultTransition: fade(),
	transitions: [
		// --- Settings Tabs (Snap) ---
		...settingsTransitions,

		// --- Creation Flows (Sheet) ---
		// Higher priority to override wildcards
		{
			from: '/reviews',
			to: '/reviews/new',
			transition: sheet({ direction: 'enter' })
		},
		{
			from: '/reviews/new',
			to: '/reviews',
			transition: sheet({ direction: 'exit' })
		},
		{
			from: '/projects',
			to: '/projects/new',
			transition: sheet({ direction: 'enter' })
		},
		{
			from: '/projects/new',
			to: '/projects',
			transition: sheet({ direction: 'exit' })
		},

		// --- Detail Flows (Drill) ---
		// Projects drill down
		{
			from: '/projects',
			to: '/projects/*',
			transition: drill({ direction: 'enter' }),
			symmetric: true
		},
		// Reviews drill down
		{
			from: '/reviews',
			to: '/reviews/*',
			transition: drill({ direction: 'enter' }),
			symmetric: true
		},
        // Dashboard drill down (if any items lead to details)
        {
            from: '/dashboard',
            to: '/projects/*',
            transition: drill({ direction: 'enter' }),
            symmetric: true
        },
        {
            from: '/dashboard',
            to: '/reviews/*',
            transition: drill({ direction: 'enter' }),
            symmetric: true
        },

		// --- Onboarding (Scroll) ---
		{
			from: '/onboarding/*',
			to: '/onboarding/*',
			transition: scroll({ direction: 'up' }),
            symmetric: true
		},

		// --- Top Level Navigation (swap) ---
        // Transitions between main sibling pages
		{
			from: '/dashboard',
			to: '/projects',
			transition: swap(),
			symmetric: true
		},
		{
			from: '/dashboard',
			to: '/reviews',
			transition: swap(),
			symmetric: true
		},
		{
			from: '/dashboard',
			to: '/settings',
			transition: swap(),
			symmetric: true
		},
		{
			from: '/projects',
			to: '/reviews',
			transition: swap(),
			symmetric: true
		},
		{
			from: '/projects',
			to: '/settings',
			transition: swap(),
			symmetric: true
		},
		{
			from: '/reviews',
			to: '/settings',
			transition: swap(),
			symmetric: true
		},
        // Team page
        {
			from: '/team',
			to: '/dashboard',
			transition: swap(),
			symmetric: true
		},
        {
			from: '/team',
			to: '/projects',
			transition: swap(),
			symmetric: true
		},
        {
			from: '/team',
			to: '/reviews',
			transition: swap(),
			symmetric: true
		},
        {
			from: '/team',
			to: '/settings',
			transition: swap(),
			symmetric: true
		}
	]
};
