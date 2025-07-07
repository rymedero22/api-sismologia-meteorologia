# API de Meteorología y Sismología

Este proyecto implementa una API REST para consultar datos meteorológicos y sísmicos, con:

* **Módulo Clima** (`/weather`): Integración con OpenWeatherMap y WeatherAPI.
* **Módulo Sismos** (`/earthquakes`): Integración con USGS, EMSC y base de datos local.

La documentación interactiva se genera con **Swagger (OpenAPI)** y está disponible en `/api-docs`.

---

## 🚀 Tecnologías

* Node.js (ESM)
* Express
* Mongoose (MongoDB)
* Axios
* dotenv
* express-validator
* CORS
* Swagger UI

## 📦 Instalación

1. Clonar el repositorio:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd api-sismologia-meteorologia
   ```
2. Instalar dependencias:

   ```bash
   npm install
   ```
3. Configurar variables de entorno copiando `.env.example` a `.env` y completando:

   ```dotenv
   MONGO_USERNAME=usuario
   MONGO_PASSWORD=contraseña
   MONGO_PORT=27017
   MONGO_DB=nombre_db
   OPENWEATHERMAP_KEY=tu_api_key_openweathermap
   WEATHERAPI_KEY=tu_api_key_weatherapi
   WEATHER_API_SOURCE=openweathermap  # o weatherapi
   ```
4. Arrancar la aplicación:

   ```bash
   npm start
   ```

El servidor arrancará en `http://localhost:3000`.

---

## 📋 Endpoints

### Clima

| Método | Ruta                            | Descripción                                                              |
| ------ | ------------------------------- | ------------------------------------------------------------------------ |
| GET    | `/weather/OpenWeatherMap?city=` | Datos meteorológicos desde OpenWeatherMap (sin guardar).                 |
| GET    | `/weather/WeatherApi?city=`     | Datos meteorológicos desde WeatherAPI (sin guardar).                     |
| GET    | `/weather/DB?city=`             | Último registro guardado por POST para la ciudad.                        |
| POST   | `/weather`                      | Guarda un reporte manual. Body: `{city,temperature,humidity,condition}`. |
| GET    | `/weather/history/:city`        | Todos los registros guardados por POST para la ciudad.                   |
| DELETE | `/weather/:id`                  | Elimina un reporte guardado.                                             |

#### Validaciones

* `condition`: solo acepta `Soleado`, `Nublado`, `Lluvioso` o `Tormenta`.

### Sismos

| Método | Ruta                            | Descripción                                        |
| ------ | ------------------------------- | -------------------------------------------------- |
| GET    | `/earthquakes/USGS?country=`    | Terremotos recientes desde USGS (últimos 30 días). |
| GET    | `/earthquakes/EMSC?country=`    | Terremotos recientes desde EMSC (últimos 30 días). |
| GET    | `/earthquakes/DB?country=`      | Últimos registros guardados para un país.          |
| POST   | `/earthquakes`                  | Guarda evento manual o por `eventId` de USGS/EMSC. |
| GET    | `/earthquakes/history/:country` | Historial completo desde la base de datos.         |
| DELETE | `/earthquakes/:id`              | Elimina un registro sísmico.                       |

---



```
```

---

## 📖 Documentación Swagger

Una vez arranque la app, abre en tu navegador:

```
http://localhost:3000/api-docs
```

Ahí encontrarás el UI de Swagger con todas las rutas, modelos y ejemplos.

---

## 🧪 Tests

Se pueden agregar pruebas con **Jest** y **Supertest**. Ejecución propuesta:

```bash
```

---

##
