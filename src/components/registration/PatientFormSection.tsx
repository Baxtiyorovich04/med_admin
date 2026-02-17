import {
  Alert,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid2 as Grid,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Button,
} from '@mui/material'
import { Controller, FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import type { District, Patient } from '../../types/clinic'
import type { RegistrationFormValues } from '../../schemas/registrationSchema'
import { formatUzPhoneDisplay, normalizeUzPhone } from '../../utils/format'

interface Props {
  districts: District[]
  register: UseFormRegister<RegistrationFormValues>
  errors: FieldErrors<RegistrationFormValues>
  control: any
  watch: UseFormWatch<RegistrationFormValues>
  foundPatient?: Patient
  onFillFromHistory?: (patient: Patient) => void
  onPhoneBlur?: (phone: string) => void
}

export function PatientFormSection({
  districts,
  register,
  errors,
  control,
  watch,
  foundPatient,
  onFillFromHistory,
  onPhoneBlur,
}: Props) {
  const phoneValue = watch('phone')

  return (
    <Grid container spacing={3}>
      {foundPatient && onFillFromHistory && (
        <Grid size={12}>
          <Alert
            severity="info"
            action={
              <Button
                color="primary"
                size="small"
                onClick={() => {
                  onFillFromHistory(foundPatient)
                }}
              >
                Заполнить из истории
              </Button>
            }
          >
            Найден пациент по телефону: {foundPatient.lastName} {foundPatient.firstName}{' '}
            {foundPatient.middleName}
          </Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12, md: 6 }} container spacing={2}>
        <Grid size={12}>
          <TextField
            label="Фамилия *"
            fullWidth
            {...register('lastName')}
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label="Имя *"
            fullWidth
            {...register('firstName')}
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label="Отчество *"
            fullWidth
            {...register('middleName')}
            error={!!errors.middleName}
            helperText={errors.middleName?.message}
          />
        </Grid>
        <Grid size={12}>
          <Controller
            name="birthDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Дата рождения *"
                format="DD.MM.YYYY"
                value={field.value ? dayjs(field.value) : null}
                onChange={(value) => field.onChange(value ? value.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.birthDate,
                    helperText: errors.birthDate?.message,
                  },
                }}
              />
            )}
          />
        </Grid>
        <Grid size={12}>
          <FormControl error={!!errors.gender}>
            <FormLabel>Пол *</FormLabel>
            <RadioGroup row {...register('gender')}>
              <FormControlLabel value="male" control={<Radio />} label="Мужской" />
              <FormControlLabel value="female" control={<Radio />} label="Женский" />
            </RadioGroup>
            {errors.gender && (
              <FormHelperText>{errors.gender.message as string}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid size={12}>
          <TextField
            label="Телефон *"
            fullWidth
            value={phoneValue ? formatUzPhoneDisplay(phoneValue) : ''}
            onChange={(e) => {
              const normalized = normalizeUzPhone(e.target.value)
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              ;(register('phone').onChange as any)({
                target: { value: normalized, name: 'phone' },
              })
            }}
            onBlur={() => {
              const normalized = normalizeUzPhone(phoneValue ?? '')
              if (onPhoneBlur && normalized) {
                onPhoneBlur(normalized)
              }
            }}
            placeholder="+998 (__) ___-__-__"
            error={!!errors.phone}
            helperText={errors.phone?.message ?? 'Формат: +998 (__) ___-__-__'}
          />
        </Grid>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }} container spacing={2}>
        <Grid size={12}>
          <TextField
            label="Район"
            select
            fullWidth
            defaultValue=""
            {...register('districtId')}
          >
            <MenuItem value="">Не указан</MenuItem>
            {districts.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={12}>
          <TextField
            label="Адрес *"
            fullWidth
            placeholder="Адрес, дом, квартира и т.д."
            multiline
            minRows={3}
            {...register('address')}
            error={!!errors.address}
            helperText={errors.address?.message}
          />
        </Grid>
      </Grid>
    </Grid>
  )
}

