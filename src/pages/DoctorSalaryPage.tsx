import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PercentIcon from '@mui/icons-material/Percent'

dayjs.extend(isBetween)

type PaymentStatus = 'PAID' | 'UNPAID'

interface SalaryDoctor {
  id: string
  fullName: string
  specialization: string
  salaryPercent: number
  isActive: boolean
}

interface SalaryService {
  id: string
  category: string
  name: string
  price: number
  currency: string
  isActive: boolean
}

interface SalaryPatient {
  id: string
  fullName: string
  phone: string
}

interface SalaryVisit {
  id: string
  patientId: string
  doctorId: string
  serviceId: string
  priceAtTime: number
  discountApplied: boolean
  amountPaid: number
  paymentStatus: PaymentStatus
  createdAt: string
}

interface SalaryDb {
  doctors: SalaryDoctor[]
  services: SalaryService[]
  patients: SalaryPatient[]
  visits: SalaryVisit[]
}

interface DoctorRow {
  doctor: SalaryDoctor
  patientsCount: number
  servicesCount: number
  totalIncome: number
  salaryPercent: number
  salaryAmount: number
}

type OrderBy = 'patients' | 'services' | 'income' | 'salary'
type Order = 'asc' | 'desc'

export function DoctorSalaryPage() {
  const [db, setDb] = useState<SalaryDb | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().startOf('month'))
  const [endDate, setEndDate] = useState<Dayjs>(dayjs())
  const [group, setGroup] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [discountMode, setDiscountMode] = useState<'amountPaid' | 'priceAtTime'>('amountPaid')
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [percentOverrides, setPercentOverrides] = useState<Record<string, number>>({})
  const [globalPercent, setGlobalPercent] = useState<number>(30)
  const [orderBy, setOrderBy] = useState<OrderBy>('income')
  const [order, setOrder] = useState<Order>('desc')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const resp = await fetch('/salary-db.json')
        const json = (await resp.json()) as SalaryDb
        setDb(json)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const doctors = db?.doctors.filter((d) => d.isActive) ?? []
  const services = db?.services.filter((s) => s.isActive) ?? []
  const visits = db?.visits ?? []

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const d = dayjs(v.createdAt)
      if (!d.isBetween(startDate, endDate, null, '[]')) return false
      if (statusFilter !== 'all' && v.paymentStatus !== statusFilter) return false
      if (serviceFilter !== 'all' && v.serviceId !== serviceFilter) return false
      if (selectedDoctorIds.length > 0 && !selectedDoctorIds.includes(v.doctorId)) return false
      return true
    })
  }, [visits, startDate, endDate, statusFilter, serviceFilter, selectedDoctorIds])

  const rows: DoctorRow[] = useMemo(() => {
    if (!db) return []
    const rowsRaw: DoctorRow[] = doctors.map((doctor) => {
      const doctorVisits = filteredVisits.filter((v) => v.doctorId === doctor.id)
      const patientsSet = new Set(doctorVisits.map((v) => v.patientId))
      const income = doctorVisits.reduce((sum, v) => {
        const base = discountMode === 'amountPaid' ? v.amountPaid : v.priceAtTime
        return sum + base
      }, 0)
      const percent = percentOverrides[doctor.id] ?? doctor.salaryPercent ?? globalPercent
      const salary = Math.round((income * percent) / 100)
      return {
        doctor,
        patientsCount: patientsSet.size,
        servicesCount: doctorVisits.length,
        totalIncome: income,
        salaryPercent: percent,
        salaryAmount: salary,
      }
    })

    const searchLower = search.trim().toLowerCase()
    const filteredBySearch =
      searchLower.length === 0
        ? rowsRaw
        : rowsRaw.filter((r) => r.doctor.fullName.toLowerCase().includes(searchLower))

    const comparator = (a: DoctorRow, b: DoctorRow) => {
      let aVal = 0
      let bVal = 0
      switch (orderBy) {
        case 'patients':
          aVal = a.patientsCount
          bVal = b.patientsCount
          break
        case 'services':
          aVal = a.servicesCount
          bVal = b.servicesCount
          break
        case 'income':
          aVal = a.totalIncome
          bVal = b.totalIncome
          break
        case 'salary':
        default:
          aVal = a.salaryAmount
          bVal = b.salaryAmount
          break
      }
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return a.doctor.fullName.localeCompare(b.doctor.fullName)
    }

    return [...filteredBySearch].sort(comparator)
  }, [db, doctors, filteredVisits, discountMode, percentOverrides, globalPercent, search, orderBy, order])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.patients += r.patientsCount
        acc.services += r.servicesCount
        acc.income += r.totalIncome
        acc.salary += r.salaryAmount
        return acc
      },
      { patients: 0, services: 0, income: 0, salary: 0 },
    )
  }, [rows])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(value)

  const handlePercentChange = (doctorId: string, value: string) => {
    const num = Number(value.replace(',', '.'))
    if (Number.isNaN(num)) return
    const clamped = Math.max(0, Math.min(100, num))
    setPercentOverrides((prev) => ({ ...prev, [doctorId]: clamped }))
    setSnackbarOpen(true)
  }

  const applyGlobalPercent = () => {
    setPercentOverrides(
      doctors.reduce<Record<string, number>>((acc, d) => {
        acc[d.id] = globalPercent
        return acc
      }, {}),
    )
    setSnackbarOpen(true)
  }

  const handleExportExcel = () => {
    const aoa: (string | number)[][] = [
      ['№', 'Доктор', 'Пациенты', 'Услуги', 'Общий приход', '% зарплаты', 'Заработная плата'],
    ]
    rows.forEach((r, idx) => {
      aoa.push([
        idx + 1,
        r.doctor.fullName,
        r.patientsCount,
        r.servicesCount,
        r.totalIncome,
        r.salaryPercent,
        r.salaryAmount,
      ])
    })
    aoa.push([])
    aoa.push(['Итого', '', totals.patients, totals.services, totals.income, '', totals.salary])

    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Зарплата')
    XLSX.writeFile(
      wb,
      `Зарплата_${startDate.format('YYYY-MM-DD')}_${endDate.format('YYYY-MM-DD')}.xlsx`,
    )
  }

  const handleReset = () => {
    setStartDate(dayjs().startOf('month'))
    setEndDate(dayjs())
    setGroup('all')
    setServiceFilter('all')
    setStatusFilter('all')
    setDiscountMode('amountPaid')
    setSelectedDoctorIds([])
    setSearch('')
  }

  const handleSort = (property: OrderBy) => {
    if (orderBy === property) {
      setOrder(order === 'asc' ? 'desc' : 'asc')
    } else {
      setOrderBy(property)
      setOrder('desc')
    }
  }

  const selectedDoctor = useMemo(
    () => rows.find((r) => r.doctor.id === selectedDoctorId),
    [rows, selectedDoctorId],
  )

  const detailByService = useMemo(() => {
    if (!selectedDoctorId) return []
    const doctorVisits = filteredVisits.filter((v) => v.doctorId === selectedDoctorId)
    const map = new Map<string, { name: string; count: number; income: number }>()
    doctorVisits.forEach((v) => {
      const service = services.find((s) => s.id === v.serviceId)
      const name = service?.name ?? v.serviceId
      const base = discountMode === 'amountPaid' ? v.amountPaid : v.priceAtTime
      const current = map.get(v.serviceId) ?? { name, count: 0, income: 0 }
      current.count += 1
      current.income += base
      map.set(v.serviceId, current)
    })
    return Array.from(map.values())
  }, [filteredVisits, services, selectedDoctorId, discountMode])

  if (loading || !db) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Зарплата
        </Typography>
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={72} />
          <Skeleton variant="rounded" height={420} />
        </Stack>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6f8', minHeight: '100vh' }}>
      {/* Filter bar */}
      <Card sx={{ mb: 3, boxShadow: '0 1px 3px rgba(15,23,42,0.12)' }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Зарплата врачей
            </Typography>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <DatePicker
                label="Дата от"
                value={startDate}
                onChange={(d) => d && setStartDate(d.startOf('day'))}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              <DatePicker
                label="Дата до"
                value={endDate}
                onChange={(d) => d && setEndDate(d.endOf('day'))}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Группа</InputLabel>
                <Select value={group} label="Группа" onChange={(e) => setGroup(e.target.value)}>
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="reception">Прием</MenuItem>
                  <MenuItem value="diagnostics">Диагностика</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Услуга</InputLabel>
                <Select
                  value={serviceFilter}
                  label="Услуга"
                  onChange={(e) => setServiceFilter(e.target.value)}
                >
                  <MenuItem value="all">Все</MenuItem>
                  {services.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={statusFilter}
                  label="Статус"
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="PAID">Оплачено</MenuItem>
                  <MenuItem value="UNPAID">Не оплачено</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel>С учетом скидок</InputLabel>
                <Select
                  value={discountMode}
                  label="С учетом скидок"
                  onChange={(e) => setDiscountMode(e.target.value as any)}
                >
                  <MenuItem value="amountPaid">Да (по факту оплаты)</MenuItem>
                  <MenuItem value="priceAtTime">Нет (по прайсу)</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Доктор</InputLabel>
                <Select
                  multiple
                  value={selectedDoctorIds}
                  label="Доктор"
                  onChange={(e) => setSelectedDoctorIds(e.target.value as string[])}
                  renderValue={(selected) =>
                    selected
                      .map((id) => doctors.find((d) => d.id === id)?.fullName ?? id)
                      .join(', ')
                  }
                >
                  {doctors.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Поиск"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 200 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
              >
                Выбрать
              </Button>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                sx={{ borderColor: '#9ca3af', color: '#374151' }}
              >
                Сбросить
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportExcel}
                sx={{ borderColor: '#22c55e', color: '#15803d' }}
              >
                Excel
              </Button>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
                <TextField
                  size="small"
                  type="number"
                  label="Глобальный %"
                  value={globalPercent}
                  onChange={(e) => setGlobalPercent(Number(e.target.value || 0))}
                  InputProps={{
                    inputProps: { min: 0, max: 100 },
                    endAdornment: (
                      <InputAdornment position="end">
                        <PercentIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 130 }}
                />
                <Button size="small" variant="outlined" onClick={applyGlobalPercent}>
                  Применить ко всем
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Paper sx={{ boxShadow: '0 1px 3px rgba(15,23,42,0.12)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#e5f2ff', fontWeight: 700, color: '#1e3a8a' } }}>
                <TableCell width={48}>№</TableCell>
                <TableCell>Доктор</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'patients'}
                    direction={orderBy === 'patients' ? order : 'asc'}
                    onClick={() => handleSort('patients')}
                  >
                    Пациенты
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'services'}
                    direction={orderBy === 'services' ? order : 'asc'}
                    onClick={() => handleSort('services')}
                  >
                    Услуги
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'income'}
                    direction={orderBy === 'income' ? order : 'asc'}
                    onClick={() => handleSort('income')}
                  >
                    Общий приход
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">% зарплаты</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'salary'}
                    direction={orderBy === 'salary' ? order : 'asc'}
                    onClick={() => handleSort('salary')}
                  >
                    Заработная плата
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Нет данных за выбранный период
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {rows.map((row, index) => (
                    <TableRow
                      key={row.doctor.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDoctorId(row.doctor.id)}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography>{row.doctor.fullName}</Typography>
                          <Chip
                            size="small"
                            label={row.doctor.specialization}
                            color="primary"
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{row.patientsCount}</TableCell>
                      <TableCell align="right">{row.servicesCount}</TableCell>
                      <TableCell align="right">{formatCurrency(row.totalIncome)}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <TextField
                          size="small"
                          type="number"
                          value={row.salaryPercent}
                          onChange={(e) => handlePercentChange(row.doctor.id, e.target.value)}
                          InputProps={{
                            inputProps: { min: 0, max: 100, style: { textAlign: 'right' } },
                            endAdornment: (
                              <InputAdornment position="end">
                                <PercentIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ width: 110 }}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(row.salaryAmount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f9fafb', '& td': { fontWeight: 700 } }}>
                    <TableCell />
                    <TableCell>Итого</TableCell>
                    <TableCell align="right">{totals.patients}</TableCell>
                    <TableCell align="right">{totals.services}</TableCell>
                    <TableCell align="right">{formatCurrency(totals.income)}</TableCell>
                    <TableCell align="right">—</TableCell>
                    <TableCell align="right">{formatCurrency(totals.salary)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Detail drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedDoctorId)}
        onClose={() => setSelectedDoctorId(null)}
        PaperProps={{ sx: { width: 380, p: 2 } }}
      >
        {selectedDoctor ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {selectedDoctor.doctor.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Период: {startDate.format('DD.MM.YYYY')} — {endDate.format('DD.MM.YYYY')}
              </Typography>
            </Box>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Сводка
                </Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2">
                    Пациенты: <strong>{selectedDoctor.patientsCount}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Услуги: <strong>{selectedDoctor.servicesCount}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Общий приход: <strong>{formatCurrency(selectedDoctor.totalIncome)}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Процент: <strong>{selectedDoctor.salaryPercent}%</strong>
                  </Typography>
                  <Typography variant="body2">
                    Заработная плата: <strong>{formatCurrency(selectedDoctor.salaryAmount)}</strong>
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Услуги за период
                </Typography>
                {detailByService.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Нет услуг за выбранный период
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Услуга</TableCell>
                        <TableCell align="right">Кол-во</TableCell>
                        <TableCell align="right">Сумма</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailByService.map((s) => (
                        <TableRow key={s.name}>
                          <TableCell>{s.name}</TableCell>
                          <TableCell align="right">{s.count}</TableCell>
                          <TableCell align="right">{formatCurrency(s.income)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Выберите врача в таблице, чтобы увидеть детали.
          </Typography>
        )}
      </Drawer>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message="Процент обновлен"
      />
    </Box>
  )
}

