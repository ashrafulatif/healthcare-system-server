import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { AppointmentController } from "./appointment.controller";
import { CheckAuth } from "../../middleware/checkAuth";

const router = Router();

router.post(
  "/book-appointment",
  CheckAuth(Role.PATIENT),
  AppointmentController.bookAppointment,
);
router.get(
  "/my-appointments",
  CheckAuth(Role.PATIENT, Role.DOCTOR),
  AppointmentController.getMyAppointments,
);
router.patch(
  "/change-appointment-status/:id",
  CheckAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
  AppointmentController.changeAppointmentStatus,
);
router.get(
  "/my-single-appointment/:id",
  CheckAuth(Role.PATIENT, Role.DOCTOR),
  AppointmentController.getMySingleAppointment,
);
router.get(
  "/all-appointments",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AppointmentController.getAllAppointments,
);
router.post(
  "/book-appointment-with-pay-later",
  CheckAuth(Role.PATIENT),
  AppointmentController.bookAppointmentWithPayLater,
);
router.post(
  "/initiate-payment/:id",
  CheckAuth(Role.PATIENT),
  AppointmentController.initiatePayment,
);

export const AppointmentRoutes = router;
