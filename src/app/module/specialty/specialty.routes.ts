import { Router } from "express";
import { SpecialtyController } from "./specialty.controller";

const router = Router();

router.post("/", SpecialtyController.createSpecialty);

router.get("/", SpecialtyController.getAllSpecialties);

router.delete("/:id", SpecialtyController.deleteSpecialties);

router.put("/:id", SpecialtyController.updateSpecialty);

export const SpecialtiesRoute = router;
