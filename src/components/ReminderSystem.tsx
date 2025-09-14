'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { X, Calendar, Clock, Pill, AlertCircle, CheckCircle } from 'lucide-react'

interface Reminder {
  id: string
  title: string
  time: string
  type: 'medication' | 'appointment' | 'exercise' | 'checkup'
  priority: 'high' | 'medium' | 'low'
  completed?: boolean
}

interface ReminderCardProps {
  reminder: Reminder
  onComplete: (id: string) => void
  onDismiss: (id: string) => void
}

const ReminderCard = ({ reminder, onComplete, onDismiss }: ReminderCardProps) => {
  const typeIcons = {
    medication: <Pill className="w-5 h-5" />,
    appointment: <Calendar className="w-5 h-5" />,
    exercise: <Clock className="w-5 h-5" />,
    checkup: <AlertCircle className="w-5 h-5" />
  }

  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50'
  }

  const typeColors = {
    medication: 'text-purple-600 bg-purple-100',
    appointment: 'text-blue-600 bg-blue-100',
    exercise: 'text-green-600 bg-green-100',
    checkup: 'text-orange-600 bg-orange-100'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-4 rounded-xl border-2 ${priorityColors[reminder.priority]} shadow-sm ${
        reminder.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg ${typeColors[reminder.type]}`}>
            {typeIcons[reminder.type]}
          </div>
          <div>
            <h3 className={`font-medium ${reminder.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {reminder.title}
            </h3>
            <p className="text-sm text-gray-600 flex items-center mt-1">
              <Clock className="w-3 h-3 mr-1" />
              {reminder.time}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!reminder.completed && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onComplete(reminder.id)}
              className="p-1 text-green-600 hover:bg-green-100 rounded-full transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDismiss(reminder.id)}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default function ReminderSystem() {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      title: 'Take morning blood pressure medication',
      time: '8:00 AM',
      type: 'medication',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Cardiology appointment with Dr. Smith',
      time: 'Today at 2:00 PM',
      type: 'appointment',
      priority: 'high'
    },
    {
      id: '3',
      title: '30-minute walk',
      time: '6:00 PM',
      type: 'exercise',
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Weekly blood pressure check',
      time: 'Tomorrow',
      type: 'checkup',
      priority: 'low'
    }
  ])

  const handleComplete = (id: string) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id ? { ...reminder, completed: true } : reminder
    ))
  }

  const handleDismiss = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Reminders</h2>
        <span className="text-sm text-gray-500">
          {reminders.filter(r => !r.completed).length} pending
        </span>
      </div>
      
      <div className="space-y-3">
        {reminders.map(reminder => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            onComplete={handleComplete}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  )
}