import status from "http-status";
import { Role, Specialty } from "../../../generated/prisma/client";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { ICreateDoctorPayload } from "./user.interface";
import AppError from "../../errorHelpers/AppError";

const createDoctor = async (payload: ICreateDoctorPayload) => {
  //filter specialty from payload
  const specialties: Specialty[] = [];

  for (const specialtyId of payload.specialties) {
    const specialty = await prisma.specialty.findUnique({
      where: {
        id: specialtyId,
      },
    });
    //check the specialty exist or not- db
    if (!specialty) {
      throw new AppError(
        status.NOT_FOUND,
        `Specialty with id ${specialtyId} not found`,
      );
    }

    specialties.push(specialty);
  }

  //check valid exist or not
  const userExist = await prisma.user.findUnique({
    where: { email: payload.doctor.email },
  });

  if (userExist) {
    throw new AppError(status.CONFLICT, "user with this email already exists");
  }
  //create user
  const userData = await auth.api.signUpEmail({
    body: {
      email: payload.doctor.email,
      password: payload.password,
      role: Role.DOCTOR,
      name: payload.doctor.name,
      needPasswordChange: true,
    },
  });

  //create doctor to the doctor table

  try {
    const result = await prisma.$transaction(async (tx) => {
      const doctorData = await tx.doctor.create({
        data: { userId: userData.user.id, ...payload.doctor },
      });

      //specialty
      const doctorSpecialtyData = specialties.map((specialty) => {
        return { doctorId: doctorData.id, specialtyId: specialty.id };
      });

      await tx.doctorSpecialty.createMany({ data: doctorSpecialtyData });

      const doctor = await tx.doctor.findUnique({
        where: { id: doctorData.id },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          address: true,
          registrationNumber: true,
          experience: true,
          gender: true,
          appointmentFee: true,
          qualification: true,
          currentWorkingPlace: true,
          designation: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              emailVerified: true,
              image: true,
              isDeleted: true,
              deletedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          specialties: {
            select: {
              specialty: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      return doctor;
    });

    return result;
  } catch (error) {
    await prisma.user.delete({ where: { id: userData.user.id } });

    throw error;
  }
};

export const UserService = { createDoctor };
