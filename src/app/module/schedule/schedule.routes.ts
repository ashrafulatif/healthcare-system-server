import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";

import { ScheduleController } from "./schedule.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { ScheduleValidation } from "./schedule.validation";
import { CheckAuth } from "../../middleware/checkAuth";

const router = Router();

router.post(
  "/",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ScheduleValidation.createScheduleZodSchema),
  ScheduleController.createSchedule,
);
router.get(
  "/",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR),
  ScheduleController.getAllSchedules,
);
router.get(
  "/:id",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR),
  ScheduleController.getScheduleById,
);
router.patch(
  "/:id",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ScheduleValidation.updateScheduleZodSchema),
  ScheduleController.updateSchedule,
);
router.delete(
  "/:id",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ScheduleController.deleteSchedule,
);

export const scheduleRoutes = router;
