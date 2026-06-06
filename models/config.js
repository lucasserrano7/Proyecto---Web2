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

const sequelize = new Sequelize(process.env.DB_URL,{
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions:{
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
})

 try {
   await sequelize.authenticate();
   console.log('Connection has been established successfully.');
 } catch (error) {
   console.error('Unable to connect to the database:', error);
 }

export default sequelize;