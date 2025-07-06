import mongoose from "mongoose";

export const connectMongoose = () => {

    const { MONGO_USERNAME,
        MONGO_PASSWORD,
        MONGO_PORT,
        MONGO_DB 
    } = process.env;

    const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@localhost:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
    mongoose.connect(url)
        .then(() => console.log("MongoDB is Connected"))
        .catch(err => console.error("Error conectando a MongoDB:", err));
}
