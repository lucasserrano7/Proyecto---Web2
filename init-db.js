import "dotenv/config";
import pg from "pg";

const {
  DB_HOST = "localhost",
  DB_PORT = 5432,
  DB_USER = "postgres",
  DB_PASSWORD,
  DB_NAME = "fotaza2_db",
} = process.env;

async function init() {
  console.log(" [+] Iniciando db:init...");

  if (!DB_PASSWORD) {
    console.error(" [-] Falta DB_PASSWORD. Copiá .env.example a .env y completalo.");
    process.exit(1);
  }

  try {
    const admin = new pg.Client({
      host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: "postgres",
    });
    await admin.connect();
    const { rowCount } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]
    );
    if (!rowCount) {
      await admin.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(` [+] Base "${DB_NAME}" creada.`);
    }
    await admin.end();


    const { default: sequelize } = await import("./models/config.js");
    await import("./models/sync.js"); 

    await sequelize.sync({ force: true });  // (force: true BORRA y vuelve a hacer todo, es decir borra datos)
    console.log(" [+] Tablas creadas.");

    await sequelize.query(
      `ALTER TABLE valoraciones ADD CONSTRAINT chk_puntaje CHECK (puntaje BETWEEN 1 AND 5)`
    );
    await sequelize.query(
      `ALTER TABLE seguidores ADD CONSTRAINT chk_no_autoseguir CHECK (seguidor_id <> seguido_id)`
    );


    await sequelize.query(`DROP TABLE IF EXISTS "Sessions"`);
    await sequelize.query(`
      CREATE TABLE "Sessions" (
        sid VARCHAR(36) PRIMARY KEY,
        expires TIMESTAMPTZ,
        data TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL,
        "updatedAt" TIMESTAMPTZ NOT NULL
      )
    `);

    console.log(" [+] Base de datos lista.");
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error(" [-] Error al inicializar la base de datos:", error);
    process.exit(1);
  }
}

init();