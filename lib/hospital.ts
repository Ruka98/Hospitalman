"use server"

import { revalidatePath } from "next/cache"
import { Buffer } from "node:buffer"
import { createSupabaseServerClient } from "./supabase"
import type { AppRole, Profile } from "./auth"

export type ClinicalVisit = {
  id: number
  patient_id: string
  doctor_id: string
  symptoms: string
  diagnosis: string
  plan: string
  created_at: string
  doctor?: { full_name: string }
}

export type CareOrder = {
  id: number
  patient_id: string
  order_type: "radiology" | "ecg"
  modality: string
  notes?: string
  ordering_doctor: string
  assigned_to?: string
  status: "pending" | "in_progress" | "completed"
  created_at: string
  updated_at: string
  patient?: { full_name: string }
  assignee?: { full_name: string }
}

export type OrderResult = {
  id: number
  order_id: number
  findings: string
  impression: string
  status: "pending" | "in_progress" | "completed"
  created_at: string
  created_by: string
  report_path?: string | null
  signed_url?: string | null
}

export async function getPatientsForStaff(staffId: string) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("care_assignments")
    .select("patient:patient_id(user_id, full_name), patient_id")
    .eq("clinician_id", staffId)

  if (error) return []
  return (data ?? []).map((row) => ({ id: row.patient?.user_id ?? row.patient_id, full_name: row.patient?.full_name ?? "" }))
}

export async function assignStaffToPatient(payload: { patientId: string; staffId: string }) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("care_assignments")
    .upsert({ patient_id: payload.patientId, clinician_id: payload.staffId }, { onConflict: "patient_id,clinician_id" })

  if (error) return { error: error.message }

  await supabase.from("notifications").insert({
    recipient_id: payload.staffId,
    title: "New patient assignment",
    body: "You have been assigned to a patient's care team.",
    related_type: "assignment",
    related_id: payload.patientId,
  })

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getOrdersForUser(userId: string, role: AppRole) {
  const supabase = createSupabaseServerClient()

  if (role === "doctor") {
    const { data } = await supabase
      .from("care_orders")
      .select("*, patient:patient_id(full_name), assignee:assigned_to(full_name)")
      .or(`ordering_doctor.eq.${userId},assigned_to.eq.${userId}`)
      .order("created_at", { ascending: false })
    return (data as CareOrder[]) ?? []
  }

  if (role === "radiologist" || role === "ecg_tech") {
    const { data } = await supabase
      .from("care_orders")
      .select("*, patient:patient_id(full_name), assignee:assigned_to(full_name)")
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false })
    return (data as CareOrder[]) ?? []
  }

  return []
}

export async function createClinicalVisitEntry(payload: {
  patientId: string
  doctorId: string
  symptoms: string
  diagnosis: string
  plan: string
}) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from("clinical_visits").insert({
    patient_id: payload.patientId,
    doctor_id: payload.doctorId,
    symptoms: payload.symptoms,
    diagnosis: payload.diagnosis,
    plan: payload.plan,
  })

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function createCareOrder(payload: {
  patientId: string
  doctorId: string
  orderType: "radiology" | "ecg"
  modality: string
  notes?: string
  assigneeId?: string
}) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("care_orders")
    .insert({
      patient_id: payload.patientId,
      ordering_doctor: payload.doctorId,
      assigned_to: payload.assigneeId,
      order_type: payload.orderType,
      modality: payload.modality,
      notes: payload.notes,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  if (payload.assigneeId) {
    await supabase.from("notifications").insert({
      recipient_id: payload.assigneeId,
      title: "New diagnostic order",
      body: `A new ${payload.orderType} order has been assigned to you.`,
      related_type: "order",
      related_id: data.id,
    })
  }

  revalidatePath("/dashboard")
  return { success: true, id: data.id }
}

export async function addOrderResult(payload: {
  orderId: number
  findings: string
  impression: string
  status: "pending" | "in_progress" | "completed"
  createdBy: string
  file?: File | null
}) {
  const supabase = createSupabaseServerClient()

  let storedPath: string | null = null
  if (payload.file) {
    const arrayBuffer = await payload.file.arrayBuffer()
    const fileName = `${payload.orderId}-${Date.now()}-${payload.file.name}`
    const { data: upload, error: uploadError } = await supabase.storage
      .from("imaging")
      .upload(fileName, Buffer.from(arrayBuffer), { contentType: payload.file.type })
    if (uploadError) return { error: uploadError.message }
    storedPath = upload.path
  }

  const { error } = await supabase.from("order_results").insert({
    order_id: payload.orderId,
    findings: payload.findings,
    impression: payload.impression,
    status: payload.status,
    created_by: payload.createdBy,
    report_path: storedPath,
  })

  if (error) return { error: error.message }

  await supabase
    .from("care_orders")
    .update({ status: payload.status })
    .eq("id", payload.orderId)

  const { data: order } = await supabase
    .from("care_orders")
    .select("patient_id, ordering_doctor")
    .eq("id", payload.orderId)
    .single()

  if (order) {
    await supabase.from("notifications").insert([
      {
        recipient_id: order.patient_id,
        title: "New result available",
        body: "A new diagnostic report has been uploaded to your account.",
        related_type: "order",
        related_id: payload.orderId,
      },
      {
        recipient_id: order.ordering_doctor,
        title: "Diagnostic report completed",
        body: "Your ordered study now has a completed report.",
        related_type: "order",
        related_id: payload.orderId,
      },
    ])
  }

  revalidatePath("/dashboard")
  return { success: true, path: storedPath }
}

export async function addNurseReport(payload: {
  patientId: string
  nurseId: string
  vitals: Record<string, string>
  notes?: string
}) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from("nurse_notes").insert({
    patient_id: payload.patientId,
    nurse_id: payload.nurseId,
    vitals: payload.vitals,
    notes: payload.notes,
  })

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function getPatientHistory(patientId: string) {
  const supabase = createSupabaseServerClient()
  const [visits, orders, nurseNotes] = await Promise.all([
    supabase
      .from("clinical_visits")
      .select("*, doctor:doctor_id(full_name)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("care_orders")
      .select("*, results:order_results(*), assignee:assigned_to(full_name), patient:patient_id(full_name)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("nurse_notes")
      .select("*, nurse:nurse_id(full_name)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
  ])

  const ordersWithUrls = await Promise.all(
    ((orders.data as any[]) ?? []).map(async (order) => {
      const results = await Promise.all(
        (order.results ?? []).map(async (result: any) => {
          if (!result.report_path) return result

          const { data: signed } = await supabase.storage.from("imaging").createSignedUrl(result.report_path, 3600)
          return { ...result, signed_url: signed?.signedUrl ?? null }
        }),
      )

      return { ...order, results }
    }),
  )

  return {
    visits: (visits.data as ClinicalVisit[]) ?? [],
    orders: ordersWithUrls,
    nurseNotes: nurseNotes.data ?? [],
  }
}

export async function listNotifications(userId: string) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, related_type, related_id, is_read, created_at")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })

  if (error) return []
  return data ?? []
}

export async function fetchAdminOverview() {
  const supabase = createSupabaseServerClient()
  const [{ data: users }, { data: orders }, { data: visits }] = await Promise.all([
    supabase.from("profiles").select("user_id"),
    supabase.from("care_orders").select("id"),
    supabase.from("clinical_visits").select("id"),
  ])

  return {
    userCount: users?.length ?? 0,
    orderCount: orders?.length ?? 0,
    visitCount: visits?.length ?? 0,
  }
}

export async function listStaffByRole() {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from("profiles")
    .select("user_id, full_name, role, staff_category, email, phone, is_active")
    .neq("role", "patient")
    .order("full_name")

  return (data as Profile[]) ?? []
}

export async function listPatients() {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, phone, medical_record_number")
    .eq("role", "patient")
    .order("full_name")

  return data ?? []
}
