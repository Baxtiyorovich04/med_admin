export type Gender = 'male' | 'female'

export interface Meta {
  clinicName: string
  currency: string
  timezone: string
}

export interface District {
  id: string
  name: string
}

export interface Discount {
  id: string
  label: string
  percent: number
}

export interface CardType {
  id: string
  name: string
}

export interface Specialty {
  id: string
  name: string
}

export interface ServiceCategory {
  id: string
  name: string
}

export interface Doctor {
  id: string
  fullName: string
  specialtyId: string
  active: boolean
  serviceIds: string[]
}

export interface Service {
  id: string
  categoryId: string
  specialtyId: string
  name: string
  price: number
  active: boolean
}

export interface Patient {
  id: string
  lastName: string
  firstName: string
  middleName: string
  gender: Gender
  birthDate: string // ISO date
  phone: string
  districtId?: string
  address: string
  pinfl?: string
}

export interface PatientCard {
  id: string
  patientId: string
  cardTypeId: string
  cardNumber: string
  openedAt: string // ISO date
  insurance: boolean
  responsibleDoctorId?: string
}

export interface RegistrationServiceItem {
  serviceId: string
  doctorId: string
  price: number
}

export interface RegistrationDraft {
  id: string
  patientId: string
  discountId?: string
  openNewCard: boolean
  cardTypeId?: string
  cardNumber?: string
  cardOpenedAt?: string
  responsibleDoctorId?: string
  referralInfo?: string
  referralDoctorId?: string
  insurance: boolean
  services: RegistrationServiceItem[]
  subtotal: number
  discountAmount: number
  total: number
  paymentMethod?: 'cash' | 'card' | 'debt'
  paidAmount?: number
  createdAt: string
}

export interface IncomeEntry {
  date: string
  amount: number
  description: string
  paymentMethod?: 'cash' | 'card' | 'debt'
  patientId?: string
}

export interface IncomeEntry {
  date: string
  amount: number
  description: string
  paymentMethod?: 'cash' | 'card' | 'debt'
  patientId?: string
}

