import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import React, { useMemo, useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import PrintIcon from '@mui/icons-material/Print'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { clinicMockRepository } from '../repositories/clinicRepository.mock'
import type { Service, ServiceCategory, Doctor, IncomeEntry, Meta } from '../types/clinic'

dayjs.extend(isBetween)

const CATEGORY_COLORS: Record<string, string> = {
  cat_reception: '#1976d2',
  cat_diagnostics: '#0288d1',
  cat_lab: '#ed6c02',
  cat_med_plus: '#9c27b0',
  cat_group: '#7b1fa2',
  cat_inpatient: '#2e7d32',
}

export interface ReportRow {
  serviceId: string
  doctorNames: string[]
  count: number
  totalRevenue: number
}

function buildReportFromIncome(
  income: IncomeEntry[],
  services: Service[],
  doctors: Doctor[],
  start: Dayjs,
  end: Dayjs,
  filterDoctorId: string,
  filterCategoryId: string,
): Map<string, ReportRow> {
  const getDoctorName = (id: string) => doctors.find((d) => d.id === id)?.fullName ?? id
  const byService = new Map<string, ReportRow>()
  services.forEach((s) => {
    byService.set(s.id, { serviceId: s.id, doctorNames: [], count: 0, totalRevenue: 0 })
  })

  const filtered = income.filter((e) => {
    const d = dayjs(e.date)
    if (!d.isBetween(start, end, null, '[]')) return false
    if (filterDoctorId && e.doctorId !== filterDoctorId) return false
    return true
  })

  filtered.forEach((entry) => {
    const doctorName = entry.doctorId ? getDoctorName(entry.doctorId) : null
    if (filterDoctorId && entry.doctorId !== filterDoctorId) return
    const desc = (entry.description || '').toLowerCase()
    let matched = false
    for (const s of services) {
      if (filterCategoryId && s.categoryId !== filterCategoryId) continue
      if (desc.includes(s.name.toLowerCase())) {
        const row = byService.get(s.id)!
        row.count += 1
        row.totalRevenue += entry.amount
        if (doctorName && !row.doctorNames.includes(doctorName)) row.doctorNames.push(doctorName)
        matched = true
        break
      }
    }
  })

  return byService
}

export function ServicesReportPage() {
  const [startDate, setStartDate] = useState<Dayjs>(dayjs())
  const [endDate, setEndDate] = useState<Dayjs>(dayjs())
  const [filterDoctorId, setFilterDoctorId] = useState<string>('')
  const [filterCategoryId, setFilterCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [income, setIncome] = useState<IncomeEntry[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [dict, svc, docList, incomeRaw] = await Promise.all([
          clinicMockRepository.getDictionaries(),
          clinicMockRepository.getServices(),
          clinicMockRepository.getDoctors(),
          clinicMockRepository.getIncome(),
        ])
        setCategories(dict.serviceCategories)
        setServices(svc)
        setDoctors(docList)
        setIncome(incomeRaw ?? [])
        setMeta(dict.meta)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const reportData = useMemo(() => {
    return buildReportFromIncome(
      income,
      services,
      doctors,
      startDate,
      endDate,
      filterDoctorId,
      filterCategoryId,
    )
  }, [income, services, doctors, startDate, endDate, filterDoctorId, filterCategoryId])

  const categoriesWithServices = useMemo(() => {
    const list = filterCategoryId
      ? categories.filter((c) => c.id === filterCategoryId)
      : [...categories]
    return list.map((cat) => ({
      category: cat,
      services: services.filter((s) => s.categoryId === cat.id),
    })).filter((g) => g.services.length > 0)
  }, [categories, services, filterCategoryId])

  const { grandCount, grandRevenue } = useMemo(() => {
    let count = 0
    let revenue = 0
    categoriesWithServices.forEach(({ services: svc }) => {
      svc.forEach((s) => {
        const row = reportData.get(s.id)
        if (row) {
          count += row.count
          revenue += row.totalRevenue
        }
      })
    })
    return { grandCount: count, grandRevenue: revenue }
  }, [categoriesWithServices, reportData])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: meta?.currency ?? 'UZS',
      minimumFractionDigits: 0,
    }).format(value)

  const handleExecute = () => {
    // Filters already applied via state; re-render is automatic
  }

  const handleReset = () => {
    setStartDate(dayjs())
    setEndDate(dayjs())
    setFilterDoctorId('')
    setFilterCategoryId('')
  }

  const handleExportExcel = () => {
    const rows: (string | number)[][] = [
      ['№', 'Название услуги', 'Доктора', 'Количество', 'Цена', 'Общая сумма'],
    ]
    let idx = 1
    categoriesWithServices.forEach(({ category, services: svc }) => {
      rows.push([category.name])
      svc.forEach((s) => {
        const row = reportData.get(s.id)
        const count = row?.count ?? 0
        const total = row?.totalRevenue ?? 0
        const doctorsStr = row?.doctorNames?.length ? row.doctorNames.join(', ') : '-'
        rows.push([idx++, s.name, doctorsStr, count, s.price, total])
      })
      rows.push([])
    })
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Отчет по услугам')
    XLSX.writeFile(wb, `Отчет_по_услугам_${startDate.format('DD.MM.YYYY')}_${endDate.format('DD.MM.YYYY')}.xlsx`)
  }

  const handlePrint = () => window.print()

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Отчет по услугам</Typography>
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={400} />
        </Stack>
      </Box>
    )
  }

  return (
    <Box className="print-content" sx={{ p: 3, bgcolor: '#f5f6f8', minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1a237e' }} className="no-print">
        Отчет по услугам
      </Typography>

      {/* Filter bar */}
      <Card className="no-print" sx={{ mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <DatePicker
              label="Дата от"
              value={startDate}
              onChange={(d) => d && setStartDate(d)}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 160 } } }}
            />
            <DatePicker
              label="Дата до"
              value={endDate}
              onChange={(d) => d && setEndDate(d)}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 160 } } }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Доктор</InputLabel>
              <Select
                value={filterDoctorId}
                label="Доктор"
                onChange={(e) => setFilterDoctorId(e.target.value)}
              >
                <MenuItem value="">Все</MenuItem>
                {doctors.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.fullName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Категория</InputLabel>
              <Select
                value={filterCategoryId}
                label="Категория"
                onChange={(e) => setFilterCategoryId(e.target.value)}
              >
                <MenuItem value="">Все</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleExecute} sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}>
              Выполнить
            </Button>
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleReset} sx={{ borderColor: '#ed6c02', color: '#ed6c02', '&:hover': { borderColor: '#e65100', bgcolor: 'rgba(237,108,2,0.08)' } }}>
              Сбросить
            </Button>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExportExcel} sx={{ borderColor: '#ed6c02', color: '#ed6c02', '&:hover': { borderColor: '#e65100', bgcolor: 'rgba(237,108,2,0.08)' } }}>
              Экспорт Excel
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ borderColor: '#1976d2', color: '#1976d2' }}>
              Печать
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="subtitle1" sx={{ mb: 2, color: '#546e7a' }}>
        Отчет по услугам: {startDate.format('DD.MM.YYYY')} — {endDate.format('DD.MM.YYYY')}
      </Typography>

      {/* Table */}
      <Paper sx={{ overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#e3f2fd', fontWeight: 700, color: '#0d47a1' } }}>
                <TableCell width={48}>№</TableCell>
                <TableCell>Название услуги</TableCell>
                <TableCell>Доктора (кто выполнял)</TableCell>
                <TableCell align="right" width={100}>Количество</TableCell>
                <TableCell align="right" width={120}>Цена</TableCell>
                <TableCell align="right" width={140}>Общая сумма</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categoriesWithServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Нет данных за выбранный период. Измените фильтры или период.
                  </TableCell>
                </TableRow>
              ) : (
                categoriesWithServices.map(({ category, services: svc }) => {
                  const collapsed = collapsedCategories.has(category.id)
                  const color = CATEGORY_COLORS[category.id] ?? '#5c6bc0'
                  const catCount = svc.reduce((sum, s) => sum + (reportData.get(s.id)?.count ?? 0), 0)
                  const catRevenue = svc.reduce((sum, s) => sum + (reportData.get(s.id)?.totalRevenue ?? 0), 0)
                  return (
                    <React.Fragment key={category.id}>
                      <TableRow
                        sx={{
                          bgcolor: color,
                          color: 'white',
                          '& td': { fontWeight: 700, fontSize: '0.95rem', py: 1.5 },
                        }}
                      >
                        <TableCell colSpan={6} sx={{ color: 'inherit' }}>
                          <IconButton size="small" onClick={() => toggleCategory(category.id)} sx={{ color: 'white', mr: 0.5, p: 0.25 }}>
                            {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                          </IconButton>
                          {category.name}
                        </TableCell>
                      </TableRow>
                      <Collapse in={!collapsed} timeout="auto" unmountOnExit>
                        <TableRow sx={{ bgcolor: '#e8eaf6', '& th': { fontWeight: 600, color: '#3949ab' } }}>
                          <TableCell colSpan={2} component="th">Название услуги</TableCell>
                          <TableCell component="th">Доктора (кто выполнял)</TableCell>
                          <TableCell align="right" component="th">Количество</TableCell>
                          <TableCell align="right" component="th">Цена</TableCell>
                          <TableCell align="right" component="th">Общая сумма</TableCell>
                        </TableRow>
                        {svc.map((s, index) => {
                          const row = reportData.get(s.id)
                          const count = row?.count ?? 0
                          const total = row?.totalRevenue ?? 0
                          const doctorNames = row?.doctorNames ?? []
                          return (
                            <TableRow
                              key={s.id}
                              sx={{
                                '&:nth-of-type(even)': { bgcolor: '#fafafa' },
                                '&:hover': { bgcolor: '#e3f2fd' },
                              }}
                            >
                              <TableCell sx={{ width: 48 }}>{index + 1}</TableCell>
                              <TableCell>{s.name}</TableCell>
                              <TableCell>
                                {doctorNames.length > 0 ? (
                                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                    {doctorNames.map((name) => (
                                      <Chip key={name} label={name} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                                    ))}
                                  </Stack>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell align="right">{count}</TableCell>
                              <TableCell align="right">{formatCurrency(s.price)}</TableCell>
                              <TableCell align="right">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow sx={{ bgcolor: '#ffebee', '& td': { fontWeight: 700, color: '#b71c1c' } }}>
                          <TableCell colSpan={3}>ИТОГО по категории</TableCell>
                          <TableCell align="right">{catCount}</TableCell>
                          <TableCell align="right">—</TableCell>
                          <TableCell align="right">{formatCurrency(catRevenue)}</TableCell>
                        </TableRow>
                      </Collapse>
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Grand total card */}
      <Card sx={{ mt: 3, bgcolor: '#1a237e', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <CardContent sx={{ py: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Всего услуг выполнено: {grandCount}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Общий доход: {formatCurrency(grandRevenue)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </Box>
  )
}
