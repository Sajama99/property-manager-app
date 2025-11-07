"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { AddPropertyDialog } from "@/components/add-property-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  property_type: string
  notes: string | null
}

interface PropertiesViewProps {
  properties: Property[]
}

export function PropertiesView({ properties }: PropertiesViewProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return

    setIsDeleting(propertyId)
    try {
      const { error } = await supabase.from("properties").delete().eq("id", propertyId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting property:", error)
      alert("Failed to delete property. It may have associated appointments.")
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Property Portfolio</CardTitle>
              <CardDescription>Manage all properties in your portfolio</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Properties Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No properties in your portfolio yet</p>
              <Button onClick={() => setShowAddDialog(true)}>Add Your First Property</Button>
            </CardContent>
          </Card>
        ) : (
          properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {property.property_type}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isDeleting === property.id}
                      onClick={() => handleDelete(property.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <div>{property.address}</div>
                      <div>
                        {property.city}, {property.state} {property.zip_code}
                      </div>
                    </div>
                  </div>
                  {property.notes && <p className="text-muted-foreground pt-2 border-t">{property.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AddPropertyDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  )
}
