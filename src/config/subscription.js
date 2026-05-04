export const SUBSCRIPTION = {
    free: {
        label: 'Free',
        listingLimit: 5,
        boostAllowed: false,
        featureBadge: false,
        personalized: false,
        prioritySearch: false,
        tags: ['organic'],
    },
    premium: {
        label:          'Premium',
        listingLimit:   Infinity,
        boostAllowed:   true,
        featuredBadge:  true,
        personalized:   true,
        prioritySearch: true,
        tags:           ['organic', 'trending', 'boosted', 'guest_favorite', 'superhost'],
    }
}

export const LISTING_TAGS = {
    organic:        { paid: false,  algorithm: false, description: 'Natural listing' },
    trending:       { paid: false,  algorithm: true,  description: 'High engagement' },
    superhost:      { paid: true,   algorithm: false, description: 'Trust badge' },
    guest_favorite: { paid: true,   algorithm: true,  description: 'High rating' },
    boosted:        { paid: true,   algorithm: false, description: 'Paid promotion' },
    promoted:       { paid: true,   algorithm: false, description: 'Paid promotion' },
};

// Plan limits
export const PLAN_LIMITS = {
    user:   { free: 3,   premium: Infinity },
    agent:  { free: 5,   premium: Infinity },
    agency: { free: 20,  premium: Infinity },
};

