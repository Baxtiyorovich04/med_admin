import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import './index.css'
import App from './App.tsx'
import { theme } from './theme'

dayjs.locale('ru')

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)

