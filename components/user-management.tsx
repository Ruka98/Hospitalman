"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { deleteUser } from "@/lib/auth"

type User = {
  id: number
  username: string
  role: "admin" | "staff" | "patient"
  fullName: string
  email: string
  phone?: string
}

export function UserManagement({ users }: { users: User[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(userId: number) {
    if (!confirm("Are you sure you want to delete this user?")) return

    setDeleting(userId)
    await deleteUser(userId)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.fullName}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phone || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={user.role === "admin" ? "destructive" : user.role === "staff" ? "default" : "secondary"}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {user.role !== "admin" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    disabled={deleting === user.id}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
