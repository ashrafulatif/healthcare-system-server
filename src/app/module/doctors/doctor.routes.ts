import { Router } from "express";
import { DoctorController } from "./doctor.controller";
import { Role } from "../../../generated/prisma/enums";
import { CheckAuth } from "../../middleware/checkAuth";

const router = Router();

router.get(
  "/",
  // CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorController.getAllDoctors,
);

router.get(
  "/:id",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorController.getDoctorById,
);

router.patch(
  "/update-doctor/:id",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorController.updateDoctor,
);

router.get(
  "/delete-doctor/:id",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorController.deleteDoctor,
);

export const DoctorRoutes = router;
