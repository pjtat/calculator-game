"use client"

import { Button } from "@/components/ui/button"
import { NumericRain } from "@/components/numeric-rain"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0E1A] flex flex-col items-center justify-center p-6">
      <NumericRain />

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white">
            Calculator Game <span className="text-4xl">🧮</span>
          </h1>
          <p className="text-[#8B92A6] text-lg">Multiplayer estimation trivia</p>
        </div>

        <div className="w-full space-y-4 pt-8">
          <Link href="/create-game" className="block">
            <Button className="w-full h-14 rounded-full bg-[#FF8C42] hover:bg-[#FF8C42]/90 text-[#0A0E1A] font-semibold text-lg">
              Create Game
            </Button>
          </Link>

          <Link href="/join-game" className="block">
            <Button className="w-full h-14 rounded-full bg-[#FF8C42] hover:bg-[#FF8C42]/90 text-[#0A0E1A] font-semibold text-lg">
              Join Game
            </Button>
          </Link>
        </div>

        <div className="absolute bottom-8 text-[#8B92A6] text-sm">v1.0.0</div>
      </div>
    </div>
  )
}
