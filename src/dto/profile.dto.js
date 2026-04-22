/**
 * DTO — Data Transfer Object
 * Why use DTO?
 * The controller does NOT pass raw req.body directly to the service layer.
 * DTO validates and sanitizes input, allowing only safe fields to pass through.
 * This protects against issues like mass assignment attacks.
 */

export const ProfileUpdateDTO  =(body)=> {
    const ALLOWED = [
        'fullName', 'username', 'phone', 'bio',
        'country', 'language', 'timezone',
    ];

    const dto = {};
    for(const key in ALLOWED) {
        if(body[key] !== undefined) {
            dto[key] = typeof body[key] === 'string'
                ? body[key].trim().replace(/<[^>]*>/g, '')
                : body[key];
        }
    }
    return dto;
};


export const AvatarUpdateDTO = (file) => ({
    avatar: file?.path ?? null,
});