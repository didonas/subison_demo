"use server";
import { appointmentSchema, AppointmentFormData } from "@/lib/validation/appointment";
import { bookAppointment, getAvailableBookingDates, getAvailableSlots } from "@/lib/appointments/service";

export async function getAvailableDatesAction(doctorId: string) {
  return await getAvailableBookingDates(doctorId);
}

export async function getAvailableSlotsAction(doctorId: string, dateStr: string) {
  return await getAvailableSlots(doctorId, dateStr);
}

export async function submitAppointmentForm(data: AppointmentFormData) {
  // Validate input
  const validation = appointmentSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid form data. Please check your inputs." };
  }

  // Book
  const result = await bookAppointment(validation.data);
  return result;
}
