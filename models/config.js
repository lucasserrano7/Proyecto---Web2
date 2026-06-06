import { parse } from 'dotenv';
import'dotenv/config';
import { Sequelize } from "sequelize";
import * as pg from "pg";


const sequelize = new Sequelize(process.env.DATABASE_URL,{
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