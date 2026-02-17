import {
  Box,
  Chip,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import type { Doctor, Service, ServiceCategory, Specialty } from '../../types/clinic'
import type { RegistrationFormValues } from '../../schemas/registrationSchema'
import { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { formatCurrencyUZS } from '../../utils/format'

interface Props {
  categories: ServiceCategory[]
  specialties: Specialty[]
  doctors: Doctor[]
  services: Service[]
  watch: UseFormWatch<RegistrationFormValues>
  setValue: UseFormSetValue<RegistrationFormValues>
}

export function ServicePickerSection({
  categories,
  specialties,
  doctors,
  services,
  watch,
  setValue,
}: Props) {
  const currentCategoryId = watch('serviceCategoryId')
  const currentSpecialtyId = watch('specialtyId')
  const currentDoctorId = watch('doctorId')
  const selectedServiceIds = watch('selectedServiceIds')

  const handleCategoryChange = (_: React.SyntheticEvent, value: string) => {
    setValue('serviceCategoryId', value)
  }

  const handleSpecialtyClick = (id: string) => {
    setValue('specialtyId', id)
    setValue('doctorId', '')
  }

  const filteredDoctors = doctors.filter(
    (d) => d.specialtyId === currentSpecialtyId && d.active,
  )

  const filteredServices = services.filter(
    (s) =>
      s.categoryId === currentCategoryId &&
      s.specialtyId === currentSpecialtyId &&
      s.active,
  )

  const toggleService = (serviceId: string) => {
    const exists = selectedServiceIds.includes(serviceId)
    if (exists) {
      setValue(
        'selectedServiceIds',
        selectedServiceIds.filter((id) => id !== serviceId),
      )
    } else {
      setValue('selectedServiceIds', [...selectedServiceIds, serviceId])
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={currentCategoryId}
            onChange={handleCategoryChange}
            variant="scrollable"
          >
            {categories.map((c) => (
              <Tab key={c.id} value={c.id} label={c.name} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {specialties.map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              clickable
              color={s.id === currentSpecialtyId ? 'primary' : 'default'}
              onClick={() => handleSpecialtyClick(s.id)}
            />
          ))}
        </Box>

        <Box sx={{ maxWidth: 320, mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="doctor-select-label">Врач</InputLabel>
            <Select
              labelId="doctor-select-label"
              label="Врач"
              value={currentDoctorId ?? ''}
              onChange={(e) => setValue('doctorId', e.target.value)}
            >
              <MenuItem value="">
                <em>Любой врач</em>
              </MenuItem>
              {filteredDoctors.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <List
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            maxHeight: 380,
            overflowY: 'auto',
            border: '1px solid rgba(15,23,42,0.06)',
          }}
        >
          {filteredServices.map((s) => {
            const checked = selectedServiceIds.includes(s.id)
            return (
              <ListItem
                key={s.id}
                secondaryAction={formatCurrencyUZS(s.price)}
                onClick={() => toggleService(s.id)}
                sx={{ cursor: 'pointer' }}
              >
                <ListItemIcon>
                  <Checkbox edge="start" checked={checked} tabIndex={-1} />
                </ListItemIcon>
                <ListItemText primary={s.name} />
              </ListItem>
            )
          })}
        </List>
      </Grid>
    </Grid>
  )
}

