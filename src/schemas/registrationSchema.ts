import { z } from 'zod'

export const registrationSchema = z
  .object({
    lastName: z.string().min(1, 'Введите фамилию'),
    firstName: z.string().min(1, 'Введите имя'),
    middleName: z.string().min(1, 'Введите отчество'),
    birthDate: z.string().min(1, 'Укажите дату рождения'),
    gender: z.enum(['male', 'female'], {
      required_error: 'Выберите пол',
    }),
    phone: z
      .string()
      .min(1, 'Введите телефон')
      .regex(/^\+998\d{9}$/, 'Телефон в формате +998XXXXXXXXX'),
    districtId: z.string().optional().or(z.literal('')),
    address: z.string().min(1, 'Введите адрес'),

    discountId: z.string().optional().or(z.literal('')),
    referralInfo: z.string().optional(),
    hasReferral: z.boolean(),
    referralDoctorId: z.string().optional().or(z.literal('')),
    insurance: z.boolean(),
    openNewCard: z.boolean(),

    cardTypeId: z.string().optional().or(z.literal('')),
    cardNumber: z.string().optional(),
    cardOpenedAt: z.string().optional(),
    responsibleDoctorId: z.string().optional().or(z.literal('')),

    serviceCategoryId: z.string(),
    specialtyId: z.string(),
    doctorId: z.string().optional().or(z.literal('')),
    selectedServiceIds: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.hasReferral && !data.referralDoctorId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['referralDoctorId'],
        message: 'Укажите ID врача',
      })
    }

    if (data.openNewCard) {
      if (!data.cardTypeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cardTypeId'],
          message: 'Выберите тип карты',
        })
      }
      if (!data.cardNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cardNumber'],
          message: 'Введите номер карты',
        })
      }
      if (!data.cardOpenedAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cardOpenedAt'],
          message: 'Укажите дату открытия',
        })
      }
    }
  })

export type RegistrationFormValues = z.infer<typeof registrationSchema>

