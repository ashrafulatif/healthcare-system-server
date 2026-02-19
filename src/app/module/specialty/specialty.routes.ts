import { Router } from "express";
import { SpecialtyController } from "./specialty.controller";
import { multerUpload } from "../../config/multer.config";
import { CheckAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { SpecialtyValidation } from "./specialty.validation";

const router = Router();

router.post(
  "/",
  // checkAuth(Role.ADMIN, Role.SUPER_ADMIN)
  multerUpload.single("file"),
  validateRequest(SpecialtyValidation.createSpecialtyZodSchema),
  SpecialtyController.createSpecialty,
);

router.get("/", SpecialtyController.getAllSpecialties);

router.delete(
  "/:id",
  //   CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SpecialtyController.deleteSpecialties,
);

router.put(
  "/:id",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SpecialtyController.updateSpecialty,
);

export const SpecialtiesRoute = router;
