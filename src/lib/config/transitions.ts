import { sheet, drill, scroll, fade, snap, swap } from '@ssgoi/svelte/view-transitions';

export const transitionConfig = {
	defaultTransition: fade(),
	transitions: [
		// --- Settings Tabs (Snap) ---
		{
			from: '/settings/*',
			to: '/settings/*',
			transition: snap(),
			symmetric: true
		},

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
            // We might need dynamic direction based on step, but simple scroll is fine for now
            // or we use symmetric if they go back?
            // scroll({ direction: 'up' }) implies next page comes from bottom.
            // If we go back, we want it to go down.
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
