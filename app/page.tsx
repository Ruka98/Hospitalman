import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Stethoscope, User } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Hospital Management System</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Choose your role to access the system</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Admin Portal</CardTitle>
              <CardDescription>Manage users, appointments, and system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login/admin">
                <Button className="w-full" variant="default">
                  Admin Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Staff Portal</CardTitle>
              <CardDescription>View and manage patient appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login/staff">
                <Button className="w-full" variant="default">
                  Staff Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Patient Portal</CardTitle>
              <CardDescription>Book appointments and view medical records</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login/patient">
                <Button className="w-full" variant="default">
                  Patient Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
