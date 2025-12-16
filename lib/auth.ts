"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// In-memory user storage (replace with database)
const users: Array<{
  id: number
  username: string
  password: string
  role: "admin" | "staff" | "patient"
  fullName: string
  email: string
  phone?: string
}> = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    role: "admin",
    fullName: "System Administrator",
    email: "admin@hospital.com",
  },
  {
    id: 2,
    username: "doctor1",
    password: "doctor123",
    role: "staff",
    fullName: "Dr. Sarah Johnson",
    email: "sarah@hospital.com",
    phone: "555-0101",
  },
  {
    id: 3,
    username: "patient1",
    password: "patient123",
    role: "patient",
    fullName: "John Doe",
    email: "john@example.com",
    phone: "555-0202",
  },
]

let nextUserId = 4

export async function login(username: string, password: string, role: "admin" | "staff" | "patient") {
  const user = users.find((u) => u.username === username && u.password === password && u.role === role)

  if (!user) {
    return { error: "Invalid credentials" }
  }

  const cookieStore = await cookies()
  cookieStore.set("session", JSON.stringify({ userId: user.id, username: user.username, role: user.role }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return { success: true, role: user.role }
}

export async function register(data: {
  username: string
  password: string
  role: "staff" | "patient"
  fullName: string
  email: string
  phone?: string
}) {
  if (users.find((u) => u.username === data.username)) {
    return { error: "Username already exists" }
  }

  if (users.find((u) => u.email === data.email)) {
    return { error: "Email already exists" }
  }

  const newUser = {
    id: nextUserId++,
    username: data.username,
    password: data.password,
    role: data.role,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
  }

  users.push(newUser)

  const cookieStore = await cookies()
  cookieStore.set("session", JSON.stringify({ userId: newUser.id, username: newUser.username, role: newUser.role }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  })

  return { success: true, role: newUser.role }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
  redirect("/")
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get("session")

  if (!session) {
    return null
  }

  try {
    return JSON.parse(session.value) as { userId: number; username: string; role: "admin" | "staff" | "patient" }
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  return users.find((u) => u.id === session.userId) || null
}

export async function getAllUsers() {
  return users.map(({ password, ...user }) => user)
}

export async function deleteUser(userId: number) {
  const index = users.findIndex((u) => u.id === userId)
  if (index !== -1) {
    users.splice(index, 1)
    return { success: true }
  }
  return { error: "User not found" }
}
