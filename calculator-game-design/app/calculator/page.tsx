"use client"

import { useState, useEffect } from "react"
import { NumericRain } from "@/components/numeric-rain"
import { Calculator } from "@/components/calculator"
import { useRouter } from "next/navigation"

export default function CalculatorPage() {
  const [timeLeft, setTimeLeft] = useState(30)
  const router = useRouter()
  const question = "How many restaurants are in New York City?"

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const progress = (timeLeft / 30) * 100

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0E1A] flex flex-col p-6">
      <NumericRain />

      <div className="relative z-10 w-full max-w-md mx-auto space-y-6">
        {/* Question */}
        <div className="text-center">
          <p className="text-white text-lg font-medium text-balance">{question}</p>
        </div>

        {/* Timer */}
        <div className="flex justify-center">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="36" stroke="#3D4159" strokeWidth="8" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="#FF8C42"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-2xl font-bold font-mono">{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Calculator Component */}
        <Calculator onSubmit={(value) => router.push("/results")} />
      </div>
    </div>
  )
}
