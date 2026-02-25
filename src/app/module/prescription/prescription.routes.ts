import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { PrescriptionController } from "./prescription.controller";
import { PrescriptionValidation } from "./prescription.validation";
import { CheckAuth } from "../../middleware/checkAuth";

const router = express.Router();

router.get(
  "/",
  CheckAuth(Role.SUPER_ADMIN, Role.ADMIN),
  PrescriptionController.getAllPrescriptions,
);

router.get(
  "/my-prescriptions",
  CheckAuth(Role.PATIENT, Role.DOCTOR),
  PrescriptionController.myPrescriptions,
);

router.post(
  "/",
  CheckAuth(Role.DOCTOR),
  validateRequest(PrescriptionValidation.createPrescriptionZodSchema),
  PrescriptionController.givePrescription,
);

router.patch(
  "/:id",
  CheckAuth(Role.DOCTOR),
  validateRequest(PrescriptionValidation.updatePrescriptionZodSchema),
  PrescriptionController.updatePrescription,
);

router.delete(
  "/:id",
  CheckAuth(Role.DOCTOR),
  PrescriptionController.deletePrescription,
);

export const PrescriptionRoutes = router;
