import { Box, Button, Paper, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const navigate = useNavigate()
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" gutterBottom>Вход</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Подключите backend API и настройте auth (см. db.txt).
        </Typography>
        <TextField fullWidth label="Логин" margin="normal" />
        <TextField fullWidth label="Пароль" type="password" margin="normal" />
        <Button fullWidth variant="contained" size="large" sx={{ mt: 3 }} onClick={() => navigate('/')}>
          Войти (заглушка)
        </Button>
      </Paper>
    </Box>
  )
}
