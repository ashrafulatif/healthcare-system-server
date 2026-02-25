/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import {
  ICreatePrescriptionPayload,
  IUpdatePrescriptionPayload,
} from "./prescription.interface";
import AppError from "../../errorHelpers/AppError";
import { generatePrescriptionPDF } from "./prescription.utils";
import {
  deleteFileFromCloudinary,
  uploadFileToCloudinary,
} from "../../config/cloudinary.config";
import { sendEmail } from "../../utils/emall";
import { Role } from "../../../generated/prisma/enums";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Prescription, Prisma } from "../../../generated/prisma/client";
import { IQueryParams } from "../../interfaces/query.interface";

const givePrescription = async (
  user: IRequestUser,
  payload: ICreatePrescriptionPayload,
) => {
  //get the doctor
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });
  //get the appointment data
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: payload.appointmentId,
    },
    include: {
      patient: true,
      doctor: {
        include: {
          specialties: true,
        },
      },
      schedule: {
        include: {
          doctorSchedules: true,
        },
      },
    },
  });

  if (appointmentData.doctorId !== doctorData.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only give prescription for your own appointments",
    );
  }
  //check already prescribed or not
  const isAlreadyPrescribed = await prisma.prescription.findFirst({
    where: { appointmentId: payload.appointmentId },
  });

  if (isAlreadyPrescribed) {
    throw new AppError(
      status.BAD_REQUEST,
      "You have already given prescription for this appointment. You can update the prescription instead.",
    );
  }

  const followUpDate = new Date(payload.followUpDate);

  const result = await prisma.$transaction(
    async (tx) => {
      //create prescription
      const prescriptionData = await tx.prescription.create({
        data: {
          ...payload,
          followUpDate,
          doctorId: appointmentData.doctorId,
          patientId: appointmentData.patientId,
        },
      });

      //create pdf
      const pdfBuffer = await generatePrescriptionPDF({
        doctorName: doctorData.name,
        patientName: appointmentData.patient.name,
        appointmentDate: appointmentData.schedule.startDateTime,
        instructions: payload.instructions,
        followUpDate,
        doctorEmail: doctorData.email,
        patientEmail: appointmentData.patient.email,
        prescriptionId: prescriptionData.id,
        createdAt: new Date(),
      });

      //upload it couldinary

      const fileName = `Prescription-${Date.now()}.pdf`;
      const uploadedFile = await uploadFileToCloudinary(pdfBuffer, fileName);
      const pdfUrl = uploadedFile.secure_url;

      //update pdfUrl to db
      const updatedPrescription = await tx.prescription.update({
        where: {
          id: prescriptionData.id,
        },
        data: {
          pdfUrl,
        },
      });
      //send email
      try {
        const patient = appointmentData.patient;
        const doctor = appointmentData.doctor;

        await sendEmail({
          to: patient.email,
          subject: `You have received a new prescription from Dr. ${doctor.name}`,
          templateName: "prescription",
          templateData: {
            doctorName: doctor.name,
            patientName: patient.name,
            specialization: doctor.specialties
              .map((s: any) => s.title)
              .join(", "),
            appointmentDate: new Date(
              appointmentData.schedule.startDateTime,
            ).toLocaleString(),
            issuedDate: new Date().toLocaleDateString(),
            prescriptionId: prescriptionData.id,
            instructions: payload.instructions,
            followUpDate: followUpDate.toLocaleDateString(),
            pdfUrl: pdfUrl,
          },
          attachments: [
            {
              filename: fileName,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      } catch (error) {
        console.log(
          "Failed To send email notification for prescription",
          error,
        );
      }

      return updatedPrescription;
    },
    {
      maxWait: 15000,
      timeout: 20000,
    },
  );

  return result;
};

const myPrescriptions = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: user?.email,
    },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (isUserExists.role === Role.DOCTOR) {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        doctor: {
          email: user?.email,
        },
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
      },
    });
    return prescriptions;
  }

  if (isUserExists.role === Role.PATIENT) {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patient: {
          email: user?.email,
        },
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
      },
    });
    return prescriptions;
  }
};

const getAllPrescriptions = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Prescription,
    Prisma.PrescriptionWhereInput,
    Prisma.PrescriptionInclude
  >(prisma.prescription, query, {
    filterableFields: ["followUpDate", "createdAt", "updatedAt"],
  });

  const result = await queryBuilder
    .filter()
    .paginate()
    .sort()
    .include({ patient: true, doctor: true, appointment: true })
    .execute();

  return result;
};

const updatePrescription = async (
  user: IRequestUser,
  prescriptionId: string,
  payload: IUpdatePrescriptionPayload,
) => {
  // Verify user exists
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: user?.email,
    },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Fetch current prescription data
  const prescriptionData = await prisma.prescription.findUniqueOrThrow({
    where: {
      id: prescriptionId,
    },
    include: {
      doctor: true,
      patient: true,
      appointment: {
        include: {
          schedule: true,
        },
      },
    },
  });

  // Verify the user is the doctor for this prescription
  if (!(user?.email === prescriptionData.doctor.email)) {
    throw new AppError(status.BAD_REQUEST, "This is not your prescription!");
  }

  const updatedInstructions =
    payload.instructions || prescriptionData.instructions;
  const updatedFollowUpDate = payload.followUpDate
    ? new Date(payload.followUpDate)
    : prescriptionData.followUpDate;

  //generate pdf
  const pdfBuffer = await generatePrescriptionPDF({
    doctorName: prescriptionData.doctor.name,
    doctorEmail: prescriptionData.doctor.email,
    patientName: prescriptionData.patient.name,
    patientEmail: prescriptionData.patient.email,
    appointmentDate: prescriptionData.appointment.schedule.startDateTime,
    instructions: updatedInstructions,
    followUpDate: updatedFollowUpDate,
    prescriptionId: prescriptionData.id,
    createdAt: prescriptionData.createdAt,
  });

  //updload couldinary
  const fileName = `prescription-updated-${Date.now()}.pdf`;
  const uploadFile = await uploadFileToCloudinary(pdfBuffer, fileName);
  const newpdfUrl = uploadFile.secure_url;
  //delete prev one
  if (prescriptionData.pdfUrl) {
    try {
      await deleteFileFromCloudinary(prescriptionData.pdfUrl);
    } catch (deleteError) {
      // Log but don't fail
      console.error("Failed to delete old PDF from Cloudinary:", deleteError);
    }
  }

  //update to db
  const result = await prisma.prescription.update({
    where: {
      id: prescriptionId,
    },
    data: {
      instructions: updatedInstructions,
      followUpDate: updatedFollowUpDate,
      pdfUrl: newpdfUrl,
    },
    include: {
      patient: true,
      doctor: true,
      appointment: {
        include: {
          schedule: true,
        },
      },
    },
  });

  try {
    await sendEmail({
      to: result.patient.email,
      subject: `Your Prescription has been Updated by ${result.doctor.name}`,
      templateName: "prescription",
      templateData: {
        patientName: result.patient.name,
        doctorName: result.doctor.name,
        specialization: "Healthcare Provider",
        prescriptionId: result.id,
        appointmentDate: new Date(
          result.appointment.schedule.startDateTime,
        ).toLocaleString(),
        issuedDate: new Date(result.createdAt).toLocaleDateString(),
        followUpDate: new Date(result.followUpDate).toLocaleDateString(),
        instructions: result.instructions,
        pdfUrl: newpdfUrl,
      },
      attachments: [
        {
          filename: `Prescription-${result.id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (emailError) {
    // Log email error but don't fail the prescription update
    console.error("Failed to send updated prescription email:", emailError);
  }

  return result;
};

const deletePrescription = async (
  user: IRequestUser,
  prescriptionId: string,
) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });
  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  //find prescription datas
  const prescriptionData = await prisma.prescription.findUnique({
    where: {
      id: prescriptionId,
    },
    include: {
      doctor: true,
    },
  });

  //verify logged in doctor prescription or not
  if (prescriptionData?.doctor.email !== user.email) {
    throw new AppError(status.BAD_REQUEST, "This is not your prescription!");
  }

  //delete prescription pdf from cloudinary
  if (prescriptionData.pdfUrl) {
    try {
      await deleteFileFromCloudinary(prescriptionData.pdfUrl);
    } catch (error) {
      console.error("Failed to delete PDF from Cloudinary:", error);
    }
  }
  //delete from db
  await prisma.prescription.delete({ where: { id: prescriptionId } });
};

export const PrescriptionService = {
  givePrescription,
  myPrescriptions,
  getAllPrescriptions,
  updatePrescription,
  deletePrescription,
};
