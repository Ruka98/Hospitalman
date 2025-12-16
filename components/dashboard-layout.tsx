"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth"
import { Shield, Stethoscope, User, LogOut, Scan, HeartPulse, Nurse, Microscope, Pill, Phone } from "lucide-react"
import type { AppRole } from "@/lib/auth"

const roleConfig: Record<
  AppRole,
  {
    icon: typeof Shield
    color: string
    bgColor: string
    label: string
  }
> = {
  admin: { icon: Shield, color: "text-red-600", bgColor: "bg-red-100", label: "Admin" },
  doctor: { icon: Stethoscope, color: "text-blue-600", bgColor: "bg-blue-100", label: "Doctor" },
  radiologist: { icon: Scan, color: "text-purple-600", bgColor: "bg-purple-100", label: "Radiologist" },
  nurse: { icon: Nurse, color: "text-emerald-600", bgColor: "bg-emerald-100", label: "Nurse" },
  ecg_tech: { icon: HeartPulse, color: "text-amber-600", bgColor: "bg-amber-100", label: "ECG Technician" },
  lab_tech: { icon: Microscope, color: "text-indigo-600", bgColor: "bg-indigo-100", label: "Lab Technician" },
  pharmacist: { icon: Pill, color: "text-teal-600", bgColor: "bg-teal-100", label: "Pharmacist" },
  receptionist: { icon: Phone, color: "text-sky-600", bgColor: "bg-sky-100", label: "Receptionist" },
  patient: { icon: User, color: "text-green-600", bgColor: "bg-green-100", label: "Patient" },
}

export function DashboardLayout({
  children,
  role,
  username,
}: {
  children: React.ReactNode
  role: AppRole
  username: string
}) {
  const router = useRouter()
  const config = roleConfig[role]
  const Icon = config.icon

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 capitalize">{config.label} Portal</h2>
                <p className="text-sm text-gray-600">{username}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
