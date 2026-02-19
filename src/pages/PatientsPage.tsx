import {
  Box,
  Stack,
  Typography,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Grid2 as Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PersonAdd as PersonAddIcon, Search as SearchIcon } from '@mui/icons-material'
import { clinicMockRepository } from '../repositories/clinicRepository.mock'
import type { Patient, Service, Doctor, IncomeEntry } from '../types/clinic'

export function PatientsPage() {
  const [searchId, setSearchId] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'new' | 'old'>('all')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const { data: patients = [] } = useQuery({
    queryKey: ['clinic', 'patients'],
    queryFn: () => clinicMockRepository.getPatients(),
  })

  const { data: services = [] } = useQuery({
    queryKey: ['clinic', 'services'],
    queryFn: () => clinicMockRepository.getServices(),
  })

  const { data: doctors = [] } = useQuery({
    queryKey: ['clinic', 'doctors'],
    queryFn: () => clinicMockRepository.getDoctors(),
  })

  const { data: dictionaries } = useQuery({
    queryKey: ['clinic', 'dictionaries'],
    queryFn: () => clinicMockRepository.getDictionaries(),
  })

  // Load income data from localStorage
  const [dbData, setDbData] = useState<{ income?: IncomeEntry[] } | null>(null)

  if (typeof window !== 'undefined' && !dbData) {
    const stored = window.localStorage.getItem('clinic_db_mock')
    if (stored) {
      try {
        setDbData(JSON.parse(stored))
      } catch {
        setDbData({})
      }
    }
  }

  const incomeData = dbData?.income || []

  // Calculate patient debt
  const calculateDebt = (patientId: string) => {
    const patientIncomes = incomeData.filter((i) => i.patientId === patientId)
    const debt = patientIncomes
      .filter((i) => i.paymentMethod === 'debt')
      .reduce((sum, i) => sum + i.amount, 0)
    return debt
  }

  // Get last registration date
  const getLastRegistrationDate = (patientId: string) => {
    const patientIncomes = incomeData.filter((i) => i.patientId === patientId)
    if (patientIncomes.length === 0) return null
    const latest = patientIncomes.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]
    return latest.date
  }

  // Filter patients by ID, name, phone, and filter type
  const filteredPatients = useMemo(() => {
    let filtered = patients
    const query = searchId.toLowerCase()

    // Search filter
    if (searchId) {
      filtered = filtered.filter((p) => {
        const idMatch = p.id.toLowerCase().includes(query)
        const nameMatch = `${p.lastName} ${p.firstName} ${p.middleName}`.toLowerCase().includes(query)
        const phoneMatch = p.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
        return idMatch || nameMatch || phoneMatch
      })
    }

    // Type filter
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    if (filterType === 'debt') {
      filtered = filtered.filter((p) => calculateDebt(p.id) > 0)
    } else if (filterType === 'new') {
      filtered = filtered.filter((p) => {
        const lastDate = getLastRegistrationDate(p.id)
        return lastDate ? new Date(lastDate) > sevenDaysAgo : false
      })
    } else if (filterType === 'old') {
      filtered = filtered.filter((p) => {
        const lastDate = getLastRegistrationDate(p.id)
        return lastDate ? new Date(lastDate) < thirtyDaysAgo : true
      })
    }

    return filtered
  }, [patients, searchId, filterType, incomeData])

  // Get patient services
  const getPatientServices = (patientId: string) => {
    const patientIncomes = incomeData.filter((i) => i.patientId === patientId)
    return patientIncomes.map((income) => ({
      service: income.description,
      date: income.date,
      amount: income.amount,
      method: income.paymentMethod,
    }))
  }

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient)
    setDetailDialogOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailDialogOpen(false)
    setTimeout(() => setSelectedPatient(null), 300)
  }

  const getDoctorName = (doctorId: string) => {
    return doctors.find((d) => d.id === doctorId)?.fullName || 'N/A'
  }

  const getDistrictName = (districtId?: string) => {
    if (!districtId) return 'N/A'
    return dictionaries?.districts.find((d) => d.id === districtId)?.name || 'N/A'
  }

  const patientNumber = (index: number) => {
    return (index + 1).toString()
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
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
          Пациенты
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управление и просмотр информации о пациентах
        </Typography>
      </Box>

      {/* Search Bar and Filters */}
      <Paper
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
        }}
      >
        <TextField
          fullWidth
          placeholder="Поиск по ID, имени или номеру телефона"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: '#999' }} />,
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.95rem',
            },
            mb: 2,
          }}
        />

        {/* Filters */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="Все"
            onClick={() => setFilterType('all')}
            variant={filterType === 'all' ? 'filled' : 'outlined'}
            color={filterType === 'all' ? 'primary' : 'default'}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label="С долгом"
            onClick={() => setFilterType('debt')}
            variant={filterType === 'debt' ? 'filled' : 'outlined'}
            color={filterType === 'debt' ? 'error' : 'default'}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label="Новые пациенты"
            onClick={() => setFilterType('new')}
            variant={filterType === 'new' ? 'filled' : 'outlined'}
            color={filterType === 'new' ? 'success' : 'default'}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label="Давно не посещали"
            onClick={() => setFilterType('old')}
            variant={filterType === 'old' ? 'filled' : 'outlined'}
            color={filterType === 'old' ? 'warning' : 'default'}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Paper>

      {/* Patients Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' }}>
              <TableCell sx={{ fontWeight: 700, width: '80px' }}>№</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>ФИО</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>День рождения</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Телефон</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Баланс</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Последняя регистрация</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Врач</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.map((patient, index) => {
              const debt = calculateDebt(patient.id)
              const lastRegDate = getLastRegistrationDate(patient.id)
              const services = getPatientServices(patient.id)
              const lastService = services.length > 0 ? services[0] : null

              return (
                <TableRow
                  key={patient.id}
                  onClick={() => handlePatientClick(patient)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, color: '#667eea' }}>
                    {patientNumber(index)}
                  </TableCell>
                  <TableCell>
                    <Chip label={patient.id.split('_')[1] || patient.id} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {patient.lastName} {patient.firstName} {patient.middleName}
                  </TableCell>
                  <TableCell>
                    {new Date(patient.birthDate).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{patient.phone}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    {debt > 0 ? (
                      <Chip
                        label={`${debt.toLocaleString('ru-RU')} UZS`}
                        color="error"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    ) : (
                      <Chip label="0" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {lastRegDate ? new Date(lastRegDate).toLocaleDateString('ru-RU') : '—'}
                  </TableCell>
                  <TableCell>
                    {lastService ? getDoctorName(lastService.service) : '—'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredPatients.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          }}
        >
          <PersonAddIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
          <Typography color="text.secondary">
            {searchId ? 'Пациентов не найдено' : 'Нет пациентов'}
          </Typography>
        </Paper>
      )}

      {/* Detail Modal */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        {selectedPatient && (
          <>
            <DialogTitle
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 700,
              }}
            >
              Профиль пациента
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Stack spacing={2.5}>
                {/* Personal Info */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#667eea' }}>
                      ЛИЧНАЯ ИНФОРМАЦИЯ
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          ФИО:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedPatient.lastName} {selectedPatient.firstName} {selectedPatient.middleName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          ID:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {selectedPatient.id.split('_')[1] || selectedPatient.id}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Пол:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedPatient.gender === 'male' ? 'Мужской' : 'Женский'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Дата рождения:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {new Date(selectedPatient.birthDate).toLocaleDateString('ru-RU')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Контакт:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {selectedPatient.phone}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Divider />

                {/* Address Info */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#667eea' }}>
                      АДРЕС И РАЙОН
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Район:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {getDistrictName(selectedPatient.districtId)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Адрес:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedPatient.address}
                        </Typography>
                      </Box>
                      {selectedPatient.pinfl && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            ПИНФЛ:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                            {selectedPatient.pinfl}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Divider />

                {/* Financial Info */}
                <Card
                  variant="outlined"
                  sx={{
                    background: calculateDebt(selectedPatient.id) > 0
                      ? 'linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(192, 57, 43, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(66, 165, 73, 0.05) 100%)',
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#667eea' }}>
                      ФИНАНСОВАЯ ИНФОРМАЦИЯ
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Баланс / Долг:
                        </Typography>
                        <Chip
                          label={
                            calculateDebt(selectedPatient.id) > 0
                              ? `${calculateDebt(selectedPatient.id).toLocaleString('ru-RU')} UZS`
                              : '0 UZS'
                          }
                          color={calculateDebt(selectedPatient.id) > 0 ? 'error' : 'success'}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Divider />

                {/* Services History */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#667eea' }}>
                      ИСТОРИЯ УСЛУГ ({getPatientServices(selectedPatient.id).length})
                    </Typography>
                    {getPatientServices(selectedPatient.id).length > 0 ? (
                      <Stack spacing={1}>
                        {getPatientServices(selectedPatient.id).map((service, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              p: 1.5,
                              background: '#f5f5f5',
                              borderRadius: 1,
                              borderLeft: '4px solid #667eea',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {service.service}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#667eea' }}>
                                {new Date(service.date).toLocaleDateString('ru-RU')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                {service.amount.toLocaleString('ru-RU')} UZS
                              </Typography>
                              <Chip
                                label={
                                  service.method === 'cash'
                                    ? 'Наличные'
                                    : service.method === 'card'
                                      ? 'Карта'
                                      : 'Долг'
                                }
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor:
                                    service.method === 'cash'
                                      ? '#26c485'
                                      : service.method === 'card'
                                        ? '#3b82f6'
                                        : '#ff9800',
                                  color:
                                    service.method === 'cash'
                                      ? '#26c485'
                                      : service.method === 'card'
                                        ? '#3b82f6'
                                        : '#ff9800',
                                }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Нет истории услуг
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, background: 'rgba(0,0,0,0.01)', borderTop: '1px solid #e0e0e0' }}>
              <Button onClick={handleCloseDetail} variant="outlined">
                Закрыть
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  )
}

