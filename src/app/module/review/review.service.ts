import status from "http-status";
import { PaymentStatus, Role } from "../../../generated/prisma/enums";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreateReviewPayload, IUpdateReviewPayload } from "./review.interface";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IQueryParams } from "../../interfaces/query.interface";
import { Prisma, Review } from "../../../generated/prisma/client";

const giveReview = async (
  user: IRequestUser,
  paylodd: ICreateReviewPayload,
) => {
  //get patient data
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: { email: user.email },
  });
  //get appointment data
  const appoinmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: paylodd.appointmentId,
    },
  });

  if (appoinmentData.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only review after payment is done",
    );
  }
  if (patientData.id !== appoinmentData.patientId) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only review for your own appointments",
    );
  }
  //check review exist
  const isReview = await prisma.review.findFirst({
    where: {
      appointmentId: paylodd.appointmentId,
    },
  });

  if (isReview) {
    throw new AppError(
      status.BAD_REQUEST,
      "You have already reviewed for this appointment. You can update your review instead.",
    );
  }
  //create review
  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        patientId: appoinmentData.patientId,
        doctorId: appoinmentData.doctorId,
        ...paylodd,
      },
    });

    //update doctor table with avg rating
    const averageRating = await tx.review.aggregate({
      where: {
        doctorId: appoinmentData.doctorId,
      },
      _avg: {
        rating: true,
      },
    });

    await tx.doctor.update({
      where: {
        id: appoinmentData.doctorId,
      },
      data: {
        averageRating: averageRating._avg.rating as number,
      },
    });

    return review;
  });

  return result;
};

const getAllReviews = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Review,
    Prisma.ReviewWhereInput,
    Prisma.ReviewInclude
  >(prisma.review, query, {
    filterableFields: ["rating", "comment"],
  });

  const result = await queryBuilder
    .sort()
    .filter()
    .paginate()
    .include({
      doctor: true,
      patient: true,
      appointment: true,
    })
    .execute();

  return result;
};

const myReviews = async (user: IRequestUser) => {
  //get patient data
  const isUserExist = await prisma.user.findFirstOrThrow({
    where: {
      email: user.email,
    },
  });

  if (isUserExist.role === Role.DOCTOR) {
    const doctorData = await prisma.doctor.findUniqueOrThrow({
      where: {
        email: user?.email,
      },
    });

    const doctorReview = await prisma.review.findMany({
      where: {
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        appointment: true,
      },
    });
    return doctorReview;
  }

  if (isUserExist.role === Role.PATIENT) {
    const patientData = await prisma.patient.findUniqueOrThrow({
      where: {
        email: user?.email,
      },
    });

    const patientReview = await prisma.review.findMany({
      where: {
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        appointment: true,
      },
    });

    return patientReview;
  }
};

const updateReview = async (
  user: IRequestUser,
  reviewId: string,
  paylodd: IUpdateReviewPayload,
) => {
  //get patient data
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: { email: user.email },
  });

  const reviewData = await prisma.review.findUniqueOrThrow({
    where: {
      id: reviewId,
    },
  });

  if (!(patientData.id === reviewData.patientId)) {
    throw new AppError(status.BAD_REQUEST, "This is not your review!");
  }

  //update review
  const result = await prisma.$transaction(async (tx) => {
    const updatedReview = await tx.review.update({
      where: {
        id: reviewId,
      },
      data: {
        ...paylodd,
      },
    });

    //update average rating doc
    const averageRating = await tx.review.aggregate({
      where: {
        doctorId: reviewData.doctorId,
      },
      _avg: {
        rating: true,
      },
    });

    await tx.doctor.update({
      where: {
        id: updatedReview.doctorId,
      },
      data: {
        averageRating: averageRating._avg.rating as number,
      },
    });

    return updatedReview;
  });

  return result;
};

const deleteReview = async (user: IRequestUser, reviewId: string) => {
  //get patient data
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: { email: user.email },
  });

  const reviewData = await prisma.review.findUniqueOrThrow({
    where: {
      id: reviewId,
    },
  });

  if (!(patientData.id === reviewData.patientId)) {
    throw new AppError(status.BAD_REQUEST, "This is not your review!");
  }

  //delete
  const result = await prisma.$transaction(async (tx) => {
    const deletedReview = await tx.review.delete({
      where: {
        id: reviewId,
      },
    });

    //update average rating doc
    const averageRating = await tx.review.aggregate({
      where: {
        doctorId: reviewData.doctorId,
      },
      _avg: {
        rating: true,
      },
    });

    await tx.doctor.update({
      where: {
        id: deletedReview.doctorId,
      },
      data: {
        averageRating: averageRating._avg.rating as number,
      },
    });

    return deletedReview;
  });

  return result;
};

export const ReviewService = {
  giveReview,
  getAllReviews,
  myReviews,
  updateReview,
  deleteReview,
};
