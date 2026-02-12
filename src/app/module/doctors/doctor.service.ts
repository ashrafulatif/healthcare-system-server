import status from "http-status";
import { UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IUpdateDoctorPayload } from "./doctor.interface";

const getAllDoctors = async () => {
  const result = await prisma.doctor.findMany({
    include: {
      user: true,
      specialties: {
        include: {
          specialty: true,
        },
      },
    },
  });

  return result;
};

const getDoctorById = async (id: string) => {
  const result = await prisma.doctor.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      specialties: {
        include: {
          specialty: true,
        },
      },
    },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, `Doctor with ${id} not found`);
  }

  return result;
};

const updateDoctor = async (id: string, payload: IUpdateDoctorPayload) => {
  //find the doctor exist or not
  const isDocExist = await prisma.doctor.findUnique({
    where: {
      id,
    },
  });

  if (!isDocExist) {
    throw new AppError(status.NOT_FOUND, `Doctor with ${id} not found`);
  }
  //update data doc + user table
  const result = await prisma.$transaction(async (tx) => {
    const docData = await tx.doctor.update({
      where: { id },
      data: payload.doctor,
    });

    //update specialty
    if (payload.specialties) {
      await tx.doctorSpecialty.updateMany({
        where: { doctorId: id },
        data: payload.specialties,
      });
    }

    //update user table
    await tx.user.update({
      where: { id: docData.userId },
      data: payload.doctor,
    });

    return docData;
  });

  return result;
};

//soft delete
const deleteDoctor = async (id: string) => {
  //find the doctor exist or not
  const isDocExist = await prisma.doctor.findUnique({
    where: {
      id,
    },
  });

  if (!isDocExist) {
    throw new AppError(status.NOT_FOUND, `Doctor with ${id} not found`);
  }

  //soft delete user + doc -> isDelete true, status deleted

  const result = await prisma.$transaction(async (tx) => {
    const deletedeDoc = await tx.doctor.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(Date.now()),
      },
    });

    await tx.user.update({
      where: {
        id: deletedeDoc.userId,
      },
      data: {
        status: UserStatus.DELETED,
        isDeleted: true,
        deletedAt: new Date(Date.now()),
      },
    });

    return deletedeDoc;
  });

  return result;
};

export const DoctorService = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
