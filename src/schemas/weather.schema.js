import mongoose from 'mongoose';
const { Schema } = mongoose;

const weatherschemas = new Schema({
    city:{
        type:String,
        required:true
    } ,
    temperature:{
        type:Number,
        required:true
    } ,
    humidity:{
        type:Number,
        required:true
    } ,
    condition:{
        type:String,
        required:true,
        enum: ['Soleado', 'Nublado', 'Lluvioso', 'Tormenta']
    } 
});

const Weather = mongoose.model('Weather', weatherschemas);
export default Weather;