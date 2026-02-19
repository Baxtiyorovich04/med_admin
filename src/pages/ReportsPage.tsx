import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  Grid2 as Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material'
import { useState, useMemo, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, Table as DocTable, TableRow as DocTableRow, TableCell as DocTableCell, VerticalAlign, AlignmentType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import { clinicMockRepository } from '../repositories/clinicRepository.mock'
import type { IncomeEntry, Patient, Meta } from '../types/clinic'

interface IncomeData extends IncomeEntry {
  patientName?: string
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0']

export function ReportsPage() {
  const [filterType, setFilterType] = useState<'week' | 'custom'>('week')
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(7, 'days'))
  const [endDate, setEndDate] = useState<Dayjs>(dayjs())
  const [incomeData, setIncomeData] = useState<IncomeData[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [patientsData, dictionaries] = await Promise.all([
          clinicMockRepository.getPatients(),
          clinicMockRepository.getDictionaries(),
        ])
        setPatients(patientsData)
        setMeta(dictionaries.meta)

        // Try to fetch income data from db.json
        try {
          const response = await fetch('/db.json')
          if (!response.ok) throw new Error('Failed to load db.json')
          const dbData = await response.json()
          const enrichedIncome = (dbData.income || []).map((entry: IncomeEntry) => {
            const patient = patientsData.find((p) => p.id === entry.patientId)
            return {
              ...entry,
              patientName: patient
                ? `${patient.lastName} ${patient.firstName}`
                : 'Unknown',
            }
          })
          setIncomeData(enrichedIncome)
        } catch (fetchError) {
          console.warn('Could not load income data from db.json:', fetchError)
          setIncomeData([])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Ошибка при загрузке данных. Пожалуйста, попробуйте перезагрузить страницу.')
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter data based on selected date range
  const filteredData = useMemo(() => {
    return incomeData.filter((entry) => {
      const entryDate = dayjs(entry.date)
      return entryDate.isBetween(startDate, endDate, null, '[]')
    })
  }, [incomeData, startDate, endDate])

  // Get debt entries (unpaid/debt payments)
  const debtEntries = useMemo(
    () => filteredData.filter((entry) => entry.paymentMethod === 'debt'),
    [filteredData],
  )

  // Calculate totals
  const totals = useMemo(() => {
    return {
      cash: filteredData
        .filter((e) => e.paymentMethod === 'cash')
        .reduce((sum, e) => sum + e.amount, 0),
      card: filteredData
        .filter((e) => e.paymentMethod === 'card')
        .reduce((sum, e) => sum + e.amount, 0),
      debt: filteredData
        .filter((e) => e.paymentMethod === 'debt')
        .reduce((sum, e) => sum + e.amount, 0),
      total: filteredData.reduce((sum, e) => sum + e.amount, 0),
    }
  }, [filteredData])

  // Prepare chart data
  const dailyData = useMemo(() => {
    const data: Record<
      string,
      {
        date: string
        cash: number
        card: number
        debt: number
      }
    > = {}

    let current = startDate.clone()
    while (current.isBefore(endDate) || current.isSame(endDate)) {
      const dateStr = current.format('YYYY-MM-DD')
      data[dateStr] = { date: current.format('ddd DD'), cash: 0, card: 0, debt: 0 }
      current = current.add(1, 'day')
    }

    filteredData.forEach((entry) => {
      const dateStr = entry.date.substring(0, 10)
      if (data[dateStr]) {
        data[dateStr][entry.paymentMethod || 'cash'] += entry.amount
      }
    })

    return Object.values(data)
  }, [filteredData, startDate, endDate])

  const paymentMethodData = [
    { name: 'Наличные', value: totals.cash },
    { name: 'Карта', value: totals.card },
    { name: 'Долг', value: totals.debt },
  ]

  const handleSetWeekly = () => {
    setFilterType('week')
    setStartDate(dayjs().subtract(6, 'days'))
    setEndDate(dayjs())
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: meta?.currency || 'UZS',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new()

    // Summary sheet
    const summaryData = [
      ['ФИНАНСОВЫЙ ОТЧЕТ'],
      [`Период: ${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}`],
      [],
      ['Показатель', 'Сумма'],
      ['Всего доход', totals.total],
      ['Наличные', totals.cash],
      ['Карта', totals.card],
      ['Задолженность', totals.debt],
    ]

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Резюме')

    // Daily data sheet
    const dailySheetData = [
      ['Дата', 'Наличные', 'Карта', 'Долг', 'Итого'],
      ...dailyData.map((d) => [
        d.date,
        d.cash,
        d.card,
        d.debt,
        d.cash + d.card + d.debt,
      ]),
    ]

    const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData)
    dailySheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, dailySheet, 'По дням')

    // Detailed transactions sheet
    const detailedData = [
      ['Дата', 'Пациент', 'Описание', 'Сумма', 'Способ оплаты'],
      ...filteredData.map((entry) => [
        entry.date,
        entry.patientName || 'Unknown',
        entry.description,
        entry.amount,
        entry.paymentMethod === 'cash'
          ? 'Наличные'
          : entry.paymentMethod === 'card'
            ? 'Карта'
            : 'Долг',
      ]),
    ]

    const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData)
    detailedSheet['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Все транзакции')

    // Debt sheet
    if (debtEntries.length > 0) {
      const debtData = [
        ['ЗАДОЛЖЕННОСТЬ'],
        [`Всего задолженности: ${formatCurrency(totals.debt)}`],
        [],
        ['Дата', 'Пациент', 'Описание', 'Сумма'],
        ...debtEntries.map((entry) => [
          entry.date,
          entry.patientName || 'Unknown',
          entry.description,
          entry.amount,
        ]),
      ]

      const debtSheet = XLSX.utils.aoa_to_sheet(debtData)
      debtSheet['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(workbook, debtSheet, 'Задолженность')
    }

    const filename = `Финансовый_отчет_${startDate.format('DD.MM.YYYY')}_${endDate.format('DD.MM.YYYY')}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  const exportToWord = async () => {
    const createTable = (headers: string[], data: (string | number)[][]): DocTable => {
      return new DocTable({
        rows: [
          new DocTableRow({
            cells: headers.map(
              (header) =>
                new DocTableCell({
                  children: [new Paragraph(header)],
                  shading: { fill: 'E0E0E0' },
                  verticalAlign: VerticalAlign.CENTER,
                }),
            ),
          }),
          ...data.map(
            (row) =>
              new DocTableRow({
                cells: row.map(
                  (cell) =>
                    new DocTableCell({
                      children: [new Paragraph(String(cell))],
                      verticalAlign: VerticalAlign.CENTER,
                    }),
                ),
              }),
          ),
        ],
        width: { size: 100, type: 'pct' },
      })
    }

    const sections = [
      new Paragraph({
        text: 'ФИНАНСОВЫЙ ОТЧЕТ',
        bold: true,
        size: 28,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `Период: ${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}`,
        size: 22,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),

      new Paragraph({
        text: 'РЕЗЮМЕ',
        bold: true,
        size: 24,
        spacing: { before: 200, after: 200 },
      }),
      createTable(
        ['Показатель', 'Сумма'],
        [
          ['Всего доход', formatCurrency(totals.total)],
          ['Наличные', formatCurrency(totals.cash)],
          ['Карта', formatCurrency(totals.card)],
          ['Задолженность', formatCurrency(totals.debt)],
        ],
      ),

      new Paragraph({
        text: 'ПО ДНЯМ',
        bold: true,
        size: 24,
        spacing: { before: 400, after: 200 },
      }),
      createTable(
        ['Дата', 'Наличные', 'Карта', 'Долг', 'Итого'],
        dailyData.map((d) => [
          d.date,
          formatCurrency(d.cash),
          formatCurrency(d.card),
          formatCurrency(d.debt),
          formatCurrency(d.cash + d.card + d.debt),
        ]),
      ),

      new Paragraph({
        text: 'ВСЕ ТРАНЗАКЦИИ',
        bold: true,
        size: 24,
        spacing: { before: 400, after: 200 },
      }),
      createTable(
        ['Дата', 'Пациент', 'Описание', 'Сумма', 'Способ оплаты'],
        filteredData.map((entry) => [
          entry.date,
          entry.patientName || 'Unknown',
          entry.description,
          formatCurrency(entry.amount),
          entry.paymentMethod === 'cash'
            ? 'Наличные'
            : entry.paymentMethod === 'card'
              ? 'Карта'
              : 'Долг',
        ]),
      ),
    ]

    if (debtEntries.length > 0) {
      sections.push(
        new Paragraph({
          text: 'ЗАДОЛЖЕННОСТЬ',
          bold: true,
          size: 24,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          text: `Всего задолженности: ${formatCurrency(totals.debt)}`,
          bold: true,
          spacing: { after: 200 },
        }),
        createTable(
          ['Дата', 'Пациент', 'Описание', 'Сумма'],
          debtEntries.map((entry) => [
            entry.date,
            entry.patientName || 'Unknown',
            entry.description,
            formatCurrency(entry.amount),
          ]),
        ),
      )
    }

    sections.push(
      new Paragraph({
        text: `Дата создания: ${dayjs().format('DD.MM.YYYY HH:mm')}`,
        size: 18,
        color: '999999',
        spacing: { before: 400 },
      }),
    )

    const doc = new Document({
      sections: [{ children: sections }],
    })

    const blob = await Packer.toBlob(doc)
    const filename = `Финансовый_отчет_${startDate.format('DD.MM.YYYY')}_${endDate.format('DD.MM.YYYY')}.docx`
    saveAs(blob, filename)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Финансовые отчёты
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Экспорт данных
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                exportToExcel()
                setExportAnchorEl(null)
              }}
            >
              📊 Экспорт в Excel
            </MenuItem>
            <MenuItem
              onClick={() => {
                exportToWord()
                setExportAnchorEl(null)
              }}
            >
              📄 Экспорт в Word
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Card sx={{ mb: 4, backgroundColor: '#ffebee', borderColor: '#f44336', border: '1px solid' }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Загрузка данных...</Typography>
          </CardContent>
        </Card>
      )}

      {/* Content - only show when not loading and no error */}
      {!loading && !error && (
        <>
          {/* Filter Section */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Фильтры</Typography>
                <ButtonGroup variant="outlined">
                  <Button
                    variant={filterType === 'week' ? 'contained' : 'outlined'}
                    onClick={handleSetWeekly}
                  >
                    Неделя (7 дней)
                  </Button>
                  <Button
                    variant={filterType === 'custom' ? 'contained' : 'outlined'}
                    onClick={() => setFilterType('custom')}
                  >
                    Произвольный период
                  </Button>
                </ButtonGroup>

                {filterType === 'custom' && (
                  <Stack direction="row" spacing={2}>
                    <DatePicker
                      label="От"
                      value={startDate}
                      onChange={(date) => date && setStartDate(date)}
                      slotProps={{ textField: { size: 'small' } }}
                    />
                    <DatePicker
                      label="До"
                      value={endDate}
                      onChange={(date) => date && setEndDate(date)}
                      slotProps={{ textField: { size: 'small' } }}
                    />
                  </Stack>
                )}

                <Typography variant="body2" color="textSecondary">
                  Период: {startDate.format('DD.MM.YYYY')} — {endDate.format('DD.MM.YYYY')}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Всего доход
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {formatCurrency(totals.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Наличные
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                    {formatCurrency(totals.cash)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Карта
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0288d1' }}>
                    {formatCurrency(totals.card)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Долг
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                    {formatCurrency(totals.debt)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Daily Income Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardHeader title="Доход по дням" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="cash" stackId="a" fill="#82ca9d" name="Наличные" />
                      <Bar dataKey="card" stackId="a" fill="#8884d8" name="Карта" />
                      <Bar dataKey="debt" stackId="a" fill="#ffc658" name="Долг" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Payment Method Pie Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardHeader title="Распределение по способу оплаты" />
                <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Cumulative Income Line Chart */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader title="Кумулятивный доход" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cash"
                        stroke="#82ca9d"
                        name="Наличные"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="card"
                        stroke="#8884d8"
                        name="Карта"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="debt"
                        stroke="#ffc658"
                        name="Долг"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Debt List */}
          {debtEntries.length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardHeader
                title={`Задолженность (${debtEntries.length} записей)`}
                subheader={`Сумма: ${formatCurrency(totals.debt)}`}
              />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Дата</TableCell>
                      <TableCell>Пациент</TableCell>
                      <TableCell>Описание</TableCell>
                      <TableCell align="right">Сумма</TableCell>
                      <TableCell>Статус</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {debtEntries.map((entry, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{dayjs(entry.date).format('DD.MM.YYYY')}</TableCell>
                        <TableCell>{entry.patientName || 'Unknown'}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell>
                          <Chip label="Долг" color="error" variant="outlined" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {/* Detailed Income List */}
          <Card>
            <CardHeader
              title={`Все транзакции (${filteredData.length} записей)`}
              subheader={`Последнее обновление: ${dayjs().format('DD.MM.YYYY HH:mm')}`}
            />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Дата</TableCell>
                    <TableCell>Пациент</TableCell>
                    <TableCell>Описание</TableCell>
                    <TableCell align="right">Сумма</TableCell>
                    <TableCell>Способ оплаты</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((entry, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{dayjs(entry.date).format('DD.MM.YYYY')}</TableCell>
                        <TableCell>{entry.patientName || 'Unknown'}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              entry.paymentMethod === 'cash'
                                ? 'Наличные'
                                : entry.paymentMethod === 'card'
                                  ? 'Карта'
                                  : 'Долг'
                            }
                            color={
                              entry.paymentMethod === 'debt'
                                ? 'error'
                                : entry.paymentMethod === 'card'
                                  ? 'info'
                                  : 'success'
                            }
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          Нет транзакций за выбранный период
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  )
}

