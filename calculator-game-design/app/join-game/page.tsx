"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NumericRain } from "@/components/numeric-rain"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function JoinGamePage() {
  const [activeTab, setActiveTab] = useState<"join" | "host">("join")
  const [roomCode, setRoomCode] = useState("")
  const [playerName, setPlayerName] = useState("")
  const router = useRouter()

  const handleJoin = () => {
    if (roomCode && playerName) {
      router.push("/lobby")
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0E1A] flex flex-col p-6">
      <NumericRain />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <Link href="/" className="inline-block mb-8">
          <Button variant="ghost" className="text-white hover:bg-white/10">
            ← Back
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-8 border-b border-[#3D4159] pb-2">
            <button
              onClick={() => setActiveTab("join")}
              className={`text-lg font-semibold pb-2 transition-colors ${
                activeTab === "join" ? "text-white border-b-2 border-[#FF8C42]" : "text-[#8B92A6]"
              }`}
            >
              Join Game
            </button>
            <button
              onClick={() => setActiveTab("host")}
              className={`text-lg font-semibold pb-2 transition-colors ${
                activeTab === "host" ? "text-white border-b-2 border-[#FF8C42]" : "text-[#8B92A6]"
              }`}
            >
              Host game
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-white font-medium">Room code</label>
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="h-14 bg-[#3D4159] border-none text-white placeholder:text-[#8B92A6] rounded-xl font-mono text-lg"
                maxLength={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">Your name</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your nickname"
                className="h-14 bg-[#3D4159] border-none text-white placeholder:text-[#8B92A6] rounded-xl text-lg"
              />
            </div>

            <Button
              onClick={handleJoin}
              disabled={!roomCode || !playerName}
              className="w-full h-14 rounded-full bg-[#FF8C42] hover:bg-[#FF8C42]/90 text-[#0A0E1A] font-semibold text-lg mt-8 disabled:opacity-50"
            >
              JOIN GAME
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
