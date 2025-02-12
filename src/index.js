import { app } from "./app.js";
import { connect_db } from "./db/index.js";
import dotenv from 'dotenv';

dotenv.config({
    path: "./.env"
});



connect_db()
    .then(() => {
        const port = process.env.PORT || 8000
        app.on("error", (err) => {
            console.log(err);
        })
        app.listen(port, () => {
            console.log(`Server is listening on http://localhost:${port}`)
        })
    })
    .catch((err) => {
        console.log("something went wrong \n", err);
    })


// (async () => {
//     try {
//         await mongoose.connect(`${process.env.DB_CONNECTION}/${db_name}`);
//         app.on("error", (err) => {
//             console.log(err)
//         })
//         const port = process.env.PORT || 3000
//         app.listen(port, () => {
//             console.log(`server is listening on http://localhost:${port}`)
//         })
//     } catch (error) {
//         console.log("Something went wrong", error);
//     }
// })()