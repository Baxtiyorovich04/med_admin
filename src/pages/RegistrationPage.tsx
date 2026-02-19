import {
  Alert,
  Box,
  Grid2 as Grid,
  Paper,
  Stack,
  Typography,
  Button,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { clinicMockRepository } from '../repositories/clinicRepository.mock'
import { registrationSchema, type RegistrationFormValues } from '../schemas/registrationSchema'
import { PatientFormSection } from '../components/registration/PatientFormSection'
import { CardSection } from '../components/registration/CardSection'
import { ServicePickerSection } from '../components/registration/ServicePickerSection'
import { SelectedSummary } from '../components/registration/SelectedSummary'
import { ReceiptDialog } from '../components/registration/ReceiptDialog'
import type { Discount, Patient, RegistrationDraft } from '../types/clinic'

export function RegistrationPage() {
  const navigate = useNavigate()
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [completedDraft, setCompletedDraft] = useState<RegistrationDraft | null>(null)
  const [completedPatient, setCompletedPatient] = useState<Patient | null>(null)

  const {
    data: dictionaries,
    isLoading: isDictLoading,
    isError: isDictError,
  } = useQuery({
    queryKey: ['clinic', 'dictionaries'],
    queryFn: () => clinicMockRepository.getDictionaries(),
  })

  const { data: doctors = [] } = useQuery({
    queryKey: ['clinic', 'doctors'],
    queryFn: () => clinicMockRepository.getDoctors(),
    enabled: !!dictionaries,
  })

  const { data: services = [] } = useQuery({
    queryKey: ['clinic', 'services'],
    queryFn: () => clinicMockRepository.getServices(),
    enabled: !!dictionaries,
  })

  const searchPatientMutation = useMutation({
    mutationKey: ['clinic', 'searchPatient'],
    mutationFn: (phone: string) => clinicMockRepository.searchPatientsByPhone(phone),
  })

  const saveRegistrationMutation = useMutation({
    mutationKey: ['clinic', 'saveRegistration'],
    mutationFn: async (values: RegistrationFormValues) => {
      const patientPayload = {
        id: undefined,
        lastName: values.lastName,
        firstName: values.firstName,
        middleName: values.middleName,
        gender: values.gender,
        birthDate: values.birthDate,
        phone: values.phone,
        pinfl: values.pinfl,
        districtId: values.districtId || undefined,
        address: values.address,
      }

      const patient = await clinicMockRepository.createOrUpdatePatient(patientPayload)

      const selectedServices = services.filter((s) => values.selectedServiceIds.includes(s.id))
      const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0)

      const discount: Discount | undefined =
        dictionaries?.discounts.find((d) => d.id === values.discountId) ??
        dictionaries?.discounts.find((d) => d.id === 'disc_none')

      const discountPercent = discount?.percent ?? 0
      const discountAmount = Math.round((subtotal * discountPercent) / 100)
      const total = subtotal - discountAmount

      const draft = await clinicMockRepository.createRegistrationDraft({
        patientId: patient.id,
        discountId: discount?.id,
        openNewCard: values.openNewCard,
        cardTypeId: values.openNewCard ? values.cardTypeId || undefined : undefined,
        cardNumber: values.openNewCard ? values.cardNumber || undefined : undefined,
        cardOpenedAt: values.openNewCard ? values.cardOpenedAt || undefined : undefined,
        responsibleDoctorId: values.responsibleDoctorId || undefined,
        referralInfo: values.referralInfo || undefined,
        referralDoctorId: values.hasReferral ? values.referralDoctorId || undefined : undefined,
        insurance: values.insurance,
        services: selectedServices.map((s) => ({
          serviceId: s.id,
          doctorId: values.doctorId || '',
          price: s.price,
        })),
        subtotal,
        discountAmount,
        total,
      })

      return { patient, draft }
    },
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      middleName: '',
      birthDate: '',
      gender: null as any,
      phone: '',
      pinfl: '',
      districtId: '',
      address: '',
      discountId: 'disc_none',
      referralInfo: '',
      hasReferral: false,
      referralDoctorId: '',
      insurance: false,
      openNewCard: true,
      cardTypeId: '',
      cardNumber: '',
      cardOpenedAt: '',
      responsibleDoctorId: '',
      serviceCategoryId: 'cat_reception',
      specialtyId: 'spec_ent',
      doctorId: '',
      selectedServiceIds: [],
    },
  })

  const hasReferral = watch('hasReferral')
  const openNewCard = watch('openNewCard')
  const selectedServiceIds = watch('selectedServiceIds')
  const discountId = watch('discountId')
  const cardTypeId = watch('cardTypeId')

  // Auto-generate card number when card type changes
  useEffect(() => {
    if (cardTypeId && openNewCard) {
      const prefix = cardTypeId === 'card_standard' ? 'S' : cardTypeId === 'card_child' ? 'C' : 'X'
      const random = Math.random().toString(36).substring(2, 8).toUpperCase()
      const timestamp = Date.now().toString().slice(-4)
      const generatedCardNumber = `${prefix}-${random}${timestamp}`
      setValue('cardNumber', generatedCardNumber)
    }
  }, [cardTypeId, openNewCard, setValue])

  const selectedDiscount =
    dictionaries?.discounts.find((d) => d.id === discountId) ??
    dictionaries?.discounts.find((d) => d.id === 'disc_none')

  const foundPatient: Patient | undefined =
    searchPatientMutation.data && searchPatientMutation.data.length === 1
      ? searchPatientMutation.data[0]
      : undefined

  const handleFillFromHistory = (patient: Patient) => {
    reset({
      ...watch(),
      lastName: patient.lastName,
      firstName: patient.firstName,
      middleName: patient.middleName,
      birthDate: patient.birthDate,
      gender: patient.gender,
      phone: patient.phone,
      pinfl: patient.pinfl || '',
      districtId: patient.districtId ?? '',
      address: patient.address,
    })
  }

  const onSubmitSave = handleSubmit(async (values) => {
    const result = await saveRegistrationMutation.mutateAsync(values)
    setCompletedDraft(result.draft)
    setCompletedPatient(result.patient)
    setReceiptOpen(true)
  })

  const onSubmitSaveAndGoCash = handleSubmit(async (values) => {
    const result = await saveRegistrationMutation.mutateAsync(values)
    navigate('/cash', { state: { registrationDraftId: result.draft.id } })
  })

  const handlePrintReceipt = async () => {
    if (!completedDraft || !completedPatient) return

    // Fetch data needed for printing
    const services = await clinicMockRepository.getServices()
    const doctors = await clinicMockRepository.getDoctors()

    const getDoctorName = (doctorId: string) => {
      return doctors.find((d) => d.id === doctorId)?.fullName || 'Not assigned'
    }

    const getServiceName = (serviceId: string) => {
      return services.find((s) => s.id === serviceId)?.name || 'Unknown Service'
    }

    const fullName = `${completedPatient.lastName} ${completedPatient.firstName} ${completedPatient.middleName || ''}`.trim()
    const today = new Date().toLocaleDateString('ru-RU')

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const servicesHtml = completedDraft.services
      .map(
        (service, idx) =>
          `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${getServiceName(service.serviceId)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${getDoctorName(service.doctorId)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: 600;">${service.price.toLocaleString('ru-RU')} UZS</td>
      </tr>`,
      )
      .join('')

    const discountRow =
      completedDraft.discountAmount > 0
        ? `<tr>
        <td colspan="2" style="padding: 8px; text-align: right;">Скидка</td>
        <td style="padding: 8px; text-align: right; color: #d32f2f; font-weight: 600;">-${completedDraft.discountAmount.toLocaleString('ru-RU')} UZS</td>
      </tr>`
        : ''

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Квитанция о регистрации</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #667eea;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #667eea;
            font-size: 24px;
          }
          .clinic-name {
            color: #666;
            font-size: 12px;
            margin-top: 5px;
          }
          .patient-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .patient-info h3 {
            margin: 0 0 10px 0;
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            font-weight: 600;
          }
          .patient-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          .section-title {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            font-weight: 600;
            margin-top: 15px;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #f5f5f5;
            padding: 10px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            border-bottom: 1px solid #ddd;
          }
          td {
            padding: 8px;
            font-size: 13px;
          }
          .total-box {
            background: #f0f4ff;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #667eea;
            margin-bottom: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
          }
          .total-final {
            display: flex;
            justify-content: space-between;
            padding-top: 10px;
            border-top: 1px solid #667eea;
            font-size: 16px;
            font-weight: 700;
            color: #667eea;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #999;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Квитанция о регистрации</h1>
          <p class="clinic-name">МедиЦентр</p>
        </div>

        <div class="patient-info">
          <h3>Пациент</h3>
          <p><strong>${fullName}</strong></p>
          <p>Телефон: ${completedPatient.phone}</p>
          <p>Дата: ${today}</p>
        </div>

        <div class="section-title">Услуги</div>
        <table>
          <thead>
            <tr>
              <th>Услуга</th>
              <th>Врач</th>
              <th style="text-align: right;">Цена</th>
            </tr>
          </thead>
          <tbody>
            ${servicesHtml}
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row">
            <span>Сумма:</span>
            <span>${completedDraft.subtotal.toLocaleString('ru-RU')} UZS</span>
          </div>
          ${discountRow ? `<div class="total-row"><span>Скидка:</span><span style="color: #d32f2f;">-${completedDraft.discountAmount.toLocaleString('ru-RU')} UZS</span></div>` : ''}
          <div class="total-final">
            <span>ИТОГО:</span>
            <span>${completedDraft.total.toLocaleString('ru-RU')} UZS</span>
          </div>
        </div>

        <div class="footer">
          <p>Спасибо за посещение! Квитанция сгенерирована автоматически.</p>
          <p style="margin-top: 10px; font-size: 10px;">Дата и время: ${new Date().toLocaleString('ru-RU')}</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  if (isDictLoading) {
    return <Typography>Загрузка данных...</Typography>
  }

  if (isDictError || !dictionaries) {
    return <Typography color="error">Ошибка загрузки справочников.</Typography>
  }

  return (
    <>
      <ReceiptDialog
        open={receiptOpen}
        draft={completedDraft}
        patient={completedPatient}
        onClose={() => {
          setReceiptOpen(false)
          reset()
          navigate('/patients')
        }}
        onPrint={handlePrintReceipt}
      />
      <Stack spacing={4}>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Регистрация пациента
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Заполните информацию о пациенте и выберите необходимые услуги
          </Typography>
          <Alert severity="warning" icon={false}>
            <Typography variant="body2" fontWeight={500}>
              ✓ Поля, отмеченные знаком *, обязательны для заполнения
            </Typography>
          </Alert>
        </Box>

        <Paper
          sx={{
            p: 3,
            borderTop: '4px solid #1976d2',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                mr: 2,
              }}
            >
              1
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Личные данные пациента
            </Typography>
          </Box>
          <PatientFormSection
            districts={dictionaries.districts}
            register={register}
            errors={errors}
            control={control}
            watch={watch}
            foundPatient={foundPatient}
            onFillFromHistory={handleFillFromHistory}
            onPhoneBlur={(phone) => searchPatientMutation.mutate(phone)}
          />
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderTop: '4px solid #d32f2f',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1976d2 0%, #d32f2f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                mr: 2,
              }}
            >
              2
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Карта пациента
            </Typography>
          </Box>
          <CardSection
            discounts={dictionaries.discounts}
            cardTypes={dictionaries.cardTypes}
            doctors={doctors}
            register={register}
            errors={errors}
            control={control}
            watch={watch}
            hasReferral={hasReferral}
            openNewCard={openNewCard}
          />
        </Paper>

        <Grid container spacing={3} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              sx={{
                p: 3,
                borderTop: '4px solid #d32f2f',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    mr: 2,
                  }}
                >
                  3
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  Выбор услуги
                </Typography>
              </Box>
              <ServicePickerSection
                categories={dictionaries.serviceCategories}
                specialties={dictionaries.specialties}
                doctors={doctors}
                services={services}
                watch={watch}
                setValue={setValue}
              />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SelectedSummary
              selectedServiceIds={selectedServiceIds}
              services={services}
              selectedDiscount={selectedDiscount}
              onClear={() => setValue('selectedServiceIds', [])}
              register={register}
              watch={watch}
              setValue={setValue}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          <Paper
            elevation={6}
            sx={{
              px: 3,
              py: 2,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(211, 47, 47, 0.05) 100%)',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(25, 118, 210, 0.1)',
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate('/patients')}
              sx={{
                borderColor: '#999',
                color: '#666',
                '&:hover': {
                  borderColor: '#333',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                },
              }}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={onSubmitSaveAndGoCash}
              disabled={saveRegistrationMutation.isPending}
              sx={{
                background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
                },
                '&:disabled': {
                  background: 'rgba(0,0,0,0.12)',
                },
              }}
            >
              {saveRegistrationMutation.isPending ? 'Сохранение...' : 'К оплате'}
            </Button>
          </Paper>
        </Box>
      </Stack>
    </>
  )
}

