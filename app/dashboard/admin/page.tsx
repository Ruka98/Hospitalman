import { redirect } from "next/navigation"
import { getCurrentProfile, provisionAccount } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchAdminOverview, listPatients, listStaffByRole } from "@/lib/hospital"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, CalendarRange, Users } from "lucide-react"

export default async function AdminDashboard() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") {
    redirect("/login/admin")
  }

  const [staff, patients, overview] = await Promise.all([listStaffByRole(), listPatients(), fetchAdminOverview()])

  async function createUser(formData: FormData) {
    "use server"

    const role = formData.get("role")?.toString() ?? "patient"
    const staffCategory = formData.get("staffCategory")?.toString() ?? role
    const fullName = formData.get("fullName")?.toString() ?? ""
    const email = formData.get("email")?.toString() ?? ""
    const phone = formData.get("phone")?.toString() ?? ""
    const password = formData.get("password")?.toString() ?? "ChangeMe123!"
    const mrn = formData.get("mrn")?.toString() || undefined

    await provisionAccount({
      email,
      password,
      fullName,
      phone,
      role: role as any,
      staffCategory: role === "patient" ? undefined : (staffCategory as any),
      createdBy: profile.user_id,
      medicalRecordNumber: mrn,
    })
  }

  return (
    <DashboardLayout role="admin" username={profile.full_name}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Provision accounts and monitor hospital activity</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.userCount}</div>
              <p className="text-xs text-gray-600 mt-1">All staff and patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <CalendarRange className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.orderCount}</div>
              <p className="text-xs text-gray-600 mt-1">Radiology + ECG orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clinical visits</CardTitle>
              <Activity className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.visitCount}</div>
              <p className="text-xs text-gray-600 mt-1">Doctor authored notes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create account</CardTitle>
              <CardDescription>Admins provision staff and patient logins with an initial password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createUser} className="grid gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input name="fullName" placeholder="Full name" required />
                  <Input name="email" placeholder="Email" type="email" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input name="phone" placeholder="Phone" />
                  <Input name="password" placeholder="Initial password" type="password" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select name="role" className="w-full rounded-md border border-input bg-background px-3 py-2">
                    <option value="doctor">Doctor</option>
                    <option value="radiologist">Radiologist</option>
                    <option value="nurse">Nurse</option>
                    <option value="ecg_tech">ECG Technician</option>
                    <option value="lab_tech">Lab Technician</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="patient">Patient</option>
                  </select>
                  <Input name="staffCategory" placeholder="Staff category (defaults to role)" />
                </div>
                <Input name="mrn" placeholder="MRN (patients only)" />
                <Button type="submit" className="w-full">Create account</Button>
              </form>
              <Alert className="mt-4" variant="info">
                <AlertDescription>
                  Passwords are set by the admin. Users can update their password from their portal. Provisioning uses the
                  Supabase service role; keep your service key only on the server.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staff directory</CardTitle>
              <CardDescription>All non-patient profiles with their active status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.user_id}>
                        <TableCell>
                          <div className="font-medium">{member.full_name}</div>
                          <div className="text-xs text-gray-600">{member.email}</div>
                        </TableCell>
                        <TableCell className="capitalize">{member.staff_category ?? member.role}</TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patients</CardTitle>
            <CardDescription>Accounts with role patient and their MRN.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>MRN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.user_id}>
                      <TableCell className="font-medium">{patient.full_name}</TableCell>
                      <TableCell>{patient.email}</TableCell>
                      <TableCell>{patient.phone ?? "-"}</TableCell>
                      <TableCell>{patient.medical_record_number ?? "Not set"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
