import { NextRequest, NextResponse } from 'next/server'
import { createPatient, listAllPatients } from '@/lib/database/patients'
import { PatientSignupData } from '@/lib/types/patient'

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIGNUP API CALLED ===')
    const body: PatientSignupData = await request.json()
    console.log('Received signup data:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'mobile_number', 'date_of_birth', 'age', 'address', 'patient_problems', 'password']
    const missingFields = requiredFields.filter(field => !body[field as keyof PatientSignupData])
    
    if (missingFields.length > 0) {
      console.log('Validation failed: Missing required fields:', missingFields)
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate password strength
    if (body.password.length < 6) {
      console.log('Validation failed: Password too short')
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.log('Validation failed: Invalid email format')
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate mobile number format (basic validation)
    const mobileRegex = /^[\d\-\+\(\)\s]+$/
    if (!mobileRegex.test(body.mobile_number) || body.mobile_number.replace(/\D/g, '').length < 10) {
      console.log('Validation failed: Invalid mobile number')
      return NextResponse.json(
        { success: false, error: 'Please enter a valid mobile number (at least 10 digits)' },
        { status: 400 }
      )
    }

    console.log('Validation passed, calling createPatient...')
    // Create patient
    const result = await createPatient(body)
    console.log('CreatePatient result:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('Patient created successfully with ID:', result.patientId)
      
      // List all patients for debugging
      await listAllPatients()
      
      return NextResponse.json({
        success: true,
        patientId: result.patientId,
        message: 'Patient created successfully'
      })
    } else {
      console.log('Patient creation failed:', result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Signup API error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}