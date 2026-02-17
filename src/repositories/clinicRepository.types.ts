import type {
  Meta,
  District,
  Discount,
  CardType,
  Specialty,
  ServiceCategory,
  Doctor,
  Service,
  Patient,
  RegistrationDraft,
} from '../types/clinic'

export interface Dictionaries {
  meta: Meta
  districts: District[]
  discounts: Discount[]
  cardTypes: CardType[]
  specialties: Specialty[]
  serviceCategories: ServiceCategory[]
}

export interface ClinicRepository {
  getDictionaries(): Promise<Dictionaries>
  getDoctors(): Promise<Doctor[]>
  getServices(): Promise<Service[]>

  searchPatientsByPhone(phone: string): Promise<Patient[]>
  createOrUpdatePatient(patient: Omit<Patient, 'id'> & Partial<Pick<Patient, 'id'>>): Promise<Patient>

  createRegistrationDraft(
    draft: Omit<RegistrationDraft, 'id' | 'createdAt'>,
  ): Promise<RegistrationDraft>
}

