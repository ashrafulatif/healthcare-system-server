import { Router } from "express";
import { SpecialtiesRoute } from "../module/specialty/specialty.routes";
import { AuthRoutes } from "../module/auth/auth.routes";

const router = Router();

router.use("/auth", AuthRoutes);

router.use("/specialties", SpecialtiesRoute);

export const IndexRouter = router;
