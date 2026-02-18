import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid2 as Grid,
  MenuItem,
  Switch,
  TextField,
} from '@mui/material'
import { Controller, FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import type { CardType, Discount, Doctor } from '../../types/clinic'
import type { RegistrationFormValues } from '../../schemas/registrationSchema'

interface Props {
  discounts: Discount[]
  cardTypes: CardType[]
  doctors: Doctor[]
  register: UseFormRegister<RegistrationFormValues>
  errors: FieldErrors<RegistrationFormValues>
  control: any
  watch: UseFormWatch<RegistrationFormValues>
  hasReferral: boolean
  openNewCard: boolean
}

export function CardSection({
  discounts,
  cardTypes,
  doctors,
  register,
  errors,
  control,
  watch,
  hasReferral,
  openNewCard,
}: Props) {
  const cardNumber = watch('cardNumber')

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }} container spacing={2}>
        <Grid size={12}>
          <TextField
            label="Скидка"
            select
            fullWidth
            defaultValue="disc_none"
            {...register('discountId')}
          >
            {discounts.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={12}>
          <TextField
            label="Имеется ли у Вас направление?"
            placeholder="ФИО врача или номер телефона"
            fullWidth
            {...register('referralInfo')}
            multiline
            minRows={2}
          />
        </Grid>
        <Grid size={12}>
          <FormControlLabel
            control={<Switch color="primary" {...register('hasReferral')} />}
            label="Есть направление"
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label="ID врача"
            fullWidth
            {...register('referralDoctorId')}
            error={!!errors.referralDoctorId}
            helperText={errors.referralDoctorId?.message}
          />
        </Grid>
        <Grid size={12}>
          <FormControlLabel
            control={<Checkbox color="primary" {...register('insurance')} />}
            label="Страхование"
          />
        </Grid>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }} container spacing={2}>
        <Grid size={12}>
          <FormControlLabel
            control={<Checkbox color="primary" defaultChecked {...register('openNewCard')} />}
            label="Открыть новую карту"
          />
        </Grid>

        {openNewCard && (
          <>
            <Grid size={12}>
              <TextField
                label="Тип карты *"
                select
                fullWidth
                defaultValue=""
                {...register('cardTypeId')}
                error={!!errors.cardTypeId}
                helperText={errors.cardTypeId?.message}
              >
                <MenuItem value="">Не выбран</MenuItem>
                {cardTypes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField
                label="№ карта *"
                fullWidth
                {...register('cardNumber')}
                error={!!errors.cardNumber}
                helperText={errors.cardNumber?.message || 'Генерируется автоматически'}
                value={cardNumber || ''}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                name="cardOpenedAt"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Дата открытия *"
                    format="DD.MM.YYYY"
                    value={field.value ? dayjs(field.value) : dayjs()}
                    onChange={(value) =>
                      field.onChange(value ? value.format('YYYY-MM-DD') : '')
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.cardOpenedAt,
                        helperText: errors.cardOpenedAt?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <FormControl error={!!errors.responsibleDoctorId}>
                <FormLabel>Ответственный врач</FormLabel>
                <TextField
                  select
                  fullWidth
                  defaultValue=""
                  {...register('responsibleDoctorId')}
                >
                  <MenuItem value="">Без рекомендации врача</MenuItem>
                  {doctors.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.fullName}
                    </MenuItem>
                  ))}
                </TextField>
                {errors.responsibleDoctorId && (
                  <FormHelperText>  
                    {errors.responsibleDoctorId.message as string}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
          </>
        )}
      </Grid>
    </Grid>
  )
}

