export {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  userRoleSchema,
  type ForgotPasswordDto,
  type LoginDto,
  type RegisterDto,
  type ResetPasswordDto,
  type UserRoleDto,
} from './auth.js';
export {
  therapistListQuerySchema,
  updateProfileSchema,
  type TherapistListQueryDto,
  type UpdateProfileDto,
} from './profile.js';
export {
  appointmentListQuerySchema,
  availabilityQuerySchema,
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rateAppointmentSchema,
  therapistScheduleQuerySchema,
  type AppointmentListQueryDto,
  type AvailabilityQueryDto,
  type BookAppointmentDto,
  type CancelAppointmentDto,
  type RateAppointmentDto,
  type TherapistScheduleQueryDto,
} from './appointment.js';
