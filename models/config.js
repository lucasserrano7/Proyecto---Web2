import { parse } from 'dotenv';
import'dotenv/config';
import { Sequelize } from "sequelize";
import * as pg from "pg";

const sslConn = process.env.DB_SSL === 'true' ? {
    ssl: {
    require: true,
    rejectUnauthorized: false,
    }
} : undefined;
console.log('DB_SSL:', process.env.DB_SSL);
console.log('sslConn:', sslConn);

const sequelize = new Sequelize( {
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: sslConn,
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10),
})

// try {
//   await sequelize.authenticate();
//   console.log('Connection has been established successfully.');
// } catch (error) {
//   console.error('Unable to connect to the database:', error);
// }

export default sequelize;