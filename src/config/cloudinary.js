import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';
import 'dotenv/config';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // HTTPS ONlY
});


cloudinary.api.ping()
    .then(() => logger.info('Successfully connected'))
    .catch(err => logger.error('❌ Cloudinary connection failed:', err.message));

export default cloudinary