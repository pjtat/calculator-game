"use client"

import { Button } from "@/components/ui/button"
import { NumericRain } from "@/components/numeric-rain"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LobbyPage() {
  const router = useRouter()
  const isHost = true // This would come from state management

  const players = [
    { name: "Alex", isHost: true, score: 0 },
    { name: "Jordan", isHost: false, score: 0 },
    { name: "Sam", isHost: false, score: 0 },
    { name: "Taylor", isHost: false, score: 0 },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0E1A] flex flex-col p-6">
      <NumericRain />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <Link href="/" className="inline-block mb-8">
          <Button variant="ghost" className="text-white hover:bg-white/10">
            ← Leave
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Room Code */}
          <div className="text-center py-4">
            <p className="text-[#8B92A6] text-sm mb-1">Room Code</p>
            <p className="text-4xl font-bold text-white font-mono tracking-wider">ABC123</p>
          </div>

          {/* Players Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Players</h2>

            <div className="space-y-3">
              {players.map((player, index) => (
                <div key={index} className="bg-[#3D4159] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {player.isHost && <span className="text-2xl">👑</span>}
                    <span className="text-white text-lg font-medium">{player.name}</span>
                  </div>
                  <span className="text-[#8B92A6] font-mono text-lg">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Game Settings */}
          <div className="text-center py-2">
            <p className="text-[#8B92A6]">
              First to <span className="font-mono">10</span> points
            </p>
          </div>

          {/* Start Button */}
          <Button
            onClick={() => router.push("/question-entry")}
            disabled={!isHost}
            className="w-full h-14 rounded-full bg-[#FF8C42] hover:bg-[#FF8C42]/90 text-[#0A0E1A] font-semibold text-lg disabled:opacity-50 disabled:bg-[#8B92A6]"
          >
            {isHost ? "Start Game" : "Waiting for host..."}
          </Button>
        </div>
      </div>
    </div>
  )
}
