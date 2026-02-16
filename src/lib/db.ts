import mongoose from "mongoose";
import { config } from "@/config";

type connectObject = {
    isConnected?: boolean;
};

const connection: connectObject = {};

async function connectToDB() {
    if (connection.isConnected) {
        return;
    }
    try {
        const db = await mongoose.connect(config.MONGODB_URI!);
        connection.isConnected = db.connection.readyState === 1;
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}


export default connectToDB;
