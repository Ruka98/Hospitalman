import { RegisterForm } from "@/components/register-form"
import { redirect } from "next/navigation"

export default async function RegisterPage({ params }: { params: { role: string } }) {
  const { role } = params

  if (!["staff", "patient"].includes(role)) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <RegisterForm role={role as "staff" | "patient"} />
    </div>
  )
}
