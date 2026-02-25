import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { PatientService } from "./patient.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await PatientService.updateMyProfile(user, payload);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Profile updated successfully",
    data: result,
  });
});

export const PatientController = {
  updateMyProfile,
};
