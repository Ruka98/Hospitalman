"use server"

import { getSession } from "./auth"

// In-memory medical records storage
const medicalRecords: Array<{
  id: number
  patientId: number
  patientName: string
  doctorId: number
  doctorName: string
  title: string
  description: string
  type: "scan" | "ecg" | "lab" | "prescription" | "other"
  fileData: string // Base64 encoded file
  fileName: string
  fileType: string
  uploadedAt: string
}> = []

let nextRecordId = 1

export async function uploadMedicalRecord(data: {
  patientId: number
  patientName: string
  title: string
  description: string
  type: "scan" | "ecg" | "lab" | "prescription" | "other"
  fileData: string
  fileName: string
  fileType: string
}) {
  const session = await getSession()
  if (!session || session.role !== "staff") {
    return { error: "Unauthorized. Only doctors can upload medical records." }
  }

  const newRecord = {
    id: nextRecordId++,
    patientId: data.patientId,
    patientName: data.patientName,
    doctorId: session.userId,
    doctorName: session.username,
    title: data.title,
    description: data.description,
    type: data.type,
    fileData: data.fileData,
    fileName: data.fileName,
    fileType: data.fileType,
    uploadedAt: new Date().toISOString(),
  }

  medicalRecords.push(newRecord)
  return { success: true, record: newRecord }
}

export async function getMedicalRecords(patientId?: number) {
  const session = await getSession()
  if (!session) return []

  if (session.role === "admin") {
    // Admin can see all records
    return patientId ? medicalRecords.filter((r) => r.patientId === patientId) : medicalRecords
  } else if (session.role === "staff") {
    // Doctors can see records they uploaded or all if no patientId
    if (patientId) {
      return medicalRecords.filter((r) => r.patientId === patientId)
    }
    return medicalRecords
  } else if (session.role === "patient") {
    // Patients can only see their own records
    return medicalRecords.filter((r) => r.patientId === session.userId)
  }

  return []
}

export async function deleteMedicalRecord(recordId: number) {
  const session = await getSession()
  if (!session || (session.role !== "staff" && session.role !== "admin")) {
    return { error: "Unauthorized" }
  }

  const index = medicalRecords.findIndex((r) => r.id === recordId)
  if (index !== -1) {
    medicalRecords.splice(index, 1)
    return { success: true }
  }
  return { error: "Record not found" }
}
