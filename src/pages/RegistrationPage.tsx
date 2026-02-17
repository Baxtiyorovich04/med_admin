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
import { clinicMockRepository } from '../repositories/clinicRepository.mock'
import { registrationSchema, type RegistrationFormValues } from '../schemas/registrationSchema'
import { PatientFormSection } from '../components/registration/PatientFormSection'
import { CardSection } from '../components/registration/CardSection'
import { ServicePickerSection } from '../components/registration/ServicePickerSection'
import { SelectedSummary } from '../components/registration/SelectedSummary'
import type { Discount, Patient } from '../types/clinic'

export function RegistrationPage() {
  const navigate = useNavigate()

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
      gender: undefined as any,
      phone: '',
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
      districtId: patient.districtId ?? '',
      address: patient.address,
    })
  }

  const onSubmitSave = handleSubmit(async (values) => {
    await saveRegistrationMutation.mutateAsync(values)
    // TODO: показать уведомление / snackbar
  })

  const onSubmitSaveAndGoCash = handleSubmit(async (values) => {
    const result = await saveRegistrationMutation.mutateAsync(values)
    navigate('/cash', { state: { registrationDraftId: result.draft.id } })
  })

  if (isDictLoading) {
    return <Typography>Загрузка данных...</Typography>
  }

  if (isDictError || !dictionaries) {
    return <Typography color="error">Ошибка загрузки справочников.</Typography>
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Добавление пациента
        </Typography>
        <Alert severity="warning">
          Внимание: Поля, отмеченные красным знаком, обязательны для заполнения.
        </Alert>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Данные пациента
        </Typography>
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

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Карта пациента
        </Typography>
        <CardSection
          discounts={dictionaries.discounts}
          cardTypes={dictionaries.cardTypes}
          doctors={doctors}
          register={register}
          errors={errors}
          control={control}
          hasReferral={hasReferral}
          openNewCard={openNewCard}
        />
      </Paper>

      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Выбор услуги
            </Typography>
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
          elevation={3}
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate('/patients')}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onSubmitSave}
            disabled={saveRegistrationMutation.isPending}
          >
            Сохранить регистрацию
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={onSubmitSaveAndGoCash}
            disabled={saveRegistrationMutation.isPending}
          >
            Сохранить и перейти к оплате
          </Button>
        </Paper>
      </Box>
    </Stack>
  )
}

