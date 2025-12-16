"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteMedicalRecord } from "@/lib/medical-records"
import { FileText, Download, Trash2, Eye } from "lucide-react"

interface MedicalRecord {
  id: number
  patientName: string
  doctorName: string
  title: string
  description: string
  type: "scan" | "ecg" | "lab" | "prescription" | "other"
  fileData: string
  fileName: string
  fileType: string
  uploadedAt: string
}

interface MedicalRecordsListProps {
  records: MedicalRecord[]
  canDelete?: boolean
  onUpdate?: () => void
}

const typeColors = {
  scan: "bg-blue-100 text-blue-800",
  ecg: "bg-red-100 text-red-800",
  lab: "bg-purple-100 text-purple-800",
  prescription: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
}

const typeLabels = {
  scan: "Scan/X-Ray",
  ecg: "ECG Report",
  lab: "Lab Results",
  prescription: "Prescription",
  other: "Other",
}

export function MedicalRecordsList({ records, canDelete, onUpdate }: MedicalRecordsListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function handleDelete(recordId: number) {
    setDeletingId(recordId)
    const result = await deleteMedicalRecord(recordId)
    if (result.success && onUpdate) {
      onUpdate()
    }
    setDeletingId(null)
  }

  function handleDownload(record: MedicalRecord) {
    const link = document.createElement("a")
    link.href = record.fileData
    link.download = record.fileName
    link.click()
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No medical records found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.patientName}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={typeColors[record.type]}>
                  {typeLabels[record.type]}
                </Badge>
              </TableCell>
              <TableCell>{record.title}</TableCell>
              <TableCell className="text-gray-600">{record.doctorName}</TableCell>
              <TableCell className="text-gray-600">{new Date(record.uploadedAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{record.title}</DialogTitle>
                        <DialogDescription>
                          Patient: {record.patientName} | Doctor: {record.doctorName}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {record.description && (
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-gray-700">{record.description}</p>
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold mb-2">File Preview</h4>
                          {record.fileType.startsWith("image/") ? (
                            <img
                              src={record.fileData || "/placeholder.svg"}
                              alt={record.title}
                              className="max-w-full h-auto rounded-lg border"
                            />
                          ) : (
                            <div className="p-8 border rounded-lg bg-gray-50 text-center">
                              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                              <p className="text-gray-600 mb-4">{record.fileName}</p>
                              <Button onClick={() => handleDownload(record)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download File
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="ghost" size="sm" onClick={() => handleDownload(record)}>
                    <Download className="h-4 w-4" />
                  </Button>

                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingId === record.id}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
