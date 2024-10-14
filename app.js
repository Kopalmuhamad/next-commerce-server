import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import ExpressMongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";

// ! Import Routes
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";

dotenv.config();

const app = express();
const port = 8080;

//? Connect to mongodb
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

//? Server Lister
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

//? Middleware
app.use(express.json());
app.use(helmet());
app.use(ExpressMongoSanitize());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(cors());

//? Routes
app.use("/api/auth", authRouter);
app.use("/api/auth", userRouter);

//? Error Handler
app.use(notFound);
app.use(errorHandler);
