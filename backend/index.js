import express from "express";
import cors from 'cors';
import "dotenv/config";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRouter.js"
import postRouter from "./routes/postRouter.js"
import commentRouter from "./routes/commentRouter.js"
import tagRouter from "./routes/tagRouter.js"
import chatRouter from "./routes/chatRouter.js"
import answerRouter from "./routes/answerRouter.js"
import pool from "./config/db.js";



const app = express();
app.use(cors({ origin: true, credentials: true })); // Needs credentials: true for cookies across origins
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
const PORT = process.env.PORT || 5000;



app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
})

app.use("/api/users", userRouter)
app.use("/api/posts", postRouter)
app.use("/api/answers", answerRouter);
app.use("/api/comments", commentRouter);
app.use("/api/tags", tagRouter);
import uploadRouter from "./routes/uploadRouter.js";
app.use("/api", uploadRouter);
app.use("/api/chat", chatRouter)






app.listen(PORT, () => {
    pool.on("connect", () => {
        console.log("Connected to the database");
    })
    console.log(`Server is running on port ${PORT}`);
})