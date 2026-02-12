/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { SpecialtyService } from "./specialty.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const createSpecialty = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await SpecialtyService.createSpecialty(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Speciality created successfully",
    data: result,
  });
});

const getAllSpecialties = catchAsync(async (req: Request, res: Response) => {
  const result = await SpecialtyService.getAllSpecialties();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Speciality fetched successfully",
    data: result,
  });
});

const deleteSpecialties = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await SpecialtyService.deleteSpecialties(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Speciality deleted successfully",
    data: result,
  });
});

const updateSpecialty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payload = req.body;

  const result = await SpecialtyService.updateSpecialty(id as string, payload);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Speciality updated successfully",
    data: result,
  });
});

export const SpecialtyController = {
  createSpecialty,
  getAllSpecialties,
  deleteSpecialties,
  updateSpecialty,
};
