import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import type { Discount, Service } from '../../types/clinic'
import { formatCurrencyUZS } from '../../utils/format'
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import type { RegistrationFormValues } from '../../schemas/registrationSchema'

interface Props {
  selectedServiceIds: string[]
  services: Service[]
  selectedDiscount?: Discount
  onClear: () => void
  register: UseFormRegister<RegistrationFormValues>
  watch: UseFormWatch<RegistrationFormValues>
  setValue: UseFormSetValue<RegistrationFormValues>
}

export function SelectedSummary({ selectedServiceIds, services, selectedDiscount, onClear, register, watch, setValue }: Props) {
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id))
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const discountPercent = selectedDiscount?.percent ?? 0
  const discountAmount = Math.round((subtotal * discountPercent) / 100)
  const total = subtotal - discountAmount

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        minWidth: 260,
        border: '1px solid rgba(15,23,42,0.06)',
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" fontWeight={600}>
          Выбрано
        </Typography>

        <Box>
          {selectedServices.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Услуги не выбраны.
            </Typography>
          ) : (
            <Stack spacing={0.5}>
              {selectedServices.map((s) => (
                <Box
                  key={s.id}
                  sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}
                >
                  <Typography variant="body2">{s.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrencyUZS(s.price)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Сумма
          </Typography>
          <Typography variant="body2">{formatCurrencyUZS(subtotal)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Скидка {discountPercent ? `(${discountPercent}%)` : ''}
          </Typography>
          <Typography variant="body2">‑{formatCurrencyUZS(discountAmount)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">Итого</Typography>
          <Typography variant="subtitle2">{formatCurrencyUZS(total)}</Typography>
        </Box>

        <Button variant="outlined" color="inherit" size="small" onClick={onClear}>
          Очистить выбор
        </Button>
      </Stack>
    </Paper>
  )
}

