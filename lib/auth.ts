"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSupabaseServerClient, createSupabaseServiceClient } from "./supabase"

export type AppRole =
  | "admin"
  | "doctor"
  | "radiologist"
  | "nurse"
  | "ecg_tech"
  | "lab_tech"
  | "pharmacist"
  | "receptionist"
  | "patient"

export type Profile = {
  user_id: string
  full_name: string
  email: string
  phone?: string
  role: AppRole
  staff_category?: AppRole
  is_active: boolean
  created_at: string
  medical_record_number?: string
}

export async function login(email: string, password: string) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  const role = (data.session?.user.user_metadata?.app_role as AppRole | undefined) ?? "patient"
  return { success: true, role }
}

export async function register(data: {
  email: string
  password: string
  fullName: string
  phone?: string
  role: Exclude<AppRole, "admin"> // admin accounts are provisioned
  staffCategory?: AppRole
}) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        app_role: data.role,
        staff_category: data.staffCategory ?? data.role,
        full_name: data.fullName,
        phone: data.phone,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  const userId = data.user?.id
  if (!userId) {
    return { error: "User was not created" }
  }

  // create profile row
  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: userId,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    role: data.role,
    staff_category: data.staffCategory ?? data.role,
    is_active: true,
  })

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath("/dashboard")
  return { success: true, role: data.role }
}

export async function provisionAccount(data: {
  email: string
  password: string
  fullName: string
  phone?: string
  role: AppRole
  staffCategory?: AppRole
  createdBy?: string
  medicalRecordNumber?: string
}) {
  const admin = createSupabaseServiceClient()

  const { data: created, error } = await admin.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    password: data.password,
    user_metadata: {
      app_role: data.role,
      staff_category: data.staffCategory ?? data.role,
      full_name: data.fullName,
      phone: data.phone,
    },
  })

  if (error || !created.user) {
    return { error: error?.message ?? "Unable to create user" }
  }

  const profile = {
    user_id: created.user.id,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    role: data.role,
    staff_category: data.staffCategory ?? data.role,
    is_active: true,
    created_by: data.createdBy,
    medical_record_number: data.medicalRecordNumber,
  }

  const { error: profileError } = await admin.from("profiles").upsert(profile)
  if (profileError) {
    return { error: profileError.message }
  }

  return { success: true, profile }
}

export async function logout() {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/")
}

export async function getSession() {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const session = await getSession()
  if (!session?.user.id) return null

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, phone, role, staff_category, is_active, created_at, medical_record_number")
    .eq("user_id", session.user.id)
    .single()

  if (error) return null
  return data as Profile
}

export async function getAllUsers() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, phone, role, staff_category, is_active, created_at, medical_record_number")
    .order("created_at", { ascending: false })

  if (error) {
    return []
  }

  return data as Profile[]
}

export async function deactivateUser(userId: string) {
  const admin = createSupabaseServiceClient()
  const { error } = await admin.from("profiles").update({ is_active: false }).eq("user_id", userId)
  return error ? { error: error.message } : { success: true }
}

export async function updatePassword(newPassword: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return error ? { error: error.message } : { success: true }
}
