import { Router } from "express";
import { AuthController } from "./auth.controller";
import { CheckAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/register", AuthController.registerPatient);

router.post("/login", AuthController.loginUser);

router.post(
  "/change-password",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  AuthController.changePassword,
);

router.post("/refresh-token", AuthController.getNewToken);

router.post(
  "/logout",
  CheckAuth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN),
  AuthController.logoutUser,
);

router.post("/verify-email", AuthController.verifyEmail);

router.post("/forget-password", AuthController.forgetPassword);

router.post("/reset-password", AuthController.resetPassword);

router.get(
  "/me",
  CheckAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  AuthController.getMe,
);

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

export const AuthRoutes = router;
