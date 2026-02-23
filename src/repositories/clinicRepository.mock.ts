import type {
  CardType,
  Discount,
  Doctor,
  District,
  IncomeEntry,
  Meta,
  Patient,
  PatientCard,
  RegistrationDraft,
  Service,
  ServiceCategory,
  Specialty,
} from '../types/clinic'
import type { ClinicRepository, Dictionaries } from './clinicRepository.types'

type DbShape = {
  meta: Meta
  districts: District[]
  discounts: Discount[]
  cardTypes: CardType[]
  specialties: Specialty[]
  serviceCategories: ServiceCategory[]
  doctors: Doctor[]
  services: Service[]
  patients: Patient[]
  patientCards: PatientCard[]
  registrationDrafts: RegistrationDraft[]
  income: IncomeEntry[]
}

const LOCAL_STORAGE_KEY = 'clinic_db_mock'
let defaultDb: DbShape | null = null

async function loadDefaultDb(): Promise<DbShape> {
  if (defaultDb) return defaultDb
  try {
    const response = await fetch('/db.json')
    if (!response.ok) throw new Error('Failed to load db.json')
    const data = await response.json() as DbShape
    defaultDb = data
    return data
  } catch (error) {
    console.error('Error loading db.json from public folder:', error)
    throw error
  }
}

async function loadInitialDb(): Promise<DbShape> {
  const fromStorage = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  if (fromStorage) {
    try {
      const parsed = JSON.parse(fromStorage) as DbShape
      if (!Array.isArray(parsed.income)) parsed.income = []
      return parsed
    } catch {
      // ignore parsing errors and fall back to fetched json
    }
  }
  const fromDefault = await loadDefaultDb()
  if (!Array.isArray(fromDefault.income)) fromDefault.income = []
  return fromDefault
}

let db: DbShape | null = null

async function initializeDb(): Promise<DbShape> {
  if (db) return db
  db = await loadInitialDb()
  return db
}

function persistDb() {
  if (!db) return
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db))
  } catch {
    // non‑critical in mock implementation
  }
}

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export const clinicMockRepository: ClinicRepository = {
  async getDictionaries(): Promise<Dictionaries> {
    const database = await initializeDb()
    await delay()
    return {
      meta: database.meta,
      districts: database.districts,
      discounts: database.discounts,
      cardTypes: database.cardTypes,
      specialties: database.specialties,
      serviceCategories: database.serviceCategories,
    }
  },

  async getDoctors(): Promise<Doctor[]> {
    const database = await initializeDb()
    await delay()
    return database.doctors.filter((d) => d.active)
  },

  async getServices(): Promise<Service[]> {
    const database = await initializeDb()
    await delay()
    return database.services.filter((s) => s.active)
  },

  async getPatients(): Promise<Patient[]> {
    const database = await initializeDb()
    await delay()
    return database.patients
  },

  async searchPatientsByPhone(phone: string): Promise<Patient[]> {
    const database = await initializeDb()
    await delay()
    const normalized = phone.replace(/\D/g, '')
    return database.patients.filter((p) => p.phone.replace(/\D/g, '') === normalized)
  },

  async createOrUpdatePatient(
    patient: Omit<Patient, 'id'> & Partial<Pick<Patient, 'id'>>,
  ): Promise<Patient> {
    const database = await initializeDb()
    await delay()
    if (patient.id) {
      const index = database.patients.findIndex((p) => p.id === patient.id)
      if (index >= 0) {
        const updated: Patient = { ...database.patients[index], ...patient }
        database.patients[index] = updated
        persistDb()
        return updated
      }
    }

    const created: Patient = {
      ...patient,
      id: generateId('pat'),
    }
    database.patients.push(created)
    persistDb()
    return created
  },

  async createRegistrationDraft(
    draft: Omit<RegistrationDraft, 'id' | 'createdAt'>,
  ): Promise<RegistrationDraft> {
    const database = await initializeDb()
    await delay()
    const created: RegistrationDraft = {
      ...draft,
      id: generateId('reg'),
      createdAt: new Date().toISOString(),
    }
    database.registrationDrafts.push(created)
    persistDb()
    return created
  },

  async getIncome(): Promise<IncomeEntry[]> {
    const database = await initializeDb()
    await delay()
    return database.income ?? []
  },

  async addIncomeEntries(entries: IncomeEntry[]): Promise<void> {
    const database = await initializeDb()
    await delay()
    database.income.push(...entries)
    persistDb()
  },
}

export const clinicRepository = {
  ...clinicMockRepository,

  // Extra method for SettingsPage
  async loadDb() {
    return await initializeDb()
  },
}

