'use client'

import { motion } from 'framer-motion'
import { Heart, Sparkles, Brain, Shield } from 'lucide-react'
import HeartWithBeat from './HeartWithBeat'

interface AgentPersonalityProps {
  mood?: 'caring' | 'encouraging' | 'professional' | 'gentle'
}

export default function AgentPersonality({ mood = 'caring' }: AgentPersonalityProps) {
  const personalities = {
    caring: {
      color: 'from-pink-500 to-rose-500',
      icon: <HeartWithBeat size="md" heartColor="text-white" beatColor="text-red-300" />,
      pulse: 'animate-heartbeat'
    },
    encouraging: {
      color: 'from-green-500 to-emerald-500',
      icon: <Sparkles className="w-6 h-6" />,
      pulse: 'animate-pulse'
    },
    professional: {
      color: 'from-blue-500 to-indigo-500',
      icon: <Brain className="w-6 h-6" />,
      pulse: 'animate-pulse-gentle'
    },
    gentle: {
      color: 'from-purple-500 to-violet-500',
      icon: <Shield className="w-6 h-6" />,
      pulse: 'animate-pulse-gentle'
    }
  }

  const currentPersonality = personalities[mood]

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="relative"
    >
      {/* Main avatar */}
      <div className={`w-16 h-16 bg-gradient-to-br ${currentPersonality.color} rounded-full flex items-center justify-center shadow-lg ${currentPersonality.pulse}`}>
        <div className="text-white">
          {currentPersonality.icon}
        </div>
      </div>
      
      {/* Status indicator */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute -bottom-1 -right-1 w-5 h-5 bg-healing-500 rounded-full border-2 border-white flex items-center justify-center"
      >
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      </motion.div>
      
      {/* Ambient glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentPersonality.color} rounded-full opacity-20 scale-110 animate-pulse-gentle`}></div>
    </motion.div>
  )
}