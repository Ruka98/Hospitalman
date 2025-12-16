import { redirect } from "next/navigation"
import { getCurrentProfile } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPatientHistory, listNotifications } from "@/lib/hospital"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, FolderOpenDot, Stethoscope } from "lucide-react"

export default async function PatientDashboard() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "patient") {
    redirect("/login/patient")
  }

  const history = await getPatientHistory(profile.user_id)
  const notifications = await listNotifications(profile.user_id)

  return (
    <DashboardLayout role="patient" username={profile.full_name}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Patient Portal</h1>
          <p className="text-gray-600">Access your visits, results, and notifications. Only you can see this data.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clinical visits</CardTitle>
              <Stethoscope className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{history.visits.length}</div>
              <p className="text-xs text-gray-600">Doctor authored notes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <FolderOpenDot className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{history.orders.length}</div>
              <p className="text-xs text-gray-600">Radiology and ECG</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-gray-600">Results and updates</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="visits" className="space-y-4">
          <TabsList>
            <TabsTrigger value="visits">Doctor notes</TabsTrigger>
            <TabsTrigger value="orders">Results</TabsTrigger>
            <TabsTrigger value="nursing">Nursing reports</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="visits">
            <Card>
              <CardHeader>
                <CardTitle>Clinical visits</CardTitle>
                <CardDescription>Read-only history of your encounters.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Plan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.visits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell>{new Date(visit.created_at).toLocaleString()}</TableCell>
                          <TableCell>{visit.doctor?.full_name ?? "Doctor"}</TableCell>
                          <TableCell>{visit.diagnosis}</TableCell>
                          <TableCell>{visit.plan}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {history.visits.length === 0 && (
                    <Alert className="m-3">
                      <AlertDescription>No visits recorded yet.</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Completed results</CardTitle>
                <CardDescription>Radiology or ECG orders that belong to you.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Findings</TableHead>
                        <TableHead>Impression</TableHead>
                        <TableHead>Report</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.orders.map((order: any) => {
                        const latestResult = order.results?.[0]
                        return (
                          <TableRow key={order.id}>
                            <TableCell>#{order.id}</TableCell>
                            <TableCell className="capitalize">{order.order_type}</TableCell>
                            <TableCell>
                              <Badge variant={order.status === "completed" ? "default" : "secondary"}>{order.status}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] text-sm text-gray-800">
                              {latestResult?.findings ?? "Pending"}
                            </TableCell>
                            <TableCell className="max-w-[200px] text-sm text-gray-800">
                              {latestResult?.impression ?? "Pending"}
                            </TableCell>
                            <TableCell>
                              {latestResult?.signed_url ? (
                                <Button variant="link" asChild className="px-0">
                                  <a href={latestResult.signed_url} target="_blank" rel="noreferrer">
                                    View report
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-gray-600">Not uploaded</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  {history.orders.length === 0 && (
                    <Alert className="m-3">
                      <AlertDescription>No diagnostic orders yet.</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nursing">
            <Card>
              <CardHeader>
                <CardTitle>Nursing reports</CardTitle>
                <CardDescription>Vitals captured by nursing staff.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Nurse</TableHead>
                        <TableHead>Vitals</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.nurseNotes.map((note: any) => (
                        <TableRow key={note.id}>
                          <TableCell>{new Date(note.created_at).toLocaleString()}</TableCell>
                          <TableCell>{note.nurse?.full_name ?? "Nurse"}</TableCell>
                          <TableCell className="text-sm text-gray-700">
                            BP: {note.vitals?.bp || "-"} | Pulse: {note.vitals?.pulse || "-"} | SpO2: {note.vitals?.spo2 || "-"}
                          </TableCell>
                          <TableCell>{note.notes ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {history.nurseNotes.length === 0 && (
                    <Alert className="m-3">
                      <AlertDescription>No nursing reports yet.</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Results and updates shared with you.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((note) => (
                        <TableRow key={note.id}>
                          <TableCell className="font-medium">{note.title}</TableCell>
                          <TableCell>{note.body}</TableCell>
                          <TableCell>{new Date(note.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {notifications.length === 0 && (
                    <Alert className="m-3">
                      <AlertDescription>No notifications yet.</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
