import { NextRequest, NextResponse } from 'next/server'
import { authenticatePatient, listAllPatients } from '@/lib/database/patients'
import { PatientLoginData } from '@/lib/types/patient'

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN API CALLED ===')
    const body: PatientLoginData = await request.json()
    console.log('Received login data:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    if (!body.patientId || !body.password) {
      console.log('Validation failed: Missing patientId or password')
      return NextResponse.json(
        { success: false, error: 'Patient ID and password are required' },
        { status: 400 }
      )
    }

    console.log('Validation passed, calling authenticatePatient...')
    
    // List all patients for debugging
    await listAllPatients()
    
    // Authenticate patient
    const result = await authenticatePatient(body)
    console.log('Authentication result:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('Login successful for patient:', result.user?.patientId)
      return NextResponse.json({
        success: true,
        user: result.user,
        message: 'Login successful'
      })
    } else {
      console.log('Login failed:', result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }
  } catch (error: any) {
    console.error('Login API error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}