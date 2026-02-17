import { Router } from "express";
import { SpecialtiesRoute } from "../module/specialty/specialty.routes";
import { AuthRoutes } from "../module/auth/auth.routes";
import { UserRoutes } from "../module/user/user.routes";
import { DoctorRoutes } from "../module/doctors/doctor.routes";
import { AdminRoutes } from "../module/admin/admin.routes";

const router = Router();

router.use("/auth", AuthRoutes);

router.use("/specialties", SpecialtiesRoute);

router.use("/users", UserRoutes);

router.use("/doctors", DoctorRoutes);

router.use("/admin", AdminRoutes);

export const IndexRouter = router;
