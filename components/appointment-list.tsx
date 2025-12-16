"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { updateAppointmentStatus, deleteAppointment } from "@/lib/appointments"

type Appointment = {
  id: number
  patientName: string
  doctorName: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  notes?: string
}

export function AppointmentList({
  appointments,
  role,
}: {
  appointments: Appointment[]
  role: "admin" | "staff" | "patient"
}) {
  const router = useRouter()
  const [updating, setUpdating] = useState<number | null>(null)

  async function handleStatusUpdate(
    appointmentId: number,
    status: "pending" | "confirmed" | "completed" | "cancelled",
  ) {
    setUpdating(appointmentId)
    await updateAppointmentStatus(appointmentId, status)
    setUpdating(null)
    router.refresh()
  }

  async function handleDelete(appointmentId: number) {
    if (!confirm("Are you sure you want to delete this appointment?")) return

    await deleteAppointment(appointmentId)
    router.refresh()
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            {role !== "patient" && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={role !== "patient" ? 7 : 6} className="text-center text-gray-500 py-8">
                No appointments found
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">{appointment.patientName}</TableCell>
                <TableCell>{appointment.doctorName}</TableCell>
                <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                <TableCell>{appointment.time}</TableCell>
                <TableCell>
                  {role === "patient" ? (
                    <Badge className={statusColors[appointment.status]}>{appointment.status}</Badge>
                  ) : (
                    <Select
                      value={appointment.status}
                      onValueChange={(value) =>
                        handleStatusUpdate(appointment.id, value as "pending" | "confirmed" | "completed" | "cancelled")
                      }
                      disabled={updating === appointment.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">{appointment.notes || "-"}</TableCell>
                {role !== "patient" && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(appointment.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
