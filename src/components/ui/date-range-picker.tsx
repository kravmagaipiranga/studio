
"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: DateRange | undefined
  onChange?: (date: DateRange | undefined) => void
  placeholder?: string
  defaultToCurrentMonth?: boolean
}

export function DatePickerWithRange({
  className,
  value,
  onChange,
  placeholder = "Selecione um período",
  defaultToCurrentMonth = true,
}: DatePickerWithRangeProps) {
  const isControlled = value !== undefined || onChange !== undefined
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>()

  React.useEffect(() => {
    if (!isControlled && defaultToCurrentMonth) {
      const today = new Date()
      setInternalDate({
        from: startOfMonth(today),
        to: endOfMonth(today),
      })
    }
  }, [isControlled, defaultToCurrentMonth])

  const date = isControlled ? value : internalDate
  const setDate = (d: DateRange | undefined) => {
    if (isControlled) {
      onChange?.(d)
    } else {
      setInternalDate(d)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: ptBR })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
