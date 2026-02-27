import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { updateAdminZodSchema } from "./admin.validation";
import { CheckAuth } from "../../middleware/checkAuth";

const router = Router();

router.get(
  "/",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAllAdmins,
);
router.get(
  "/:id",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAdminById,
);
router.patch(
  "/:id",
  CheckAuth(Role.SUPER_ADMIN),
  validateRequest(updateAdminZodSchema),
  AdminController.updateAdmin,
);
router.delete("/:id", CheckAuth(Role.SUPER_ADMIN), AdminController.deleteAdmin);

router.patch(
  "/change-user-status",
  CheckAuth(Role.SUPER_ADMIN, Role.ADMIN),
  AdminController.changeUserStatus,
);
router.patch(
  "/change-user-role",
  CheckAuth(Role.SUPER_ADMIN),
  AdminController.changeUserRole,
);

export const AdminRoutes = router;
