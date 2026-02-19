import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import status from "http-status";
import { sendResponse } from "../../shared/sendResponse";
import { DoctorService } from "./doctor.service";
import { IQueryParams } from "../../interfaces/query.interface";

const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
  const queryParams = req.query;
  const result = await DoctorService.getAllDoctors(queryParams as IQueryParams);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Doctor fetched Successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getDoctorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DoctorService.getDoctorById(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Doctor fetched Successfully",
    data: result,
  });
});

const updateDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payload = req.body;

  const result = await DoctorService.updateDoctor(id as string, payload);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Doctor updated Successfully",
    data: result,
  });
});

const deleteDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DoctorService.deleteDoctor(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Doctor deleted Successfully",
    data: result,
  });
});

export const DoctorController = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
