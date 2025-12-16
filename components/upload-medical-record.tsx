"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadMedicalRecord } from "@/lib/medical-records"
import { Upload, Loader2 } from "lucide-react"

interface UploadMedicalRecordProps {
  patients: Array<{ id: number; username: string }>
  onSuccess?: () => void
}

export function UploadMedicalRecord({ patients, onSuccess }: UploadMedicalRecordProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    const patientId = Number.parseInt(formData.get("patientId") as string)
    const patient = patients.find((p) => p.id === patientId)

    if (!patient) {
      setError("Please select a patient")
      setIsLoading(false)
      return
    }

    if (!selectedFile) {
      setError("Please select a file to upload")
      setIsLoading(false)
      return
    }

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Data = reader.result as string

        const result = await uploadMedicalRecord({
          patientId: patient.id,
          patientName: patient.username,
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          type: formData.get("type") as "scan" | "ecg" | "lab" | "prescription" | "other",
          fileData: base64Data,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        })

        if (result.error) {
          setError(result.error)
        } else {
          setSuccess("Medical record uploaded successfully!")
          e.currentTarget.reset()
          setSelectedFile(null)
          if (onSuccess) onSuccess()
        }
        setIsLoading(false)
      }
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      setError("Failed to upload medical record")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-900">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="patientId">Patient</Label>
        <Select name="patientId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id.toString()}>
                {patient.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Record Type</Label>
        <Select name="type" required>
          <SelectTrigger>
            <SelectValue placeholder="Select record type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scan">Scan/X-Ray</SelectItem>
            <SelectItem value="ecg">ECG Report</SelectItem>
            <SelectItem value="lab">Lab Results</SelectItem>
            <SelectItem value="prescription">Prescription</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g., Chest X-Ray, Blood Test Results" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" placeholder="Add notes or observations" rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Upload File</Label>
        <Input
          id="file"
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          required
        />
        {selectedFile && (
          <p className="text-sm text-gray-600">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Medical Record
          </>
        )}
      </Button>
    </form>
  )
}
