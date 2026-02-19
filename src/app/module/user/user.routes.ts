import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createAdminZodSchema, createDoctorZodSchema } from "./user.validation";
import { CheckAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/create-doctor",
  validateRequest(createDoctorZodSchema),
  // CheckAuth(Role.SUPER_ADMIN, Role.ADMIN),
  UserController.createDoctor,
);

router.post(
  "/create-admin",
  validateRequest(createAdminZodSchema),
  CheckAuth(Role.SUPER_ADMIN, Role.ADMIN),
  UserController.createAdmin,
);

export const UserRoutes = router;
