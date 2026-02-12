import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { AuthService } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const registerPatient = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerPatient(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "User Resgister Successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Login Successful",
    data: result,
  });
});

export const AuthController = {
  registerPatient,
  loginUser,
};
