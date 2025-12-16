import { redirect } from "next/navigation"
import { getSession, getAllUsers } from "@/lib/auth"
import { getAppointments } from "@/lib/appointments"
import { getMedicalRecords } from "@/lib/medical-records"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BookAppointmentForm } from "@/components/book-appointment-form"
import { AppointmentList } from "@/components/appointment-list"
import { MedicalRecordsList } from "@/components/medical-records-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CheckCircle, Clock, FileText } from "lucide-react"

export default async function PatientDashboard() {
  const session = await getSession()

  if (!session || session.role !== "patient") {
    redirect("/login/patient")
  }

  const appointments = await getAppointments()
  const allUsers = await getAllUsers()
  const doctors = allUsers.filter((u) => u.role === "staff")
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
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <DashboardLayout role="patient" username={session.username}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-2">Book appointments and view your medical records</p>
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
              <p className="text-xs text-gray-600 mt-1">Awaiting confirmation</p>
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
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-gray-600 mt-1">Past visits</p>
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

        <Tabs defaultValue="book" className="space-y-4">
          <TabsList>
            <TabsTrigger value="book">Book Appointment</TabsTrigger>
            <TabsTrigger value="appointments">My Appointments</TabsTrigger>
            <TabsTrigger value="medical-records">My Medical Records</TabsTrigger>
          </TabsList>

          <TabsContent value="book">
            <Card>
              <CardHeader>
                <CardTitle>Book New Appointment</CardTitle>
                <CardDescription>Schedule an appointment with a doctor</CardDescription>
              </CardHeader>
              <CardContent>
                <BookAppointmentForm doctors={doctors} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Your Appointments</CardTitle>
                <CardDescription>View your upcoming and past appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentList appointments={sortedAppointments} role="patient" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical-records">
            <Card>
              <CardHeader>
                <CardTitle>Your Medical Records</CardTitle>
                <CardDescription>View your medical history, scans, and reports</CardDescription>
              </CardHeader>
              <CardContent>
                <MedicalRecordsList records={medicalRecords} canDelete={false} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
