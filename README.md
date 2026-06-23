

# FOTAZA 2 - Red Social de Fotografías

> Plataforma colaborativa para compartir, vender y descubrir fotografías profesionales

[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2+-blue)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow)](#)

---

##  Descripción del Proyecto

**FOTAZA 2** es una aplicación web de código abierto diseñada como trabajo integrador para la asignatura *Programación Web II*. Es una red social especializada en fotografía que permite a los usuarios:

- Publicar y compartir fotografías con licencias personalizables
- Buscar contenido mediante un motor de búsqueda
- Valorar y comentar publicaciones
- Seguir a otros fotógrafos

---

## Requisitos Previos

Antes de instalar FOTAZA 2, asegúrate de tener instalado:

- **Node.js** v20 o superior ([descargar](https://nodejs.org/))
- **PostgreSQL** 12 o superior ([descargar](https://www.postgresql.org/download/))
- **npm** (incluido con Node.js)
- **Git** ([descargar](https://git-scm.com/))

### Verificar instalación:
```bash
node --version
npm --version
psql --version
```

---

## Instalación y Configuración

### 1️. Clonar el Repositorio

```bash
git clone https://github.com/lucasserrano7/Proyecto---Web2.git
cd Proyecto---Web2
```

### 2️. Instalar Dependencias

```bash
npm install
```

### 3️. Configurar Variables de Entorno

Copia el archivo de ejemplo y configúralo con tus datos:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tu editor de texto favorito y completa los siguientes valores:

```env
# Puerto donde se ejecutará la aplicación
PORT=3000

# Clave de sesión (usa cualquier string seguro)
SESSION_KEY=tu_clave_segura_aqui

# Entorno
NODE_ENV=development

# Configuración de Base de Datos PostgreSQL
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_contraseña_postgres
DB_NAME=fotaza2_db
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
```

**Ejemplo de configuración completa:**
```env
PORT=3000
SESSION_KEY=fotaza2_clave_super_segura_2024
NODE_ENV=development
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fotaza2_db
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
```

### 4️. Crear Base de Datos

Abre una terminal de PostgreSQL y ejecuta:

```bash
createdb fotaza2_db
```

O accede a PostgreSQL e crea la BD manualmente:

```sql
CREATE DATABASE fotaza2_db;
```

### 5️. Inicializar Base de Datos

Ejecuta el script que crea todas las tablas y carga datos de prueba:

```bash
npm run db:init
```

Este comando creará:
-  Todas las tablas necesarias
-  Relaciones y restricciones
-  Datos de ejemplo para pruebas
-  Usuarios de prueba con diferentes roles

### 6️. Iniciar la Aplicación

```bash
npm start
```

Para desarrollo con recarga automática:

```bash
npm run dev
```

### Scripts Disponibles
A continuación, se detallan los comandos principales configurados en el proyecto para un acceso rápido:

```bash
npm start
```
Inicia la aplicación en entorno de producción ejecutando app.js.

```bash
npm run dev
```
Inicia la aplicación en modo desarrollo con recarga automática utilizando nodemon.

```bash
npm run build
```
 Compila y empaqueta los recursos del frontend (Vite y Tailwind CSS) para producción.

```bash
npm run db:init
``` 
Ejecuta el script init-db.js para inicializar la base de datos y poblarla con datos de ejemplo.

---

##  Acceso a la Aplicación

Una vez iniciada, accede a la aplicación en tu navegador:

```
http://localhost:3000
```

---

##  Usuarios de Prueba

La aplicación incluye varios usuarios de prueba para facilitar la evaluación. Utiliza estas credenciales para probar diferentes funcionalidades:


### **Usuario de Prueba 1**
```
Email: fotaza@gmail.com
Contraseña: fotaza123
```


### **Usuario de Prueba 2**
```
Email: fotaza2@gmail.com
Contraseña: fotaza245!
```
### **Usuario de Prueba 3**
```
Email: sergioro234@gmail.com
Contraseña: gulp1998!
```



---

##  Funcionalidades 

###  Sistema de Autenticación
- Registro de usuarios
- Login seguro con sesiones
-  Contraseñas encriptadas con bcrypt
- Logout y cierre de sesión
-  Validación de email único

###  Gestor de Contenidos
-  Crear publicaciones con múltiples imágenes
-  Agregar títulos, descripciones y etiquetas
-  Cerrar comentarios en publicaciones

###  Sistema de Comentarios
-  Comentar publicaciones

###  Valoraciones
-  Valorar imágenes (1-5 estrellas)
-  Ver promedio de valoraciones

###  Sistema de Seguidores
-  Seguir/dejar de seguir usuarios
-  Ver perfil de usuarios
-  Mostrar contador de seguidores
-  Prevenir auto-seguimiento


---

##  Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|----------|
| **Node.js** | 20+ | Runtime JavaScript |
| **Express** | 5.2+ | Framework web |
| **Pug** | 3.0+ | Motor de plantillas |
| **PostgreSQL** | 12+ | Base de datos |
| **Sequelize** | 6.37+ | ORM |
| **bcrypt** | 6.0+ | Encriptación de contraseñas |
| **JWT** | 9.0+ | Autenticación |
| **Tailwind CSS** | 4.3+ | Framework CSS |
| **Express Session** | 1.19+ | Gestión de sesiones |

