import mongoose from "mongoose";

let isConnected = false;

export const connectToDb =async () => {
    mongoose.set('strictQuery',true);

    if(!process.env.MONGODB_URL)return console.log("mongodb_url not found");
    if(isConnected) return console.log('already connected to mongoDB');
    try {
        await mongoose.connect(process.env.MONGODB_URL);

        isConnected=true;
        console.log("connected to mongodb")
    } catch (error) {
        console.log(error);
    }
}