import mongoose from 'mongoose';
const { Schema } = mongoose;

const weatherschemas = new Schema({
    city: String, 
    temperature: Number,
    humidity: Number,
    condition: String,
});

const Weather = mongoose.model('Weather', weatherschemas);
export default Weather;