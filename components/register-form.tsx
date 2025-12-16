"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { register } from "@/lib/auth"
import { Stethoscope, User } from "lucide-react"

const roleConfig = {
  staff: {
    title: "Staff Registration",
    icon: Stethoscope,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  patient: {
    title: "Patient Registration",
    icon: User,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
}

export function RegisterForm({ role }: { role: "staff" | "patient" }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const config = roleConfig[role]
  const Icon = config.icon

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await register({ ...formData, role })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push(`/dashboard/${role}`)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className={`w-12 h-12 ${config.bgColor} rounded-lg flex items-center justify-center mb-4`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <CardTitle>{config.title}</CardTitle>
        <CardDescription>Create a new account to access the system</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="Choose a username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter your phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Choose a password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </Button>
          <p className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link href={`/login/${role}`} className="text-blue-600 hover:underline">
              Login here
            </Link>
          </p>
          <Link href="/" className="text-sm text-center text-gray-600 hover:underline w-full">
            Back to home
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
