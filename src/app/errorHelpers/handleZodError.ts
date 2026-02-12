import z from "zod";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";
import status from "http-status";

export const handleZodError = (err: z.ZodError): TErrorResponse => {
  const statusCode = status.BAD_REQUEST;
  const message = "Zod validation message";
  const errorSources: TErrorSources[] = [];

  err.issues.forEach((issue) => {
    errorSources.push({
      path: issue.path.join(" "),
      message: issue.message,
    });
  });

  return {
    success: false,
    statusCode,
    message,
    errorSources,
  };
};
