"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface CalculatorProps {
  onSubmit: (value: string) => void
}

export function Calculator({ onSubmit }: CalculatorProps) {
  const [display, setDisplay] = useState("0")
  const [history, setHistory] = useState<string[]>([])

  const handleNumber = (num: string) => {
    setDisplay((prev) => (prev === "0" ? num : prev + num))
  }

  const handleOperator = (op: string) => {
    setDisplay((prev) => prev + op)
  }

  const handleDecimal = () => {
    const parts = display.split(/[+\-*/]/)
    const lastPart = parts[parts.length - 1]
    if (!lastPart.includes(".")) {
      setDisplay((prev) => prev + ".")
    }
  }

  const handleClear = () => {
    setDisplay("0")
  }

  const handleBackspace = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"))
  }

  const handleEquals = () => {
    try {
      const result = eval(display).toString()
      setHistory((prev) => [...prev, `${display} = ${result}`].slice(-3))
      setDisplay(result)
    } catch {
      setDisplay("Error")
    }
  }

  const handleSubmit = () => {
    onSubmit(display)
  }

  const buttonClass = "h-14 bg-[#3D4159] hover:bg-[#4D5169] text-white font-mono text-xl rounded-xl transition-colors"

  return (
    <div className="space-y-4">
      {/* History */}
      <div className="bg-[#3D4159]/50 rounded-xl p-3 min-h-[60px]">
        {history.map((item, index) => (
          <p key={index} className="text-[#8B92A6] font-mono text-sm">
            {item}
          </p>
        ))}
      </div>

      {/* Display */}
      <div className="bg-[#3D4159] rounded-xl p-6">
        <p className="text-white text-4xl font-mono text-right break-all">{display}</p>
      </div>

      {/* Calculator Grid */}
      <div className="grid grid-cols-4 gap-3">
        <Button onClick={handleClear} className={buttonClass}>
          C
        </Button>
        <Button onClick={handleBackspace} className={buttonClass}>
          ←
        </Button>
        <Button onClick={() => handleOperator("/")} className={buttonClass}>
          ÷
        </Button>
        <Button onClick={() => handleOperator("*")} className={buttonClass}>
          ×
        </Button>

        <Button onClick={() => handleNumber("7")} className={buttonClass}>
          7
        </Button>
        <Button onClick={() => handleNumber("8")} className={buttonClass}>
          8
        </Button>
        <Button onClick={() => handleNumber("9")} className={buttonClass}>
          9
        </Button>
        <Button onClick={() => handleOperator("-")} className={buttonClass}>
          -
        </Button>

        <Button onClick={() => handleNumber("4")} className={buttonClass}>
          4
        </Button>
        <Button onClick={() => handleNumber("5")} className={buttonClass}>
          5
        </Button>
        <Button onClick={() => handleNumber("6")} className={buttonClass}>
          6
        </Button>
        <Button onClick={() => handleOperator("+")} className={buttonClass}>
          +
        </Button>

        <Button onClick={() => handleNumber("1")} className={buttonClass}>
          1
        </Button>
        <Button onClick={() => handleNumber("2")} className={buttonClass}>
          2
        </Button>
        <Button onClick={() => handleNumber("3")} className={buttonClass}>
          3
        </Button>
        <Button onClick={handleEquals} className={buttonClass}>
          =
        </Button>

        <Button onClick={() => handleNumber("0")} className={`${buttonClass} col-span-2`}>
          0
        </Button>
        <Button onClick={handleDecimal} className={`${buttonClass} col-span-2`}>
          .
        </Button>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className="w-full h-14 rounded-full bg-[#FF8C42] hover:bg-[#FF8C42]/90 text-[#0A0E1A] font-semibold text-lg mt-4"
      >
        Submit Guess
      </Button>
    </div>
  )
}
