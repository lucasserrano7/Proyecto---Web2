import sequelize from './config.js';
import {Coleccion} from './coleccion.js';
import {Comentario} from './comentario.js';
import {Compra} from './compra.js';
import {denunciaComentario} from './denunciaComentario.js';
import {denunciaPublicacion} from './denunciaPublicacion.js';
import {denunciaUsuario} from './denunciaUsuario.js';
import {Etiquetas} from './etiquetas.js';
import {Favoritos} from './favoritos.js';
import {Imagen} from './Imagen.js';
import {notificacion} from './notificacion.js';
import {publicacion} from './publicacion.js';
import {seguidores} from './seguidor.js';
import {Usuario} from './usuario.js';
import {Validador} from './validador.js';
import {Valoracion} from './valoracion.js';

export async function connectDatabase(){
    try{
        await sequelize.authenticate(); // testear la conexión
        console.log(' [+] Conexión a la BdD establecida.');

        await sequelize.sync({ alter: true});
        console.log(' [+] sincronizado de modelos.');
    }
    catch(error){
        console.error(' [x] No se pudo conectar a la BdD:', error);
        throw error;
    }
} 