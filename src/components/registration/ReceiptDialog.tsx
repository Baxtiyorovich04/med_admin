import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Stack,
    ButtonGroup,
    Card,
    CardContent,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { clinicMockRepository } from '../../repositories/clinicRepository.mock'
import type { RegistrationDraft, Patient, Service, Doctor } from '../../types/clinic'

interface ReceiptDialogProps {
    open: boolean
    draft: RegistrationDraft | null
    patient: Patient | null
    onClose: () => void
    onPrint: () => void
}

export function ReceiptDialog({ open, draft, patient, onClose, onPrint }: ReceiptDialogProps) {
    const [isPaid, setIsPaid] = useState(false)

    const { data: services = [] } = useQuery({
        queryKey: ['clinic', 'services'],
        queryFn: () => clinicMockRepository.getServices(),
        enabled: open,
    })

    const { data: doctors = [] } = useQuery({
        queryKey: ['clinic', 'doctors'],
        queryFn: () => clinicMockRepository.getDoctors(),
        enabled: open,
    })

    const { data: dictionaries } = useQuery({
        queryKey: ['clinic', 'dictionaries'],
        queryFn: () => clinicMockRepository.getDictionaries(),
        enabled: open,
    })

    if (!draft || !patient) return null

    const getServiceName = (serviceId: string) => {
        return services.find((s) => s.id === serviceId)?.name || 'Unknown Service'
    }

    const getDoctorName = (doctorId: string) => {
        return doctors.find((d) => d.id === doctorId)?.fullName || 'Not assigned'
    }

    const handleClose = () => {
        setIsPaid(false)
        onClose()
    }

    const fullName = `${patient.lastName} ${patient.firstName} ${patient.middleName || ''}`.trim()
    const today = new Date().toLocaleDateString('ru-RU')
    const clinicName = dictionaries?.meta?.clinicName || 'МедиЦентр'

    return (
        <Dialog open={open} maxWidth="sm" fullWidth onClose={handleClose}>
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 700,
                    textAlign: 'center',
                    pb: 1,
                }}
            >
                <Stack spacing={0.5}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 400, opacity: 0.9 }}>
                        {clinicName}
                    </Typography>
                    <Typography>
                        Квитанция о регистрации
                    </Typography>
                </Stack>
            </DialogTitle>
            <DialogContent
                sx={{
                    pt: 3,
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#ccc',
                        borderRadius: '3px',
                    },
                }}
            >
                <Stack spacing={2.5}>
                    {/* Header Info */}
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                            border: '1px solid rgba(102, 126, 234, 0.2)',
                            borderRadius: 2,
                        }}
                    >
                        <Stack spacing={1.5}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    ПАЦИЕНТ
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#333', mt: 0.5 }}>
                                    {fullName}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        ДАТА
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                                        {today}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        ТЕЛЕФОН
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                                        {patient.phone}
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* Services Table */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                            УСЛУГИ
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ background: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Услуга</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Врач</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                            Цена
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {draft.services.map((service, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell sx={{ fontSize: '0.85rem' }}>{getServiceName(service.serviceId)}</TableCell>
                                            <TableCell sx={{ fontSize: '0.85rem' }}>{getDoctorName(service.doctorId)}</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                {service.price.toLocaleString('ru-RU')} UZS
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Payment Summary */}
                    <Card
                        variant="outlined"
                        sx={{
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
                            border: '1px solid rgba(102, 126, 234, 0.2)',
                        }}
                    >
                        <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                            <Stack spacing={1.5}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Сумма
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {draft.subtotal.toLocaleString('ru-RU')} UZS
                                    </Typography>
                                </Box>
                                {draft.discountAmount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Скидка
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                            -{draft.discountAmount.toLocaleString('ru-RU')} UZS
                                        </Typography>
                                    </Box>
                                )}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        pt: 1,
                                        borderTop: '2px solid rgba(102, 126, 234, 0.2)',
                                    }}
                                >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        ИТОГО
                                    </Typography>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 700,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            fontSize: '1.1rem',
                                        }}
                                    >
                                        {draft.total.toLocaleString('ru-RU')} UZS
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Payment Status */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}>
                            СТАТУС ПЛАТЕЖА
                        </Typography>
                        <ButtonGroup fullWidth variant="outlined" size="small">
                            <Button
                                onClick={() => setIsPaid(false)}
                                variant={!isPaid ? 'contained' : 'outlined'}
                                sx={{
                                    background: !isPaid ? '#ff9800' : 'transparent',
                                    borderColor: '#ff9800',
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
                                    borderColor: '#4caf50',
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

                    {/* Payment Method */}
                    {draft.paymentMethod && (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1.5,
                                background: '#f9f9f9',
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                СПОСОБ ОПЛАТЫ
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {draft.paymentMethod === 'cash' && 'Наличные'}
                                    {draft.paymentMethod === 'card' && 'Карта'}
                                    {draft.paymentMethod === 'debt' && 'В кредит (долг)'}
                                </Typography>
                                {draft.paidAmount !== undefined && draft.paidAmount > 0 && (
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                                        Внесено: {draft.paidAmount.toLocaleString('ru-RU')} UZS
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions
                sx={{
                    p: 2,
                    borderTop: '1px solid #e0e0e0',
                    background: 'rgba(0,0,0,0.01)',
                    display: 'flex',
                    gap: 1,
                }}
            >
                <Button
                    onClick={handleClose}
                    sx={{
                        color: '#666',
                        borderColor: '#ccc',
                        '&:hover': {
                            borderColor: '#999',
                            backgroundColor: 'rgba(0,0,0,0.02)',
                        },
                    }}
                    variant="outlined"
                >
                    Закрыть
                </Button>
                <Button
                    onClick={() => {
                        onPrint()
                        handleClose()
                    }}
                    variant="contained"
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        },
                    }}
                >
                    Печать квитанции
                </Button>
            </DialogActions>
        </Dialog>
    )
}
