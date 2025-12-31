"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { NumericRain } from "@/components/numeric-rain"
import { useRouter } from "next/navigation"

export default function QuestionEntryPage() {
  const [question, setQuestion] = useState("")
  const router = useRouter()

  const handleValidate = () => {
    if (question.trim()) {
      router.push("/calculator")
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0E1A] flex flex-col p-6">
      <NumericRain />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Your turn to ask! 🎯</h1>
          <span className="text-[#8B92A6] font-mono">Round 3/10</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., How many restaurants are in NYC?"
              className="min-h-[200px] bg-[#3D4159] border-none text-white placeholder:text-[#8B92A6] rounded-xl text-lg resize-none p-4"
            />
            <p className="text-[#8B92A6] text-sm">AI will verify your question 🤖</p>
          </div>

          <Button
            onClick={handleValidate}
            disabled={!question.trim()}
            className="w-full h-14 rounded-full bg-[#FF8C42] hover:bg-[#FF8C42]/90 text-[#0A0E1A] font-semibold text-lg disabled:opacity-50"
          >
            Validate Question
          </Button>
        </div>
      </div>
    </div>
  )
}
