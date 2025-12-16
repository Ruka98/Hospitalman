"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { login } from "@/lib/auth"
import { Shield, Stethoscope, User } from "lucide-react"

const roleConfig = {
  admin: {
    title: "Admin Login",
    icon: Shield,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  staff: {
    title: "Staff Login",
    icon: Stethoscope,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  patient: {
    title: "Patient Login",
    icon: User,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
}

export function LoginForm({ role }: { role: "admin" | "staff" | "patient" }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const config = roleConfig[role]
  const Icon = config.icon

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    startTransition(async () => {
      const result = await login(email, password)

      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        const destination =
          result.role === "admin" ? "/dashboard/admin" : result.role === "patient" ? "/dashboard/patient" : "/dashboard/staff"
        router.push(destination)
      }
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className={`w-12 h-12 ${config.bgColor} rounded-lg flex items-center justify-center mb-4`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <CardTitle>{config.title}</CardTitle>
        <CardDescription>Enter your credentials to access the system</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading || isPending}>
            {loading || isPending ? "Logging in..." : "Login"}
          </Button>
          {role !== "admin" && (
            <p className="text-sm text-center text-gray-600">
              {"Don't have an account? "}
              <Link href={`/register/${role}`} className="text-blue-600 hover:underline">
                Register here
              </Link>
            </p>
          )}
          <Link href="/" className="text-sm text-center text-gray-600 hover:underline w-full">
            Back to home
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
