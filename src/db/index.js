import mongoose from "mongoose";
import { db_name } from "../constants.js";

export const connect_db = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.DB_CONNECTION}/${db_name}`);
        console.log(`mongoose is connected on: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

