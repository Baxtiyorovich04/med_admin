import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { clinicMockRepository } from '../repositories/clinicRepository.mock'
import type { RegistrationDraft, Patient, Service, Doctor, Meta } from '../types/clinic'

interface LocationState {
  registrationDraftId?: string
}

interface DbData {
  meta?: Meta
  registrationDrafts: RegistrationDraft[]
  patients: Patient[]
  services: Service[]
  doctors: Doctor[]
}

export function CashPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isPaid, setIsPaid] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'debt'>('cash')
  const [receiptOpen, setReceiptOpen] = useState(false)

  const state = location.state as LocationState | null
  const registrationDraftId = state?.registrationDraftId

  // Load db data from localStorage
  const [dbData, setDbData] = useState<DbData | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem('clinic_db_mock')
    if (stored) {
      try {
        setDbData(JSON.parse(stored))
      } catch {
        // fallback
      }
    }
  }, [])

  if (!registrationDraftId) {
    return (
      <Typography color="error">
        Ошибка: ID регистрации не найден. Пожалуйста, вернитесь на страницу регистрации.
      </Typography>
    )
  }

  const draft = dbData?.registrationDrafts.find((d) => d.id === registrationDraftId)
  const patient = draft ? dbData?.patients.find((p) => p.id === draft.patientId) : null

  if (!draft || !patient) {
    return <Typography>Загрузка данных...</Typography>
  }

  const getServiceName = (serviceId: string) => {
    return dbData?.services.find((s) => s.id === serviceId)?.name || 'Unknown Service'
  }

  const getDoctorName = (doctorId: string) => {
    return dbData?.doctors.find((d) => d.id === doctorId)?.fullName || 'Not assigned'
  }

  const fullName = `${patient.lastName} ${patient.firstName} ${patient.middleName || ''}`.trim()
  const today = new Date().toLocaleDateString('ru-RU')
  const clinicName = (dbData?.meta as any)?.clinicName || 'МедиЦентр'

  const handlePrintReceipt = () => {
    const servicesHtml = draft.services
      .map(
        (service) =>
          `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${getServiceName(service.serviceId)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${getDoctorName(service.doctorId)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: 600;">${service.price.toLocaleString('ru-RU')} UZS</td>
      </tr>`,
      )
      .join('')

    const discountRow =
      draft.discountAmount > 0
        ? `<tr>
        <td colspan="2" style="padding: 8px; text-align: right;">Скидка</td>
        <td style="padding: 8px; text-align: right; color: #d32f2f; font-weight: 600;">-${draft.discountAmount.toLocaleString('ru-RU')} UZS</td>
      </tr>`
        : ''

    const paymentMethodLabel = {
      cash: 'Наличные',
      card: 'Карта',
      debt: 'В кредит (долг)',
    }[paymentMethod]

    const paidLabel = isPaid ? 'ОПЛАЧЕНО' : 'НЕ ОПЛАЧЕНО'

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Запись об оплате</title>
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              width: 80mm;
            }
          }
          body {
            font-family: Arial, sans-serif;
            max-width: 80mm;
            margin: 0;
            padding: 2mm;
            color: #000;
            font-size: 2mm;
            line-height: 1.3;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 2mm;
            margin-bottom: 2mm;
          }
          .header h1 {
            margin: 1mm 0;
            font-size: 3mm;
            font-weight: bold;
          }
          .clinic-name {
            font-size: 1.8mm;
            margin: 0;
          }
          .patient-info {
            padding: 1mm 0;
            margin-bottom: 2mm;
            border-bottom: 1px dashed #000;
          }
          .patient-info h3 {
            margin: 0;
            font-size: 1.8mm;
            font-weight: bold;
          }
          .patient-info p {
            margin: 0.5mm 0;
            font-size: 2mm;
          }
          .section-title {
            font-size: 1.8mm;
            font-weight: bold;
            margin-top: 1mm;
            margin-bottom: 1mm;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2mm;
            font-size: 1.8mm;
          }
          th {
            padding: 0.5mm;
            text-align: left;
            font-size: 1.8mm;
            font-weight: bold;
            border-bottom: 1px solid #000;
          }
          td {
            padding: 0.5mm;
            font-size: 1.8mm;
          }
          .total-box {
            padding: 1mm;
            margin-bottom: 2mm;
            border: 1px solid #000;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5mm;
            font-size: 2mm;
          }
          .total-final {
            display: flex;
            justify-content: space-between;
            padding-top: 0.5mm;
            border-top: 1px solid #000;
            font-size: 2.5mm;
            font-weight: bold;
          }
          .payment-info {
            padding: 1mm;
            margin-bottom: 2mm;
            border: 1px solid #000;
          }
          .payment-info h4 {
            margin: 0;
            font-size: 2mm;
            font-weight: bold;
          }
          .payment-info p {
            margin: 0.5mm 0;
            font-size: 1.8mm;
          }
          .footer {
            text-align: center;
            font-size: 1.5mm;
            margin-top: 2mm;
            padding-top: 1mm;
            border-top: 1px dashed #000;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Запись об оплате</h1>
          <p class="clinic-name">${clinicName}</p>
        </div>

        <div class="patient-info">
          <h3>Пациент</h3>
          <p><strong>${fullName}</strong></p>
          <p>Телефон: ${patient.phone}</p>
          <p>Дата: ${today}</p>
        </div>

        <div class="section-title">Услуги</div>
        <table>
          <thead>
            <tr>
              <th>Услуга</th>
              <th>Врач</th>
              <th style="text-align: right;">Цена</th>
            </tr>
          </thead>
          <tbody>
            ${servicesHtml}
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row">
            <span>Сумма:</span>
            <span>${draft.subtotal.toLocaleString('ru-RU')} UZS</span>
          </div>
          ${discountRow ? `<div class="total-row"><span>Скидка:</span><span style="color: #d32f2f;">-${draft.discountAmount.toLocaleString('ru-RU')} UZS</span></div>` : ''}
          <div class="total-final">
            <span>ИТОГО:</span>
            <span>${draft.total.toLocaleString('ru-RU')} UZS</span>
          </div>
        </div>

        <div class="payment-info">
          <h4>${paidLabel}</h4>
          <p><strong>Способ оплаты:</strong> ${paymentMethodLabel}</p>
          ${paymentMethod === 'debt' ? `<p><strong>Сумма долга:</strong> ${draft.total.toLocaleString('ru-RU')} UZS</p>` : `<p><strong>Оплачено:</strong> ${draft.total.toLocaleString('ru-RU')} UZS</p>`}
        </div>

        <div class="footer">
          <p>Спасибо за посещение!</p>
          <p style="margin-top: 10px; font-size: 10px;">Дата и время: ${new Date().toLocaleString('ru-RU')}</p>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleCompletePayment = () => {
    if (!isPaid) {
      alert('Пожалуйста, отметьте статус оплаты')
      return
    }

    handlePrintReceipt()
    setReceiptOpen(true)
  }

  return (
    <>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
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
            Оплата регистрации
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Завершите платеж и получите квитанцию
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Left: Services and Payment Summary */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              {/* Patient Info Card */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Информация о пациенте
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Пациент
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{fullName}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      Телефон
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{patient.phone}</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Services Table */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Услуги и врачи
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Услуга</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Врач</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Цена
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {draft.services.map((service, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{getServiceName(service.serviceId)}</TableCell>
                          <TableCell>{getDoctorName(service.doctorId)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {service.price.toLocaleString('ru-RU')} UZS
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Stack>
          </Grid>

          {/* Right: Payment Section */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2.5}>
              {/* Total Card */}
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  border: '2px solid #667eea',
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Сумма</Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {draft.subtotal.toLocaleString('ru-RU')} UZS
                      </Typography>
                    </Box>
                    {draft.discountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Скидка</Typography>
                        <Typography sx={{ fontWeight: 600, color: '#d32f2f' }}>
                          -{draft.discountAmount.toLocaleString('ru-RU')} UZS
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        pt: 1.5,
                        borderTop: '2px solid rgba(102, 126, 234, 0.3)',
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        ИТОГО
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {draft.total.toLocaleString('ru-RU')} UZS
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Способ оплаты
                </Typography>
                <ButtonGroup fullWidth variant="outlined" size="small">
                  <Button
                    onClick={() => setPaymentMethod('cash')}
                    variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
                    sx={{
                      background: paymentMethod === 'cash' ? '#1976d2' : 'transparent',
                      color: paymentMethod === 'cash' ? 'white' : '#1976d2',
                      fontWeight: 600,
                      '&:hover': {
                        background: paymentMethod === 'cash' ? '#1565c0' : 'rgba(25, 118, 210, 0.1)',
                      },
                    }}
                  >
                    Наличные
                  </Button>
                  <Button
                    onClick={() => setPaymentMethod('card')}
                    variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
                    sx={{
                      background: paymentMethod === 'card' ? '#1976d2' : 'transparent',
                      color: paymentMethod === 'card' ? 'white' : '#1976d2',
                      fontWeight: 600,
                      '&:hover': {
                        background: paymentMethod === 'card' ? '#1565c0' : 'rgba(25, 118, 210, 0.1)',
                      },
                    }}
                  >
                    Карта
                  </Button>
                  <Button
                    onClick={() => setPaymentMethod('debt')}
                    variant={paymentMethod === 'debt' ? 'contained' : 'outlined'}
                    sx={{
                      background: paymentMethod === 'debt' ? '#ff9800' : 'transparent',
                      color: paymentMethod === 'debt' ? 'white' : '#ff9800',
                      fontWeight: 600,
                      '&:hover': {
                        background: paymentMethod === 'debt' ? '#f57c00' : 'rgba(255, 152, 0, 0.1)',
                      },
                    }}
                  >
                    В кредит
                  </Button>
                </ButtonGroup>
              </Box>



              {/* Payment Status */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Статус платежа
                </Typography>
                <ButtonGroup fullWidth variant="outlined">
                  <Button
                    onClick={() => setIsPaid(false)}
                    variant={!isPaid ? 'contained' : 'outlined'}
                    sx={{
                      background: !isPaid ? '#ff9800' : 'transparent',
                      color: !isPaid ? 'white' : '#ff9800',
                      fontWeight: 600,
                      '&:hover': {
                        background: !isPaid ? '#f57c00' : 'rgba(255, 152, 0, 0.1)',
                      },
                    }}
                  >
                    Не оплачено
                  </Button>
                  <Button
                    onClick={() => setIsPaid(true)}
                    variant={isPaid ? 'contained' : 'outlined'}
                    sx={{
                      background: isPaid ? '#4caf50' : 'transparent',
                      color: isPaid ? 'white' : '#4caf50',
                      fontWeight: 600,
                      '&:hover': {
                        background: isPaid ? '#45a049' : 'rgba(76, 175, 80, 0.1)',
                      },
                    }}
                  >
                    Оплачено
                  </Button>
                </ButtonGroup>
              </Box>

              {/* Action Buttons */}
              <Stack spacing={1} sx={{ pt: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleCompletePayment}
                  disabled={!isPaid && paymentMethod !== 'debt'}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                    '&:disabled': {
                      background: 'rgba(0,0,0,0.12)',
                    },
                  }}
                >
                  Завершить платеж
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/registration')}
                  sx={{
                    borderColor: '#ccc',
                    color: '#666',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#999',
                      backgroundColor: 'rgba(0,0,0,0.02)',
                    },
                  }}
                >
                  Вернуться к регистрации
                </Button>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      {/* Completion Dialog */}
      <Dialog open={receiptOpen} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          ✓ Платеж завершен
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {fullName}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Регистрация успешно завершена
              </Typography>
            </Box>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                background: '#f9f9f9',
              }}
            >
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Сумма:</Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {draft.total.toLocaleString('ru-RU')} UZS
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Способ оплаты:</Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {paymentMethod === 'cash' && 'Наличные'}
                    {paymentMethod === 'card' && 'Карта'}
                    {paymentMethod === 'debt' && 'В кредит (долг)'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Статус:</Typography>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: isPaid ? '#4caf50' : '#ff9800',
                    }}
                  >
                    {isPaid ? 'ОПЛАЧЕНО' : 'НЕ ОПЛАЧЕНО'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 1 }}>
              Квитанция была отправлена на печать.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setReceiptOpen(false)
              navigate('/patients')
            }}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
              },
            }}
          >
            Завершить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

