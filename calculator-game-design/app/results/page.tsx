"use client"

import { Button } from "@/components/ui/button"
import { NumericRain } from "@/components/numeric-rain"
import { useRouter } from "next/navigation"

export default function ResultsPage() {
  const router = useRouter()

  const correctAnswer = 27000
  const results = [
    { name: "Jordan", guess: 28000, points: 1, isWinner: true },
    { name: "Alex", guess: 25000, points: 0, isWinner: false },
    { name: "Sam", guess: 30000, points: 0, isWinner: false },
    { name: "Taylor", guess: 15000, points: -1, isLoser: true },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0E1A] flex flex-col p-6">
      <NumericRain />

      <div className="relative z-10 w-full max-w-md mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white text-center">Round Results</h1>

        {/* Correct Answer */}
        <div className="text-center py-6">
          <p className="text-[#8B92A6] mb-2">Correct Answer 🎯</p>
          <p className="text-5xl font-bold text-white font-mono">{correctAnswer.toLocaleString()}</p>
        </div>

        {/* Player Results */}
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className={`bg-[#3D4159] rounded-xl p-4 ${
                result.isWinner
                  ? "border-l-4 border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : result.isLoser
                    ? "border-l-4 border-[#EF4444] shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-lg font-medium">{result.name}</span>
                <span
                  className={`font-mono font-bold text-lg ${
                    result.points > 0 ? "text-[#10B981]" : result.points < 0 ? "text-[#EF4444]" : "text-[#8B92A6]"
                  }`}
                >
                  {result.points > 0 ? "+" : ""}
                  {result.points}
                </span>
              </div>
              <p className="text-[#8B92A6] font-mono">Guess: {result.guess.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <Button
          onClick={() => router.push("/question-entry")}
          className="w-full h-14 rounded-full bg-[#FF8C42] hover:bg-[#FF8C42]/90 text-[#0A0E1A] font-semibold text-lg"
        >
          Next Round
        </Button>
      </div>
    </div>
  )
}
