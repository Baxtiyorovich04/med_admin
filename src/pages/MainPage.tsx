import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  LinearProgress,
  Button,
  ButtonGroup,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

interface DbData {
  meta: { clinicName: string; currency: string }
  patients: Array<{ id: string; firstName: string; lastName: string; middleName?: string }>
  doctors: Array<{ id: string; fullName: string; active: boolean }>
  services: Array<{ id: string; price: number; active: boolean }>
  patientCards: Array<{ id: string }>
  income: Array<{ date: string; amount: number; description: string; paymentMethod?: 'cash' | 'card' | 'debt'; patientId?: string }>
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle
}: {
  title: string
  value: string | number
  icon: any
  color: string
  subtitle?: string
}) => (
  <Card sx={{
    height: '100%',
    background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
    border: `2px solid ${color}30`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 24px ${color}30`,
      borderColor: `${color}60`,
    }
  }}>
    <CardContent sx={{ pb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="textSecondary" variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{
          bgcolor: `${color}20`,
          color,
          width: 56,
          height: 56,
        }}>
          <Icon />
        </Avatar>
      </Box>
    </CardContent>
  </Card>
)

type FilterType = 'week' | 'month' | 'year'
type MethodFilter = 'all' | 'cash' | 'card'

const IncomeChart = ({ dbData }: { dbData: DbData }) => {
  const [filter, setFilter] = useState<FilterType>('week')
  const [method, setMethod] = useState<MethodFilter>('all')

  const filterIncomeData = (data: DbData['income'], filterType: FilterType) => {
    const today = new Date('2026-02-18')
    let startDate = new Date(today)

    if (filterType === 'week') startDate.setDate(today.getDate() - 7)
    else if (filterType === 'month') startDate.setMonth(today.getMonth() - 1)
    else startDate.setFullYear(today.getFullYear() - 1)

    return data.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= startDate && itemDate <= today
    })
  }

  const chartData = filterIncomeData(dbData.income, filter)
  const nonDebtData = chartData.filter((d) => d.paymentMethod !== 'debt')
  const filteredByMethod = method === 'all' ? nonDebtData : nonDebtData.filter((d) => d.paymentMethod === method)
  const totalIncome = filteredByMethod.reduce((sum, item) => sum + item.amount, 0)

  const debtData = chartData.filter((d) => d.paymentMethod === 'debt')
  const totalDebt = debtData.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Card sx={{ background: 'linear-gradient(135deg, #26c48515 0%, #26c48505 100%)', border: '2px solid #26c48530', mt: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Доход по времени</Typography>
            <Typography variant="h4" sx={{ color: '#26c485', fontWeight: 700 }}>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: dbData.meta.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalIncome)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ButtonGroup size="small" variant="outlined">
              <Button onClick={() => setFilter('week')} variant={filter === 'week' ? 'contained' : 'outlined'}>Неделя</Button>
              <Button onClick={() => setFilter('month')} variant={filter === 'month' ? 'contained' : 'outlined'}>Месяц</Button>
              <Button onClick={() => setFilter('year')} variant={filter === 'year' ? 'contained' : 'outlined'}>Год</Button>
            </ButtonGroup>

            <ButtonGroup size="small" variant="outlined">
              <Button onClick={() => setMethod('all')} variant={method === 'all' ? 'contained' : 'outlined'}>Все</Button>
              <Button onClick={() => setMethod('cash')} variant={method === 'cash' ? 'contained' : 'outlined'}>Нал</Button>
              <Button onClick={() => setMethod('card')} variant={method === 'card' ? 'contained' : 'outlined'}>Карта</Button>
            </ButtonGroup>
          </Box>
        </Box>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredByMethod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} formatter={(value: any) => (typeof value === 'number' ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: dbData.meta.currency, minimumFractionDigits: 0 }).format(value) : value)} />
              <Legend />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {filteredByMethod.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.paymentMethod === 'card' ? '#3b82f6' : '#26c485'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Debt summary and chart */}
        <Box sx={{ mt: 3 }}>
          <Card sx={{ border: '1px solid rgba(239,68,68,0.12)' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Долги</Typography>
              <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 700, mb: 2 }}>{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: dbData.meta.currency, minimumFractionDigits: 0 }).format(totalDebt)}</Typography>

              <Paper variant="outlined" sx={{ p: 1, bgcolor: '#fff7f7', mb: 2 }}>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={debtData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: any) => (typeof value === 'number' ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: dbData.meta.currency, minimumFractionDigits: 0 }).format(value) : value)} />
                    <Bar dataKey="amount" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>

              {/* Debt details by patient */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Кто в долге:</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#fff7f7' }}>
                      <TableCell>Пациент</TableCell>
                      <TableCell align="right">Сумма</TableCell>
                      <TableCell>Услуга</TableCell>
                      <TableCell>Дата</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {debtData.map((entry, idx) => {
                      const patient = dbData.patients.find((p) => p.id === entry.patientId)
                      const patientName = patient ? `${patient.lastName} ${patient.firstName}` : 'Неизвестно'
                      return (
                        <TableRow key={idx}>
                          <TableCell>{patientName}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#ef4444' }}>
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: dbData.meta.currency, minimumFractionDigits: 0 }).format(entry.amount)}
                          </TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell>{entry.date}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </CardContent>
    </Card>
  )
}

/**
 * PatientsChart — counts number of income entries per date (proxy for visits)
 */
const PatientsChart = ({ dbData }: { dbData: DbData }) => {
  const [filter, setFilter] = useState<FilterType>('week')

  const filterIncomeData = (data: DbData['income'], filterType: FilterType) => {
    const today = new Date('2026-02-18')
    let startDate = new Date(today)

    if (filterType === 'week') {
      startDate.setDate(today.getDate() - 7)
    } else if (filterType === 'month') {
      startDate.setMonth(today.getMonth() - 1)
    } else {
      startDate.setFullYear(today.getFullYear() - 1)
    }

    return data.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= startDate && itemDate <= today
    })
  }

  const data = filterIncomeData(dbData.income, filter)
  // group by date and count
  const grouped: Record<string, number> = {}
  data.forEach((d) => {
    grouped[d.date] = (grouped[d.date] || 0) + 1
  })
  const chartData = Object.keys(grouped).sort().map((date) => ({ date, count: grouped[date] }))

  return (
    <Card sx={{ mt: 4, border: '2px solid rgba(99,102,241,0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Посещаемость</Typography>
          <ButtonGroup size="small" variant="outlined">
            <Button onClick={() => setFilter('week')} variant={filter === 'week' ? 'contained' : 'outlined'}>Неделя</Button>
            <Button onClick={() => setFilter('month')} variant={filter === 'month' ? 'contained' : 'outlined'}>Месяц</Button>
            <Button onClick={() => setFilter('year')} variant={filter === 'year' ? 'contained' : 'outlined'}>Год</Button>
          </ButtonGroup>
        </Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </CardContent>
    </Card>
  )
}

export function MainPage() {
  const [dbData, setDbData] = useState<DbData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/db.json')
        const data = await response.json()
        setDbData(data)
      } catch (error) {
        console.error('Failed to load db.json:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading || !dbData) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Загрузка...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    )
  }

  // Calculate statistics
  const totalPatients = dbData.patients.length
  const totalDoctors = dbData.doctors.filter((d) => d.active).length
  const totalServices = dbData.services.filter((s) => s.active).length
  const totalRevenue = dbData.services
    .filter((s) => s.active)
    .reduce((sum, service) => sum + service.price, 0)
  const activeDoctors = dbData.doctors.filter((d) => d.active)
  const currencySymbol = dbData.meta.currency === 'UZS' ? 'UZS' : '$'

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: dbData.meta.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Панель управления
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Добро пожаловать в {dbData.meta.clinicName}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Пациентов"
            value={totalPatients}
            icon={PeopleIcon}
            color="#667eea"
            subtitle="Всего зарегистрировано"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Врачей"
            value={totalDoctors}
            icon={PersonIcon}
            color="#00d4ff"
            subtitle="Активные специалисты"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Услуг"
            value={totalServices}
            icon={MedicalServicesIcon}
            color="#ffa726"
            subtitle="Доступные услуги"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Общая стоимость"
            value={`${(totalRevenue / 1000000).toFixed(1)}M`}
            icon={AttachMoneyIcon}
            color="#26c485"
            subtitle={`${currencySymbol}`}
          />
        </Grid>
      </Grid>

      {/* Income Chart Section */}
      <IncomeChart dbData={dbData} />

      {/* Patients Chart Section */}
      <PatientsChart dbData={dbData} />
    </Box>
  )
}

