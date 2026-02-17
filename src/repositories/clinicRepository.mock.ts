import dbJson from '../../db.json'
import type {
  CardType,
  Discount,
  Doctor,
  District,
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
}

const LOCAL_STORAGE_KEY = 'clinic_db_mock'

function loadInitialDb(): DbShape {
  const fromStorage = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  if (fromStorage) {
    try {
      return JSON.parse(fromStorage) as DbShape
    } catch {
      // ignore parsing errors and fall back to bundled json
    }
  }
  return dbJson as DbShape
}

let db: DbShape = loadInitialDb()

function persistDb() {
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
    await delay()
    return {
      meta: db.meta,
      districts: db.districts,
      discounts: db.discounts,
      cardTypes: db.cardTypes,
      specialties: db.specialties,
      serviceCategories: db.serviceCategories,
    }
  },

  async getDoctors(): Promise<Doctor[]> {
    await delay()
    return db.doctors.filter((d) => d.active)
  },

  async getServices(): Promise<Service[]> {
    await delay()
    return db.services.filter((s) => s.active)
  },

  async searchPatientsByPhone(phone: string): Promise<Patient[]> {
    await delay()
    const normalized = phone.replace(/\D/g, '')
    return db.patients.filter((p) => p.phone.replace(/\D/g, '') === normalized)
  },

  async createOrUpdatePatient(
    patient: Omit<Patient, 'id'> & Partial<Pick<Patient, 'id'>>,
  ): Promise<Patient> {
    await delay()
    if (patient.id) {
      const index = db.patients.findIndex((p) => p.id === patient.id)
      if (index >= 0) {
        const updated: Patient = { ...db.patients[index], ...patient }
        db.patients[index] = updated
        persistDb()
        return updated
      }
    }

    const created: Patient = {
      ...patient,
      id: generateId('pat'),
    }
    db.patients.push(created)
    persistDb()
    return created
  },

  async createRegistrationDraft(
    draft: Omit<RegistrationDraft, 'id' | 'createdAt'>,
  ): Promise<RegistrationDraft> {
    await delay()
    const created: RegistrationDraft = {
      ...draft,
      id: generateId('reg'),
      createdAt: new Date().toISOString(),
    }
    db.registrationDrafts.push(created)
    persistDb()
    return created
  },
}

// TODO: заменить mock‑реализацию на реальные HTTP‑запросы к backend API

