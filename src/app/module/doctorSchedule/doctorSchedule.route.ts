import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { DoctorScheduleController } from "./doctorSchedule.controller";
import { CheckAuth } from "../../middleware/checkAuth";

const router = Router();

router.post(
  "/create-my-doctor-schedule",
  CheckAuth(Role.DOCTOR),
  DoctorScheduleController.createMyDoctorSchedule,
);
router.get(
  "/my-doctor-schedules",
  CheckAuth(Role.DOCTOR),
  DoctorScheduleController.getMyDoctorSchedules,
);
router.get(
  "/",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorScheduleController.getAllDoctorSchedules,
);
router.get(
  "/:doctorId/schedule/:scheduleId",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorScheduleController.getDoctorScheduleById,
);
router.patch(
  "/update-my-doctor-schedule",
  CheckAuth(Role.DOCTOR),
  DoctorScheduleController.updateMyDoctorSchedule,
);
router.delete(
  "/delete-my-doctor-schedule/:id",
  CheckAuth(Role.DOCTOR),
  DoctorScheduleController.deleteMyDoctorSchedule,
);

export const DoctorScheduleRoutes = router;
