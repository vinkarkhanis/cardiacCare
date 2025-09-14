'use client'

import { motion } from 'framer-motion'
import { Heart, Activity, Calendar, Pill, AlertTriangle, TrendingUp } from 'lucide-react'

interface HealthCardProps {
  title: string
  value: string
  unit?: string
  status: 'good' | 'warning' | 'danger'
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
}

const HealthCard = ({ title, value, unit, status, icon, trend }: HealthCardProps) => {
  const statusColors = {
    good: 'from-healing-500 to-healing-600',
    warning: 'from-yellow-500 to-orange-500',
    danger: 'from-accent-500 to-red-600'
  }

  const bgColors = {
    good: 'bg-healing-50 border-healing-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-xl border-2 ${bgColors[status]} shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${statusColors[status]}`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center ${
            trend === 'up' ? 'text-healing-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </div>
    </motion.div>
  )
}

export default function HealthDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-gray-50">
      <HealthCard
        title="Heart Rate"
        value="72"
        unit="bpm"
        status="good"
        trend="stable"
        icon={<Heart className="w-5 h-5" />}
      />
      <HealthCard
        title="Blood Pressure"
        value="120/80"
        unit="mmHg"
        status="good"
        trend="up"
        icon={<Activity className="w-5 h-5" />}
      />
      <HealthCard
        title="Next Medication"
        value="2:00 PM"
        status="warning"
        icon={<Pill className="w-5 h-5" />}
      />
      <HealthCard
        title="Last Check-up"
        value="5 days"
        unit="ago"
        status="good"
        icon={<Calendar className="w-5 h-5" />}
      />
      <HealthCard
        title="Risk Level"
        value="Low"
        status="good"
        icon={<AlertTriangle className="w-5 h-5" />}
      />
      <HealthCard
        title="Weekly Activity"
        value="4/7"
        unit="days"
        status="warning"
        trend="down"
        icon={<TrendingUp className="w-5 h-5" />}
      />
    </div>
  )
}