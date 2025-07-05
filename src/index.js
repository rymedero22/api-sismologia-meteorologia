import express from 'express';
import { connectMongoose } from "./db/mongoose.js";

import weatherRouter from "./routes/weather.route.js";
import earthquakeRouter from "./routes/earthquake.route.js";

import dotenv from "dotenv";

dotenv.config();
const app = express()
const port = 3000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/weather", weatherRouter);
app.use("/earthquakes", earthquakeRouter);


app.listen(port, () => {
    connectMongoose();
    console.log(`App listening on port ${port}`)
})

app.get('/', (req, res) => {
    res.send('{"message": "API is running successfully"}')
})
