import React from 'react'
import { Heart, Activity } from 'lucide-react'

interface HeartWithBeatProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showBeat?: boolean
  heartColor?: string
  beatColor?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-10 h-10'
}

const beatSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6', 
  xl: 'w-8 h-8'
}

export default function HeartWithBeat({ 
  size = 'md', 
  className = '', 
  showBeat = true,
  heartColor = 'text-white',
  beatColor = 'text-red-500'
}: HeartWithBeatProps) {
  const heartSize = sizeClasses[size]
  const beatSize = beatSizeClasses[size]
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Heart Icon */}
      <Heart className={`${heartSize} ${heartColor} animate-heartbeat fill-current`} />
      
      {/* Heartbeat Line */}
      {showBeat && (
        <Activity 
          className={`${beatSize} ${beatColor} absolute -bottom-0.5 -right-0.5 animate-heartbeat-line`}
        />
      )}
    </div>
  )
}