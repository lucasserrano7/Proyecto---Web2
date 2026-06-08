import sequelize from "./models/config.js";
import { Usuario } from "./models/usuario.js";
import bcrypt from 'bcrypt';

async function seed() {
  await sequelize.sync({ alter: true });
  const saltRounds = 10;
  const passwordUser1 = await bcrypt.hash("fotaza123", saltRounds);
  const passwordUser2 = await bcrypt.hash("fotaza245!", saltRounds);
  const passwordUser3 = await bcrypt.hash("gulp1998!", saltRounds);
  await Usuario.bulkCreate([
    {
      username: "fotaza_test1",
      password: passwordUser1,
      email: "fotaza@gmail.com",
      Nro_publicaciones_bajadas: 0,
      estado: true,
      ofertas: false,
    },
    {
      username: "fotaza_test2",
      password: passwordUser2,
      email: "fotaza2@gmail.com",
      Nro_publicaciones_bajadas: 0,
      estado: true,
      ofertas: true,
    },
    {
      username: "sergioro234",
      password: passwordUser3,
      email: "sergioro234@gmail.com",
      Nro_publicaciones_bajadas: 0,
      estado: true,
      ofertas: true,
    },
  ]);
  console.log("Usuarios creados con exito")
}
seed();
