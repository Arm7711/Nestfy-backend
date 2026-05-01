export const formatUserFull = (user) => {
    const profile = user.profile ?? null;
    const agent   = user.agent   ?? null;
    const agency  = user.agency  ?? null;

    return {

        id:              user.id,
        name:            user.name,
        email:           user.email,
        role:            user.role,
        avatar:          user.avatar,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt:       user.createdAt,


        verified: {
            email:  !!user.emailVerifiedAt,
            phone:  !!profile?.phoneVerifiedAt,
            govId:  !!profile?.govIdVerifiedAt,
        },


        profile: profile ? {
            preferredFirstName:       profile.preferredFirstName,
            phone:             profile.phone,
            bio:               profile.bio,
            location: {
                country: profile.country,
                city:    profile.city,
                state:   profile.state,
            },
            professional: {
                specializations:   profile.specializations   ?? [],
                yearsOfExperience: profile.yearsOfExperience ?? 0,
                languages:         profile.languages          ?? [],
            },
            media: {
                coverPhoto:      profile.coverPhoto,
                introVideo:      profile.introVideo,
                portfolioImages: profile.portfolioImages ?? [],
            },
            availability: {
                workingHours:     profile.workingHours,
                responseTime:     profile.responseTime,
                preferredContact: profile.preferredContact,
                isAvailable:      profile.isAvailable,
            },
            social: {
                facebook:  profile.facebook,
                instagram: profile.instagram,
                telegram:  profile.telegram,
                linkedin:  profile.linkedin,
                website:   profile.website,
            },
            stats: {
                totalReviews:  profile.totalReviews,
                averageRating: profile.averageRating,
                profileViews:  profile.profileViews,
                responseRate:  profile.responseRate,
            },
        } : null,

        agent: agent ? {
            id:            agent.id,
            status:        agent.status,
            isVerified:    agent.isVerified,
            plan:          agent.plan,
            planExpiresAt: agent.planExpiresAt,
            licenseNumber: agent.licenseNumber,
            stats: {
                totalListings: agent.totalListings,
                totalViews:    agent.totalViews,
                rating:        agent.rating,
                reviewsCount:  agent.reviewsCount,
            },
        } : null,

        agency: agency ? {
            id:            agency.id,
            name:          agency.name,
            status:        agency.status,
            isVerified:    agency.isVerified,
            stats: {
                totalListings: agency.totalListings,
                totalViews:    agency.totalViews,
            },
        } : null,
    };
};