'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeartbeatLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function HeartbeatLoader({ 
  message = "Loading your conversations...", 
  size = 'md',
  className = '' 
}: HeartbeatLoaderProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      heart: 'w-8 h-8',
      container: 'space-y-2',
      text: 'text-sm'
    },
    md: {
      heart: 'w-12 h-12',
      container: 'space-y-4',
      text: 'text-base'
    },
    lg: {
      heart: 'w-16 h-16',
      container: 'space-y-6',
      text: 'text-lg'
    }
  };

  const config = sizeConfig[size];

  // Heartbeat animation - mimics real cardiac rhythm (60-100 BPM)
  const heartbeatVariants = {
    initial: { 
      scale: 1, 
      opacity: 0.7 
    },
    beat1: { 
      scale: 1.25, 
      opacity: 1,
      transition: { duration: 0.08, ease: "easeOut" }
    },
    beat2: { 
      scale: 1.15, 
      opacity: 0.95,
      transition: { duration: 0.08, ease: "easeOut" }
    },
    rest: { 
      scale: 1, 
      opacity: 0.7,
      transition: { duration: 0.4, ease: "easeInOut" }
    }
  };

  // Create realistic heartbeat sequence: lub-dub pattern
  const heartbeatSequence = [
    "initial",
    "beat1",    // First beat (systole)
    "rest",
    "beat2",    // Second beat (diastole) 
    "rest",
    "rest",     // Pause between heartbeats
    "rest"
  ];

  // Pulse glow animation
  const glowVariants = {
    initial: { 
      boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)" 
    },
    pulse: { 
      boxShadow: [
        "0 0 0 0 rgba(239, 68, 68, 0.7)",
        "0 0 0 10px rgba(239, 68, 68, 0)",
        "0 0 0 20px rgba(239, 68, 68, 0)"
      ],
      transition: { 
        duration: 1.0, // Match heartbeat cycle
        repeat: Infinity,
        repeatDelay: 0.2
      }
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${config.container} ${className}`}>
      {/* Heartbeat Animation Container */}
      <div className="relative">
        {/* Pulse Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          variants={glowVariants}
          initial="initial"
          animate="pulse"
        />
        
        {/* Main Heart Icon */}
        <motion.div
          className={`${config.heart} text-red-500 relative z-10`}
          variants={heartbeatVariants}
          initial="initial"
          animate={heartbeatSequence}
          transition={{
            duration: 0.833, // ~72 BPM (60/72 = 0.833 seconds per beat)
            repeat: Infinity,
            repeatDelay: 0.167, // Short pause between cycles
            times: [0, 0.1, 0.15, 0.25, 0.3, 0.5, 1] // More realistic timing
          }}
        >
          <Heart className="w-full h-full fill-current drop-shadow-lg" />
        </motion.div>
      </div>

      {/* Loading Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className={`${config.text} text-gray-600 font-medium text-center max-w-xs`}
      >
        {message}
      </motion.div>

      {/* Animated Dots */}
      <motion.div 
        className="flex space-x-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-red-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2
            }}
          />
        ))}
      </motion.div>

      {/* ECG-like line animation (optional visual enhancement) */}
      <motion.div 
        className="w-32 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent mt-4"
        animate={{
          scaleX: [0, 1, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}

// Named exports for flexibility
export { HeartbeatLoader };

// Preset configurations for common use cases
export const ConversationLoader = () => (
  <HeartbeatLoader 
    message="Loading your conversation history..." 
    size="md"
    className="py-8"
  />
);

export const ChatLoader = () => (
  <HeartbeatLoader 
    message="Processing your message..." 
    size="sm"
    className="py-4"
  />
);

export const AppLoader = () => (
  <HeartbeatLoader 
    message="Initializing Cardiac Health Assistant..." 
    size="lg"
    className="py-12"
  />
);