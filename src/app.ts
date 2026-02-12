import express, { Application, Request, Response } from "express";
import { IndexRouter } from "./app/routes";
import { notFound } from "./app/middleware/notfound";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";

const app: Application = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use("/api/v1", IndexRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});
app.use(globalErrorHandler);
app.use(notFound);

export default app;
