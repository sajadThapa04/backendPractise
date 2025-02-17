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
import subsRouter from "./routes/subscription.routes.js";
import comRouter from "./routes/comment.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlist from "./routes/playlist.routes.js";



//router decleration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subs", subsRouter);
app.use("/api/v1/comment", comRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlist);
export { app };