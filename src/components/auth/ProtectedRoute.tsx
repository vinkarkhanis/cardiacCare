'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Loader } from 'lucide-react'
import HeartWithBeat from '@/components/HeartWithBeat'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-calm-50 via-white to-healing-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-medical-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <HeartWithBeat size="lg" heartColor="text-white" beatColor="text-red-400" />
          </div>
          <Loader className="w-8 h-8 text-medical-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your health dashboard...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return <>{children}</>
}