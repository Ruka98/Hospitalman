import { redirect } from "next/navigation"
import { getCurrentProfile } from "@/lib/auth"
import {
  addNurseReport,
  addOrderResult,
  assignStaffToPatient,
  createCareOrder,
  createClinicalVisitEntry,
  getOrdersForUser,
  getPatientsForStaff,
  getPatientHistory,
  listNotifications,
  listStaffByRole,
} from "@/lib/hospital"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FilePlus, Inbox, ListChecks, Stethoscope } from "lucide-react"

export default async function StaffDashboard({ searchParams }: { searchParams?: { patientId?: string } }) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role === "admin" || profile.role === "patient") {
    redirect("/login/staff")
  }

  const patientAssignments = await getPatientsForStaff(profile.user_id)
  const orders = await getOrdersForUser(profile.user_id, profile.staff_category ?? profile.role)
  const notifications = await listNotifications(profile.user_id)
  const staff = await listStaffByRole()
  const selectedPatientId = searchParams?.patientId ?? patientAssignments[0]?.id
  const patientHistory =
    profile.staff_category === "doctor" && selectedPatientId ? await getPatientHistory(selectedPatientId) : null

  async function submitClinicalVisit(formData: FormData) {
    "use server"
    await createClinicalVisitEntry({
      patientId: formData.get("patientId")!.toString(),
      doctorId: profile.user_id,
      symptoms: formData.get("symptoms")?.toString() ?? "",
      diagnosis: formData.get("diagnosis")?.toString() ?? "",
      plan: formData.get("plan")?.toString() ?? "",
    })
  }

  async function submitOrder(formData: FormData) {
    "use server"
    await createCareOrder({
      patientId: formData.get("patientId")!.toString(),
      doctorId: profile.user_id,
      orderType: formData.get("orderType")!.toString() as "radiology" | "ecg",
      modality: formData.get("modality")?.toString() ?? "",
      notes: formData.get("notes")?.toString() ?? undefined,
      assigneeId: formData.get("assigneeId")?.toString() || undefined,
    })
  }

  async function assignCareTeamMember(formData: FormData) {
    "use server"
    await assignStaffToPatient({
      patientId: formData.get("patientId")!.toString(),
      staffId: formData.get("staffId")!.toString(),
    })
  }

  async function submitResult(formData: FormData) {
    "use server"
    const file = formData.get("file") as File | null
    await addOrderResult({
      orderId: Number(formData.get("orderId")),
      findings: formData.get("findings")?.toString() ?? "",
      impression: formData.get("impression")?.toString() ?? "",
      status: (formData.get("status")?.toString() ?? "completed") as any,
      createdBy: profile.user_id,
      file,
    })
  }

  async function submitNurseReport(formData: FormData) {
    "use server"
    await addNurseReport({
      patientId: formData.get("patientId")!.toString(),
      nurseId: profile.user_id,
      vitals: {
        bp: formData.get("bp")?.toString() ?? "",
        pulse: formData.get("pulse")?.toString() ?? "",
        spo2: formData.get("spo2")?.toString() ?? "",
      },
      notes: formData.get("notes")?.toString() ?? undefined,
    })
  }

  const staffOptions = staff.filter((s) => ["radiologist", "ecg_tech"].includes(s.staff_category ?? s.role))
  const assignableStaff = staff.filter((member) => member.role !== "patient")

  return (
    <DashboardLayout role={profile.staff_category ?? profile.role} username={profile.full_name}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Staff Portal</h1>
          <p className="text-gray-600">
            Role: {profile.staff_category ?? profile.role}. Manage your assigned patients, orders, and notes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Assigned patients</CardTitle>
              <Stethoscope className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientAssignments.length}</div>
              <p className="text-xs text-gray-600">Linked via care assignments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open orders</CardTitle>
              <ListChecks className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.filter((o) => o.status !== "completed").length}</div>
              <p className="text-xs text-gray-600">Pending or in-progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Inbox className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-gray-600">Unread + history</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            {profile.staff_category === "doctor" && <TabsTrigger value="visits">Clinical visits</TabsTrigger>}
            {profile.staff_category === "doctor" && <TabsTrigger value="history">Patient history</TabsTrigger>}
            {profile.staff_category === "nurse" && <TabsTrigger value="nursing">Nursing reports</TabsTrigger>}
            {(profile.staff_category === "radiologist" || profile.staff_category === "ecg_tech") && (
              <TabsTrigger value="results">Results</TabsTrigger>
            )}
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {profile.staff_category === "doctor" && (
              <Card>
                <CardHeader>
                  <CardTitle>Create diagnostic order</CardTitle>
                  <CardDescription>Assign radiology or ECG requests to technicians.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={submitOrder} className="grid gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select name="patientId" className="rounded-md border border-input bg-background px-3 py-2" required>
                        <option value="">Select patient</option>
                        {patientAssignments.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.full_name}
                          </option>
                        ))}
                      </select>
                      <select name="orderType" className="rounded-md border border-input bg-background px-3 py-2" required>
                        <option value="radiology">Radiology</option>
                        <option value="ecg">ECG</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input name="modality" placeholder="Modality (X-ray / CT / MRI / Ultrasound / ECG)" required />
                      <select name="assigneeId" className="rounded-md border border-input bg-background px-3 py-2">
                        <option value="">Unassigned</option>
                        {staffOptions.map((s) => (
                          <option key={s.user_id} value={s.user_id}>
                            {s.full_name} ({s.staff_category ?? s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Textarea name="notes" placeholder="Reason for the order" />
                    <Button type="submit" className="w-full">
                      Submit order
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {profile.staff_category === "doctor" && (
              <Card>
                <CardHeader>
                  <CardTitle>Assign staff to patient</CardTitle>
                  <CardDescription>Link radiologists or other team members so they can follow the patient.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={assignCareTeamMember} className="grid gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select name="patientId" className="rounded-md border border-input bg-background px-3 py-2" required>
                        <option value="">Select patient</option>
                        {patientAssignments.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.full_name}
                          </option>
                        ))}
                      </select>
                      <select name="staffId" className="rounded-md border border-input bg-background px-3 py-2" required>
                        <option value="">Select staff member</option>
                        {assignableStaff.map((member) => (
                          <option key={member.user_id} value={member.user_id}>
                            {member.full_name} ({member.staff_category ?? member.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit">Assign to care team</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Assigned orders</CardTitle>
                <CardDescription>Orders you created or were assigned to.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assignee</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.id}</TableCell>
                          <TableCell>{order.patient?.full_name ?? "Patient"}</TableCell>
                          <TableCell className="capitalize">{order.order_type}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "default"
                                  : order.status === "in_progress"
                                  ? "outline"
                                  : "secondary"
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.assignee?.full_name ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {profile.staff_category === "doctor" && (
            <TabsContent value="visits" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document clinical visit</CardTitle>
                  <CardDescription>Capture symptoms, diagnosis, and plan for an encounter.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={submitClinicalVisit} className="grid gap-3">
                    <select name="patientId" className="rounded-md border border-input bg-background px-3 py-2" required>
                      <option value="">Select patient</option>
                      {patientAssignments.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.full_name}
                        </option>
                      ))}
                    </select>
                    <Textarea name="symptoms" placeholder="Symptoms" required />
                    <Textarea name="diagnosis" placeholder="Diagnosis" required />
                    <Textarea name="plan" placeholder="Plan" required />
                    <Button type="submit">Save note</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {profile.staff_category === "doctor" && (
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient history</CardTitle>
                  <CardDescription>Select a patient to review their encounters and diagnostic results.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form className="grid grid-cols-1 md:grid-cols-3 gap-3" method="get">
                    <select
                      name="patientId"
                      className="rounded-md border border-input bg-background px-3 py-2"
                      defaultValue={selectedPatientId}
                    >
                      {patientAssignments.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.full_name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit">Load history</Button>
                  </form>

                  {!patientHistory && (
                    <Alert>
                      <AlertDescription>Select an assigned patient to load their record.</AlertDescription>
                    </Alert>
                  )}

                  {patientHistory && (
                    <div className="space-y-4">
                      <div className="grid lg:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Clinical visits</CardTitle>
                            <CardDescription>Notes recorded by any doctor.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="border rounded-lg">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Diagnosis</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {patientHistory.visits.map((visit) => (
                                    <TableRow key={visit.id}>
                                      <TableCell>{new Date(visit.created_at).toLocaleString()}</TableCell>
                                      <TableCell>{visit.doctor?.full_name ?? "Doctor"}</TableCell>
                                      <TableCell>{visit.diagnosis}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {patientHistory.visits.length === 0 && (
                                <Alert className="m-3">
                                  <AlertDescription>No visits logged yet.</AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Orders and reports</CardTitle>
                            <CardDescription>Radiology or ECG activity with available reports.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="border rounded-lg">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Findings</TableHead>
                                    <TableHead>Report</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {patientHistory.orders.map((order: any) => {
                                    const latestResult = order.results?.[0]
                                    return (
                                      <TableRow key={order.id}>
                                        <TableCell className="whitespace-nowrap">#{order.id}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              order.status === "completed"
                                                ? "default"
                                                : order.status === "in_progress"
                                                  ? "outline"
                                                  : "secondary"
                                            }
                                          >
                                            {order.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] text-sm text-gray-800">
                                          {latestResult?.findings ?? "Pending"}
                                        </TableCell>
                                        <TableCell>
                                          {latestResult?.signed_url ? (
                                            <Button variant="link" asChild className="px-0">
                                              <a href={latestResult.signed_url} target="_blank" rel="noreferrer">
                                                Download
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
                              {patientHistory.orders.length === 0 && (
                                <Alert className="m-3">
                                  <AlertDescription>No diagnostic orders yet.</AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Nursing reports</CardTitle>
                          <CardDescription>Vitals and bedside notes.</CardDescription>
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
                                {patientHistory.nurseNotes.map((note: any) => (
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
                            {patientHistory.nurseNotes.length === 0 && (
                              <Alert className="m-3">
                                <AlertDescription>No nursing documentation yet.</AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {profile.staff_category === "nurse" && (
            <TabsContent value="nursing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add nursing report</CardTitle>
                  <CardDescription>Capture vitals and notes for a patient.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={submitNurseReport} className="grid gap-3">
                    <select name="patientId" className="rounded-md border border-input bg-background px-3 py-2" required>
                      <option value="">Select patient</option>
                      {patientAssignments.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.full_name}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input name="bp" placeholder="BP" />
                      <Input name="pulse" placeholder="Pulse" />
                      <Input name="spo2" placeholder="SpO2" />
                    </div>
                    <Textarea name="notes" placeholder="Notes" />
                    <Button type="submit">Save report</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {(profile.staff_category === "radiologist" || profile.staff_category === "ecg_tech") && (
            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload findings</CardTitle>
                  <CardDescription>Attach structured report and imaging evidence.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={submitResult} className="grid gap-3" encType="multipart/form-data">
                    <select name="orderId" className="rounded-md border border-input bg-background px-3 py-2" required>
                      <option value="">Select assigned order</option>
                      {orders.map((order) => (
                        <option key={order.id} value={order.id}>
                          #{order.id} - {order.patient?.full_name ?? "Patient"}
                        </option>
                      ))}
                    </select>
                    <Textarea name="findings" placeholder="Findings" required />
                    <Textarea name="impression" placeholder="Impression" required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                      <select name="status" className="rounded-md border border-input bg-background px-3 py-2">
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <Input name="file" type="file" accept=".dcm,.jpg,.jpeg,.png,.pdf" />
                    </div>
                    <Button type="submit">
                      <FilePlus className="h-4 w-4 mr-2" />
                      Submit result
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Order assignments and updates.</CardDescription>
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
