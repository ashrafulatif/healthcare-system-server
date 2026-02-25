import { IRequestUser } from "../../interfaces/requestUser.interface";
import { v7 as uuidv7 } from "uuid";
import { prisma } from "../../lib/prisma";
import {
  IBookAppointmentPayload,
  IUpdateAppointmentPayload,
} from "./appoinment.interface";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import {
  AppointmentStatus,
  PaymentStatus,
  Role,
} from "../../../generated/prisma/enums";
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";

const bookAppointment = async (
  payload: IBookAppointmentPayload,
  user: IRequestUser,
) => {
  //find patient
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });
  //find doctor
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: { id: payload.doctorId, isDeleted: false },
  });
  //find schedule data
  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: payload.scheduleId,
    },
  });

  //find doctor schedule
  const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id,
      },
    },
  });

  const yvideoCallingId = String(uuidv7());
  //create book appointment
  const result = await prisma.$transaction(async (tx) => {
    //create
    const appoinmentData = await tx.appointment.create({
      data: {
        doctorId: payload.doctorId,
        patientId: patientData.id,
        scheduleId: doctorSchedule.scheduleId,
        yvideoCallingId,
      },
    });

    //update appointment status
    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    //payment integration
    const transactionId = String(uuidv7());

    //payment data create
    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appoinmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });
    //create stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Appointment with Dr. ${doctorData.name}`,
            },
            unit_amount: doctorData.appointmentFee * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointmentId: appoinmentData.id,
        paymentId: paymentData.id,
      },

      success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success`,
      // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
      cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments`,
    });

    return {
      appoinmentData,
      paymentData,
      paymentUrl: session.url,
    };
  });

  return {
    appoinmentData: result.appoinmentData,
    paymentData: result.paymentData,
    paymentUrl: result.paymentUrl,
  };
};
const getMyAppointments = async (user: IRequestUser) => {
  //user can be both doctor and patiend - have to check both

  console.log(user.userId);
  //doctor
  const doctorData = await prisma.doctor.findUnique({
    where: { email: user.email },
  });
  console.log("doctor", doctorData);

  const patientData = await prisma.patient.findUnique({
    where: { email: user.email },
  });

  console.log(patientData);

  if (patientData) {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
      },
    });
    return appointments;
  } else if (doctorData) {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
    return appointments;
  } else {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
};

// 1. Completed Or Cancelled Appointments should not be allowed to update status
// 2. Doctors can only update Appoinment status from schedule to inprogress or inprogress to complted or schedule to cancelled.
// 3. Patients can only cancel the scheduled appointment if it scheduled not completed or cancelled or inprogress.
// 4. Admin and Super admin can update to any status.
const changeAppointmentStatus = async (
  appointmentId: string,
  payload: IUpdateAppointmentPayload,
  user: IRequestUser,
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
    },
  });

  if (user?.role === Role.DOCTOR) {
    if (!(user?.email === appointmentData.doctor.email))
      throw new AppError(status.BAD_REQUEST, "This is not your appointment");
  }

  return await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: payload.status as AppointmentStatus,
    },
  });
};

// refactoring on include of doctor and patient data in appointment details, we can use query builder to get the data in single query instead of multiple queries in case of doctor and patient both
const getMySingleAppointment = async (
  appointmentId: string,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUnique({
    where: {
      email: user?.email,
    },
  });

  const doctorData = await prisma.doctor.findUnique({
    where: {
      email: user?.email,
    },
  });

  let appointment;

  if (patientData) {
    appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
      },
    });
  } else if (doctorData) {
    appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
  }

  if (!appointment) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  return appointment;
};

// integrate query builder
const getAllAppointments = async () => {
  const appointments = await prisma.appointment.findMany({
    include: {
      doctor: true,
      patient: true,
      schedule: true,
    },
  });
  return appointments;
};

const bookAppointmentWithPayLater = async (
  payload: IBookAppointmentPayload,
  user: IRequestUser,
) => {
  //find patient
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });
  //find doctor
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: { id: payload.doctorId, isDeleted: false },
  });
  //find schedule data
  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: payload.scheduleId,
    },
  });

  //find doctor schedule
  const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id,
      },
    },
  });

  const yvideoCallingId = String(uuidv7());
  //create book appointment
  const result = await prisma.$transaction(async (tx) => {
    //create
    const appointmentData = await tx.appointment.create({
      data: {
        doctorId: payload.doctorId,
        patientId: patientData.id,
        scheduleId: doctorSchedule.scheduleId,
        yvideoCallingId,
      },
    });

    //update appointment status
    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    //create payment
    const transactionId = String(uuidv7());
    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });
    return {
      appointment: appointmentData,
      payment: paymentData,
    };
  });

  return result;
};

const initiatePayment = async (appointmentId: string, user: IRequestUser) => {
  const patientData = await prisma.patient.findFirstOrThrow({
    where: {
      email: user.email,
    },
  });

  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
      patientId: patientData.id,
    },
    include: {
      doctor: true,
      payment: true,
    },
  });

  //validation check
  if (!appointmentData) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }
  if (!appointmentData.payment) {
    throw new AppError(
      status.NOT_FOUND,
      "Payment data not found for this appointment",
    );
  }
  if (appointmentData.payment?.status === PaymentStatus.PAID) {
    throw new AppError(
      status.BAD_REQUEST,
      "Payment already completed for this appointment",
    );
  }
  if (appointmentData.status === AppointmentStatus.CANCELED) {
    throw new AppError(status.BAD_REQUEST, "Appointment is canceled");
  }

  //create session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: `Appointment with Dr. ${appointmentData.doctor.name}`,
          },
          unit_amount: appointmentData.doctor.appointmentFee * 100,
        },
        quantity: 1,
      },
    ],

    metadata: {
      appointmentId: appointmentData.id,
      paymentId: appointmentData.payment.id,
    },

    success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${appointmentData.payment.id}`,
    // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
    cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments?error=payment_cancelled`,
  });
  return {
    paymentUrl: session.url,
  };
};

const cancelUnpaidAppointments = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  //find all unpaid appointment
  const unpaidAppointments = await prisma.appointment.findMany({
    where: {
      createdAt: {
        lte: thirtyMinutesAgo,
      },
      paymentStatus: PaymentStatus.UNPAID,
    },
  });
  //convert to array
  const appointmentToCancel = unpaidAppointments.map(
    (appointment) => appointment.id,
  );

  await prisma.$transaction(async (tx) => {
    //update status in appointment
    await tx.appointment.updateMany({
      where: {
        id: {
          in: appointmentToCancel,
        },
      },
      data: { status: AppointmentStatus.CANCELED },
    });
    //delete from payment
    await tx.payment.deleteMany({
      where: {
        appointmentId: {
          in: appointmentToCancel,
        },
      },
    });
    //update doctor schedule
    for (const unpaidAppointment of unpaidAppointments) {
      await tx.doctorSchedules.update({
        where: {
          doctorId_scheduleId: {
            doctorId: unpaidAppointment.doctorId,
            scheduleId: unpaidAppointment.scheduleId,
          },
        },
        data: {
          isBooked: false,
        },
      });
    }
  });
};

export const AppointmentService = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMySingleAppointment,
  getAllAppointments,
  bookAppointmentWithPayLater,
  initiatePayment,
  cancelUnpaidAppointments,
};
