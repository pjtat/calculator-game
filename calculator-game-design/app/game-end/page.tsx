"use client"

import { Button } from "@/components/ui/button"
import { NumericRain } from "@/components/numeric-rain"
import { useRouter } from "next/navigation"

export default function GameEndPage() {
  const router = useRouter()

  const leaderboard = [
    { name: "Jordan", score: 12, place: 1 },
    { name: "Alex", score: 10, place: 2 },
    { name: "Sam", score: 8, place: 3 },
    { name: "Taylor", score: 5, place: 4 },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0E1A] flex flex-col p-6">
      <NumericRain />

      <div className="relative z-10 w-full max-w-md mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-white text-center">Game Over! 🏆</h1>

        {/* Winner Callout */}
        <div className="bg-gradient-to-r from-[#FF8C42]/20 to-[#FF8C42]/10 border-2 border-[#FF8C42] rounded-xl p-6 text-center">
          <p className="text-[#8B92A6] mb-2">Winner</p>
          <p className="text-3xl font-bold text-white mb-2">{leaderboard[0].name}</p>
          <p className="text-5xl font-bold text-[#FF8C42] font-mono">{leaderboard[0].score}</p>
        </div>

        {/* Final Leaderboard */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">Final Standings</h2>
          {leaderboard.map((player, index) => (
            <div key={index} className="bg-[#3D4159] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-[#8B92A6] font-mono w-8">
                  {player.place}
                  {player.place === 1 ? "st" : player.place === 2 ? "nd" : player.place === 3 ? "rd" : "th"}
                </span>
                <span className="text-white text-lg font-medium">{player.name}</span>
              </div>
              <span className="text-white text-2xl font-bold font-mono">{player.score}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="text-center py-2">
          <p className="text-[#8B92A6]">
            Rounds played: <span className="font-mono">10</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => router.push("/lobby")}
            className="w-full h-14 rounded-full bg-[#FF8C42] hover:bg-[#FF8C42]/90 text-[#0A0E1A] font-semibold text-lg"
          >
            Play Again
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full h-14 rounded-full border-2 border-[#FF8C42] text-[#FF8C42] hover:bg-[#FF8C42]/10 font-semibold text-lg bg-transparent"
          >
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}
