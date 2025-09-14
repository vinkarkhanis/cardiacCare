import bcrypt from 'bcryptjs'
import { getDatabase } from './cosmos'
import { Patient, PatientSignupData, PatientLoginData, AuthUser } from '../types/patient'

// Generate a random alphanumeric patient ID
export function generatePatientId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'PT'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Create a new patient
export async function createPatient(patientData: PatientSignupData): Promise<{ success: boolean; patientId?: string; error?: string }> {
  try {
    console.log('Starting patient creation process...')
    const { container } = await getDatabase()
    console.log('Database connection established')
    
    const patientId = generatePatientId()
    console.log('Generated patient ID:', patientId)

    const hashedPassword = await hashPassword(patientData.password)
    console.log('Password hashed successfully')
    
    const patient: Patient = {
      id: patientId,  // Cosmos DB requires an 'id' field
      patientId,
      first_name: patientData.first_name,
      last_name: patientData.last_name,
      email: patientData.email,
      mobile_number: patientData.mobile_number,
      date_of_birth: patientData.date_of_birth,
      age: patientData.age,
      address: patientData.address,
      patient_problems: patientData.patient_problems,
      password: hashedPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Creating patient document:', JSON.stringify(patient, null, 2))
    const result = await container.items.create(patient)
    console.log('Patient created successfully in Cosmos DB:', result.resource?.patientId)
    
    // Verify the patient was created by trying to read it back immediately
    try {
      console.log('Verifying patient creation by reading back...')
      const { resource: verifyPatient } = await container.item(patientId, patientId).read<Patient>()
      console.log('Verification successful - patient exists:', verifyPatient ? 'YES' : 'NO')
      if (verifyPatient) {
        console.log('Verified patient data:', {
          id: verifyPatient.patientId,
          name: `${verifyPatient.first_name} ${verifyPatient.last_name}`
        })
      }
    } catch (verifyError: any) {
      console.error('Verification failed - could not read back created patient:', verifyError.code, verifyError.message)
    }
    
    return { success: true, patientId }
  } catch (error: any) {
    console.error('Error creating patient:', error)
    console.error('Error stack:', error.stack)
    return { success: false, error: error.message || 'Failed to create patient' }
  }
}

// Authenticate patient
export async function authenticatePatient(loginData: PatientLoginData): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    console.log('=== AUTHENTICATION ATTEMPT ===')
    console.log('Login data:', JSON.stringify(loginData, null, 2))
    
    const { container } = await getDatabase()
    console.log('Database connection established for authentication')
    
    console.log('Attempting to read patient with ID:', loginData.patientId)
    console.log('Querying: container.item(id, partitionKey) = container.item(', loginData.patientId, ',', loginData.patientId, ')')
    const { resource: patient } = await container.item(loginData.patientId, loginData.patientId).read<Patient>()
    console.log('Patient query result:', patient ? 'Patient found' : 'Patient not found')
    console.log('Raw patient data from DB:', patient)
    
    if (!patient) {
      console.log('Patient not found in database')
      return { success: false, error: 'Patient not found' }
    }
    
    console.log('Patient found, verifying password...')
    const isValidPassword = await verifyPassword(loginData.password, patient.password)
    console.log('Password verification result:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('Password verification failed')
      return { success: false, error: 'Invalid password' }
    }

    const user: AuthUser = {
      patientId: patient.patientId,
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      mobile_number: patient.mobile_number,
      age: patient.age,
      address: patient.address,
      patient_problems: patient.patient_problems
    }

    console.log('Authentication successful for patient:', patient.patientId)
    return { success: true, user }
  } catch (error: any) {
    console.error('Error authenticating patient:', error)
    console.error('Error code:', error.code)
    console.error('Error stack:', error.stack)
    if (error.code === 404) {
      return { success: false, error: 'Patient not found' }
    }
    return { success: false, error: error.message || 'Authentication failed' }
  }
}

// Get patient by ID
export async function getPatientById(patientId: string): Promise<{ success: boolean; patient?: AuthUser; error?: string }> {
  try {
    const { container } = await getDatabase()
    
    const { resource: patient } = await container.item(patientId, patientId).read<Patient>()
    
    if (!patient) {
      return { success: false, error: 'Patient not found' }
    }

    const patientData: AuthUser = {
      patientId: patient.patientId,
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      mobile_number: patient.mobile_number,
      age: patient.age,
      address: patient.address,
      patient_problems: patient.patient_problems
    }

    return { success: true, patient: patientData }
  } catch (error: any) {
    console.error('Error getting patient:', error)
    if (error.code === 404) {
      return { success: false, error: 'Patient not found' }
    }
    return { success: false, error: error.message || 'Failed to get patient' }
  }
}

// Debug function to list all patients
export async function listAllPatients(): Promise<void> {
  try {
    console.log('=== LISTING ALL PATIENTS ===')
    const { container } = await getDatabase()
    
    const querySpec = {
      query: "SELECT * FROM c"
    }
    
    const { resources: patients } = await container.items.query(querySpec).fetchAll()
    console.log(`Found ${patients.length} patients in database:`)
    
    patients.forEach((patient: any, index: number) => {
      console.log(`${index + 1}. ID: ${patient.id}, PatientID: ${patient.patientId}, Name: ${patient.first_name} ${patient.last_name}, Email: ${patient.email}, Mobile: ${patient.mobile_number}`)
    })
    
    if (patients.length === 0) {
      console.log('No patients found in database!')
    }
  } catch (error: any) {
    console.error('Error listing patients:', error)
  }
}