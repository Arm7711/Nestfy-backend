const REQUIRED_VARS = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME',
    'REDIS_URL',
    'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS',
];

export const validateEnv = () => {
    const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
    if (missing.length > 0) {
        throw new Error(`[Startup] Missing required environment variables: ${missing.join(', ')}`);
    }
};