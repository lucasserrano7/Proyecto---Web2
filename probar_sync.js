import 'dotenv/config';
import  sequelize  from './models/config.js';
import './models/sync.js';

await sequelize.sync({ force: true });
console.log('Tablas creadas');
console.table(tablas);
process.exit(0);