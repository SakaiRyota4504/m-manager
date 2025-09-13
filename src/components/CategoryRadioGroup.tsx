'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Category = {
  id: string
  name: string
}

interface CategoryRadioGroupProps {
  categories: Category[]
  name: string // Name for the form input
  defaultValue?: string // Initial selected category ID
  onValueChange?: (value: string) => void
}

export function CategoryRadioGroup({ categories, name, defaultValue, onValueChange }: CategoryRadioGroupProps) {
  const [selectedValue, setSelectedValue] = useState<string | undefined>(defaultValue)

  const handleChange = (value: string) => {
    setSelectedValue(value)
    if (onValueChange) {
      onValueChange(value)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(category => (
        <Button
          key={category.id}
          type="button" // Prevent form submission
          variant={selectedValue === category.id ? 'default' : 'outline'}
          onClick={() => handleChange(category.id)}
          className={cn(
            "px-4 py-2 rounded-md text-sm",
            selectedValue === category.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {category.name}
        </Button>
      ))}
      {/* Hidden input to pass the selected value to the form */}
      <input type="hidden" name={name} value={selectedValue || ''} />
    </div>
  )
}
