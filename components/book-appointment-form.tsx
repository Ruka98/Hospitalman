"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createAppointment } from "@/lib/appointments"

type Doctor = {
  id: number
  fullName: string
}

export function BookAppointmentForm({ doctors }: { doctors: Doctor[] }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    doctorId: "",
    date: "",
    time: "",
    notes: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const doctor = doctors.find((d) => d.id === Number(formData.doctorId))
    if (!doctor) {
      setError("Please select a doctor")
      setLoading(false)
      return
    }

    const result = await createAppointment({
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      date: formData.date,
      time: formData.time,
      notes: formData.notes,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess("Appointment booked successfully!")
      setFormData({ doctorId: "", date: "", time: "", notes: "" })
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="doctor">Select Doctor</Label>
          <Select value={formData.doctorId} onValueChange={(value) => setFormData({ ...formData, doctorId: value })}>
            <SelectTrigger id="doctor">
              <SelectValue placeholder="Choose a doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={String(doctor.id)}>
                  {doctor.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Appointment Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Appointment Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional information or symptoms"
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full md:w-auto">
        {loading ? "Booking..." : "Book Appointment"}
      </Button>
    </form>
  )
}
