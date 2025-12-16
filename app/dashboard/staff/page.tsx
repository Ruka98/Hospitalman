import { redirect } from "next/navigation"
import { getSession, getAllUsers } from "@/lib/auth"
import { getAppointments } from "@/lib/appointments"
import { getMedicalRecords } from "@/lib/medical-records"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AppointmentList } from "@/components/appointment-list"
import { UploadMedicalRecord } from "@/components/upload-medical-record"
import { MedicalRecordsList } from "@/components/medical-records-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CheckCircle, Clock, XCircle, FileText } from "lucide-react"

export default async function StaffDashboard() {
  const session = await getSession()

  if (!session || session.role !== "staff") {
    redirect("/login/staff")
  }

  const appointments = await getAppointments()
  const allUsers = await getAllUsers()
  const patients = allUsers.filter((u) => u.role === "patient")
  const medicalRecords = await getMedicalRecords()

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    records: medicalRecords.length,
  }

  // Sort appointments by date and time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`)
    const dateB = new Date(`${b.date} ${b.time}`)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <DashboardLayout role="staff" username={session.username}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage appointments and patient medical records</p>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-600 mt-1">All appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-gray-600 mt-1">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmed}</div>
              <p className="text-xs text-gray-600 mt-1">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <XCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-gray-600 mt-1">Finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Records</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.records}</div>
              <p className="text-xs text-gray-600 mt-1">Medical files</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="medical-records">Medical Records</TabsTrigger>
            <TabsTrigger value="upload">Upload New Record</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Your Appointments</CardTitle>
                <CardDescription>Manage appointments scheduled with you</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentList appointments={sortedAppointments} role="staff" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical-records">
            <Card>
              <CardHeader>
                <CardTitle>Patient Medical Records</CardTitle>
                <CardDescription>View and manage patient medical files</CardDescription>
              </CardHeader>
              <CardContent>
                <MedicalRecordsList records={medicalRecords} canDelete={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Medical Record</CardTitle>
                <CardDescription>Add scans, ECG reports, lab results, and other medical documents</CardDescription>
              </CardHeader>
              <CardContent>
                <UploadMedicalRecord patients={patients} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
