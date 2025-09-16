'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, User, Calendar, MapPin, FileText, Lock, CheckCircle, AlertCircle, Loader, Mail, Phone } from 'lucide-react'
import HeartWithBeat from '@/components/HeartWithBeat'
import Link from 'next/link'
import { PatientSignupData } from '@/lib/types/patient'

interface SuccessModalProps {
  isOpen: boolean
  patientId: string
  onClose: () => void
}

const SuccessModal = ({ isOpen, patientId, onClose }: SuccessModalProps) => {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-healing-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-healing-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <div className="bg-medical-50 border border-medical-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Your username for this account is:</p>
            <p className="text-xl font-mono font-bold text-medical-700 bg-medical-100 px-4 py-2 rounded-lg">{patientId}</p>
          </div>
          <p className="text-gray-600 mb-6">
            Please save this User ID safely. You&apos;ll need it to log into your account.
          </p>
          <Link
            href="/login"
            onClick={onClose}
            className="w-full bg-gradient-to-r from-accent-500 to-medical-500 text-white py-3 px-6 rounded-xl font-medium hover:shadow-lg transition-all duration-200 inline-block text-center"
          >
            Continue to Login
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function SignupPage() {
  const [formData, setFormData] = useState<PatientSignupData>({
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    date_of_birth: '',
    age: '',
    address: '',
    patient_problems: '',
    password: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [generatedPatientId, setGeneratedPatientId] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age.toString()
  }

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateOfBirth = e.target.value
    setFormData(prev => ({
      ...prev,
      date_of_birth: dateOfBirth,
      age: dateOfBirth ? calculateAge(dateOfBirth) : ''
    }))
    setError('')
  }

  const validateForm = () => {
    const requiredFields = ['first_name', 'last_name', 'email', 'mobile_number', 'date_of_birth', 'address', 'patient_problems', 'password']
    const missingFields = requiredFields.filter(field => !formData[field as keyof PatientSignupData])
    
    if (missingFields.length > 0) {
      setError('Please fill in all required fields')
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    // Mobile number validation
    const mobileRegex = /^[\d\-\+\(\)\s]+$/
    if (!mobileRegex.test(formData.mobile_number) || formData.mobile_number.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid mobile number (at least 10 digits)')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedPatientId(data.patientId)
        setShowSuccessModal(true)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-healing-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-accent-500 to-medical-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <HeartWithBeat size="xl" heartColor="text-white" beatColor="text-red-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join CardiacCare</h1>
          <p className="text-gray-600">Create your account to start managing your heart health</p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-calm-200"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            {/* Email and Mobile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your mobile number"
                  required
                />
              </div>
            </div>

            {/* Date of Birth and Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleDateOfBirthChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="text"
                  value={formData.age}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Auto-calculated"
                  readOnly
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your complete address"
                required
              />
            </div>

            {/* Patient Problems */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Cardiac Health Problems *
              </label>
              <textarea
                name="patient_problems"
                value={formData.patient_problems}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Describe your cardiac health conditions, symptoms, or concerns..."
                required
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200"
                  placeholder="Create a secure password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-accent-500 to-medical-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </motion.button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-medical-600 hover:text-medical-700 font-semibold">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        patientId={generatedPatientId}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  )
}