import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();


const limit = "50kb"
app.use(express.urlencoded({ extended: true }, { limit: `${limit}` }));
app.use(express.json({ limit: `${limit}` }));
app.use(express.static('public'));

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(cookieParser());


//importing router
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js";

//router decleration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
export { app };