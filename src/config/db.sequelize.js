import { Sequelize } from 'sequelize';
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const caPath = path.join(__dirname, '../certificates/ca.pem');

const {
    DB_HOST,
    DB_NAME,
    DB_PASS,
    DB_USER,
    DB_PORT
} = process.env;



const sequelize = new Sequelize(
    DB_NAME,
    DB_USER,
    DB_PASS,
    {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            ssl: {
                ca: await fs.readFile(caPath),
                rejectUnauthorized: false
            }
        }
    }
);

export default sequelize;
