import { Router } from "express";
import { DoctorController } from "./doctor.controller";

const router = Router();

router.get("/", DoctorController.getAllDoctors);

router.get("/:id", DoctorController.getDoctorById);

router.post("/update-doctor/:id", DoctorController.updateDoctor);

router.get("/delete-doctor/:id", DoctorController.deleteDoctor);

export const DoctorRoutes = router;
