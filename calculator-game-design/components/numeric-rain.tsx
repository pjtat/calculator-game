"use client"

import { useEffect, useRef } from "react"

export function NumericRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(0)

    // Easter egg numbers pool
    const easterEggs = ["6.9", "8.0085", "420", "69", "42"]
    const regularChars = ["0", "1"]

    function draw() {
      if (!ctx || !canvas) return

      ctx.fillStyle = "rgba(10, 14, 26, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        // Occasionally use easter egg numbers
        const useEasterEgg = Math.random() > 0.97
        const text = useEasterEgg
          ? easterEggs[Math.floor(Math.random() * easterEggs.length)]
          : regularChars[Math.floor(Math.random() * regularChars.length)]

        ctx.fillStyle = useEasterEgg ? "#FF8C42" : "#3D4159"
        ctx.globalAlpha = 0.6

        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        drops[i]++
      }
    }

    const interval = setInterval(draw, 50)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.4 }} />
}
