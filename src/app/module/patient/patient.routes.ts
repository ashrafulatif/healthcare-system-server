import { Router } from "express";
import { CheckAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { PatientController } from "./patient.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { PatientValidation } from "./patient.validation";
import { multerUpload } from "../../config/multer.config";
import { updateMyPatientProfileMiddleware } from "./patient.middleware";

const router = Router();

router.patch(
  "/update-my-profile",
  CheckAuth(Role.PATIENT),
  multerUpload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "medicalReports", maxCount: 5 },
  ]),
  validateRequest(PatientValidation.updatePatientProfileZodSchema),
  updateMyPatientProfileMiddleware,
  PatientController.updateMyProfile,
);

export const PatientRoutes = router;
