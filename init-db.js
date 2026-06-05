import 'dotenv/config';
import sequelize from "./models/config.js";
import {connectDatabase} from "./models/sync.js";

async function init() {
    console.log(" [+] Iniciando la aplicación...");

    try {
        await connectDatabase();
        console.log(" [+] Base de datos inicializada correctamente.");

        await sequelize.close();
        process.exit(0);
    }
    catch (error) {
        console.error(" [-] Error al inicializar la base de datos:", error);
        process.exit(1);
    }
}   
init();