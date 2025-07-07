import express from 'express';
import { connectMongoose } from "./db/mongoose.js";
import cors from 'cors';

import weatherRouter from "./routes/weather.route.js";
import earthquakeRouter from "./routes/earthquake.route.js";

import dotenv from "dotenv";

dotenv.config();
const app = express()
const port = 3000

// Middlewares deben ir ANTES de las rutas
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors());

app.use("/weather", weatherRouter);
app.use("/earthquakes", earthquakeRouter);


app.listen(port, () => {
    connectMongoose();
    console.log(`App listening on port ${port}`)
})

app.get('/', (req, res) => {
    res.send('{"message": "API is running successfully"}')
})

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));