/**
 * Sample feature wiring: TanStack Query + useServices hook.
 * Use this pattern for other lists (doctors, patients, etc.).
 */
import { Box, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material'
import { useServices } from './hooks'
import { formatCurrencyUZS } from '../../utils/format'

export function ServicesListSample() {
  const { data: services, isLoading, isError, error } = useServices({ activeOnly: true })

  if (isLoading) {
    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Услуга</TableCell><TableCell>Цена</TableCell></TableRow></TableHead>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton width="80%" /></TableCell>
                <TableCell><Skeleton width={60} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  if (isError) {
    return <Typography color="error">Ошибка: {(error as Error).message}</Typography>
  }

  if (!services?.length) {
    return <Typography color="text.secondary">Нет услуг</Typography>
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Услуга</TableCell>
            <TableCell align="right">Цена (UZS)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.name}</TableCell>
              <TableCell align="right">{formatCurrencyUZS(s.price)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
