import { Router } from "express";
import { SpecialtiesRoute } from "../module/specialty/specialty.routes";
import { AuthRoutes } from "../module/auth/auth.routes";
import { UserRoutes } from "../module/user/user.routes";
import { DoctorRoutes } from "../module/doctors/doctor.routes";
import { AdminRoutes } from "../module/admin/admin.routes";
import { scheduleRoutes } from "../module/schedule/schedule.routes";
import { DoctorScheduleRoutes } from "../module/doctorSchedule/doctorSchedule.route";
import { AppointmentRoutes } from "../module/appointment/appointment.route";
import { PatientRoutes } from "../module/patient/patient.routes";
import { PrescriptionRoutes } from "../module/prescription/prescription.routes";
import { ReviewRoutes } from "../module/review/review.routes";

const router = Router();

router.use("/auth", AuthRoutes);

router.use("/specialties", SpecialtiesRoute);

router.use("/users", UserRoutes);

router.use("/patients", PatientRoutes);

router.use("/doctors", DoctorRoutes);

router.use("/admin", AdminRoutes);

router.use("/schedules", scheduleRoutes);

router.use("/doctor-schedules", DoctorScheduleRoutes);

router.use("/appointments", AppointmentRoutes);

router.use("/prescriptions", PrescriptionRoutes);

router.use("/reviews", ReviewRoutes);

export const IndexRouter = router;
