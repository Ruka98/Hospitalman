"use server"

import { getSession } from "./auth"

// In-memory appointments storage
const appointments: Array<{
  id: number
  patientId: number
  patientName: string
  doctorId: number
  doctorName: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  notes?: string
}> = [
  {
    id: 1,
    patientId: 3,
    patientName: "John Doe",
    doctorId: 2,
    doctorName: "Dr. Sarah Johnson",
    date: "2025-01-15",
    time: "10:00",
    status: "confirmed",
    notes: "Regular checkup",
  },
]

let nextAppointmentId = 2

export async function createAppointment(data: {
  doctorId: number
  doctorName: string
  date: string
  time: string
  notes?: string
}) {
  const session = await getSession()
  if (!session || session.role !== "patient") {
    return { error: "Unauthorized" }
  }

  const newAppointment = {
    id: nextAppointmentId++,
    patientId: session.userId,
    patientName: session.username,
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    date: data.date,
    time: data.time,
    status: "pending" as const,
    notes: data.notes,
  }

  appointments.push(newAppointment)
  return { success: true, appointment: newAppointment }
}

export async function getAppointments() {
  const session = await getSession()
  if (!session) return []

  if (session.role === "admin") {
    return appointments
  } else if (session.role === "staff") {
    return appointments.filter((a) => a.doctorId === session.userId)
  } else if (session.role === "patient") {
    return appointments.filter((a) => a.patientId === session.userId)
  }

  return []
}

export async function updateAppointmentStatus(
  appointmentId: number,
  status: "pending" | "confirmed" | "completed" | "cancelled",
) {
  const appointment = appointments.find((a) => a.id === appointmentId)
  if (!appointment) {
    return { error: "Appointment not found" }
  }

  appointment.status = status
  return { success: true }
}

export async function deleteAppointment(appointmentId: number) {
  const index = appointments.findIndex((a) => a.id === appointmentId)
  if (index !== -1) {
    appointments.splice(index, 1)
    return { success: true }
  }
  return { error: "Appointment not found" }
}
