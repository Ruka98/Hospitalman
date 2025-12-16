import { redirect } from "next/navigation"
import { getSession, getAllUsers } from "@/lib/auth"
import { getAppointments } from "@/lib/appointments"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UserManagement } from "@/components/user-management"
import { AppointmentList } from "@/components/appointment-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Activity } from "lucide-react"

export default async function AdminDashboard() {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    redirect("/login/admin")
  }

  const users = await getAllUsers()
  const appointments = await getAppointments()

  const stats = {
    totalUsers: users.length,
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter((a) => a.status === "pending").length,
    staffCount: users.filter((u) => u.role === "staff").length,
    patientCount: users.filter((u) => u.role === "patient").length,
  }

  return (
    <DashboardLayout role="admin" username={session.username}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, appointments, and system settings</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-gray-600 mt-1">
                {stats.staffCount} staff, {stats.patientCount} patients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
              <p className="text-xs text-gray-600 mt-1">Across all doctors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Appointments</CardTitle>
              <Activity className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
              <p className="text-xs text-gray-600 mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all system users</CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement users={users} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
              <CardDescription>View and manage all appointments in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <AppointmentList appointments={appointments} role="admin" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
