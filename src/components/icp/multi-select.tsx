"use client"

import * as React from "react"
import { X, ChevronsUpDown, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  placeholder: string
}

export function MultiSelect({
  options,
  selected,
  onSelectedChange,
  placeholder,
}: MultiSelectProps) {
  const [search, setSearch] = React.useState("")

  const filtered = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(value: string) {
    if (selected.includes(value)) {
      onSelectedChange(selected.filter((s) => s !== value))
    } else {
      onSelectedChange([...selected, value])
    }
  }

  function remove(value: string) {
    onSelectedChange(selected.filter((s) => s !== value))
  }

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
          <span className="text-muted-foreground">
            {selected.length > 0
              ? `${selected.length} selected`
              : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-full min-w-[var(--trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <CommandList>
              {filtered.length === 0 && (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
              <CommandGroup>
                {filtered.map((option) => {
                  const isSelected = selected.includes(option)
                  return (
                    <CommandItem
                      key={option}
                      onClick={() => toggle(option)}
                    >
                      <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary mr-2">
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      {option}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1">
              {value}
              <button
                type="button"
                onClick={() => remove(value)}
                className="rounded-full outline-none hover:bg-foreground/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
