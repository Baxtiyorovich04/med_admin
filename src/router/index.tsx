import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { AdminLayout } from '../layouts/AdminLayout'

const MainPage = lazy(() => import('../pages/MainPage').then((m) => ({ default: m.MainPage })))
const RegistrationPage = lazy(() => import('../pages/RegistrationPage').then((m) => ({ default: m.RegistrationPage })))
const ReportsPage = lazy(() => import('../pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const ServicesReportPage = lazy(() => import('../pages/ServicesReportPage').then((m) => ({ default: m.ServicesReportPage })))
const DoctorSalaryPage = lazy(() => import('../pages/DoctorSalaryPage').then((m) => ({ default: m.DoctorSalaryPage })))
const PatientsPage = lazy(() => import('../pages/PatientsPage').then((m) => ({ default: m.PatientsPage })))
const CashPage = lazy(() => import('../pages/CashPage').then((m) => ({ default: m.CashPage })))
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })))

function PageSkeleton() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
      <CircularProgress />
    </Box>
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<MainPage />} />
          <Route path="registration" element={<RegistrationPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/services" element={<ServicesReportPage />} />
          <Route path="reports/salary" element={<DoctorSalaryPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="cash" element={<CashPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
