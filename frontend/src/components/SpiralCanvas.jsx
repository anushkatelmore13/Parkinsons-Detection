import { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function SpiralCanvas({ size = 500, interactive = true }) {
  const canvasRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })
  const frameRef = useRef(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = size
    const H = size
    canvas.width = W
    canvas.height = H

    let mx = W / 2
    let my = H / 2

    const unsubX = springX.on('change', (v) => { mx = v + W / 2 })
    const unsubY = springY.on('change', (v) => { my = v + H / 2 })

    const draw = (t) => {
      timeRef.current = t * 0.001
      ctx.clearRect(0, 0, W, H)

      const cx = W / 2
      const cy = H / 2
      const influence = interactive ? 0.06 : 0
      const ox = (mx - cx) * influence
      const oy = (my - cy) * influence

      // Draw multiple spiral layers
      const layers = [
        { color: '#C6FF4A', alpha: 0.7, speed: 1, turns: 5, maxR: W * 0.42, width: 1.5 },
        { color: '#9B7BFF', alpha: 0.5, speed: -0.7, turns: 4, maxR: W * 0.34, width: 1.2 },
        { color: '#C6FF4A', alpha: 0.25, speed: 0.5, turns: 6, maxR: W * 0.48, width: 0.8 },
        { color: '#F3F2EC', alpha: 0.08, speed: -1.2, turns: 3, maxR: W * 0.28, width: 0.6 },
      ]

      layers.forEach((layer) => {
        ctx.beginPath()
        const steps = 1200
        const angle_offset = timeRef.current * layer.speed
        for (let i = 0; i <= steps; i++) {
          const frac = i / steps
          const theta = frac * layer.turns * Math.PI * 2 + angle_offset
          const r = frac * layer.maxR
          const x = cx + ox + r * Math.cos(theta)
          const y = cy + oy + r * Math.sin(theta)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = layer.color
        ctx.globalAlpha = layer.alpha
        ctx.lineWidth = layer.width
        ctx.stroke()
      })

      // Dots at key points
      ctx.globalAlpha = 0.6
      ;[0.25, 0.5, 0.75, 1.0].forEach((frac) => {
        const theta = frac * 5 * Math.PI * 2 + timeRef.current
        const r = frac * W * 0.42
        const x = cx + ox + r * Math.cos(theta)
        const y = cy + oy + r * Math.sin(theta)
        ctx.beginPath()
        ctx.arc(x, y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#C6FF4A'
        ctx.fill()
      })

      ctx.globalAlpha = 1

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frameRef.current)
      unsubX()
      unsubY()
    }
  }, [size, interactive])

  const handleMouseMove = (e) => {
    if (!interactive) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set(e.clientX - rect.left - size / 2)
    mouseY.set(e.clientY - rect.top - size / 2)
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onMouseMove={handleMouseMove}
      className="select-none"
      style={{ width: size, height: size }}
    />
  )
}
