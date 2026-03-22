import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const caPath = path.join(__dirname, '../certificates/ca.pem');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 17853,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false,
        dialectOptions: {
            ssl: {
                ca: fs.readFileSync(caPath),
                rejectUnauthorized: true,
            },
        },
    }
);

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB via SSL');
    } catch (error) {
        console.error('❌ DB Connection failed:', error.message);
        process.exit(1);
    }
};

export default sequelize;