import { LoginForm } from "@/components/login-form"
import { redirect } from "next/navigation"

export default async function LoginPage({ params }: { params: { role: string } }) {
  const { role } = params

  if (!["admin", "staff", "patient"].includes(role)) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <LoginForm role={role as "admin" | "staff" | "patient"} />
    </div>
  )
}
