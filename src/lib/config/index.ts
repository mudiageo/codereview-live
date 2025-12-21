// Re-export everything from the existing config files
export * from './plans';
export * from './features';

// Import for default export
import { plans } from './plans';
import { featureFlags, planLimits, hasFeatureAccess, getLimit, isWithinLimit } from './features';

// Unified config object
export const config = {
	plans,
	features: featureFlags,
	limits: planLimits,
	utils: {
		hasFeatureAccess,
		getLimit,
		isWithinLimit
	}
};

export default config;
