export interface Patient {
  id: string  // Cosmos DB document ID
  patientId: string
  first_name: string
  last_name: string
  email: string
  mobile_number: string
  date_of_birth: string
  age: string
  address: string
  patient_problems: string
  password: string
  created_at?: string
  updated_at?: string
}

export interface PatientSignupData {
  first_name: string
  last_name: string
  email: string
  mobile_number: string
  date_of_birth: string
  age: string
  address: string
  patient_problems: string
  password: string
}

export interface PatientLoginData {
  patientId: string
  password: string
}

export interface AuthUser {
  patientId: string
  first_name: string
  last_name: string
  email: string
  mobile_number: string
  age: string
  address: string
  patient_problems: string
}