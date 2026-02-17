import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { MainPage } from './pages/MainPage'
import { RegistrationPage } from './pages/RegistrationPage'
import { ReportsPage } from './pages/ReportsPage'
import { PatientsPage } from './pages/PatientsPage'
import { CashPage } from './pages/CashPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<MainPage />} />
        <Route path="registration" element={<RegistrationPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="cash" element={<CashPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

