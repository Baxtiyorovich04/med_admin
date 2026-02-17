import { PropsWithChildren, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PeopleIcon from '@mui/icons-material/People'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import SettingsIcon from '@mui/icons-material/Settings'
import MenuIcon from '@mui/icons-material/Menu'
import { useState } from 'react'

const drawerWidth = 260

type NavItem = {
  label: string
  path: string
  icon: JSX.Element
}

const navItems: NavItem[] = [
  { label: 'Регистрация', path: '/registration', icon: <AssignmentIndIcon /> },
  { label: 'Отчёты', path: '/reports', icon: <AssessmentIcon /> },
  { label: 'Пациенты', path: '/patients', icon: <PeopleIcon /> },
  { label: 'Касса', path: '/cash', icon: <PointOfSaleIcon /> },
  { label: 'Настройки', path: '/settings', icon: <SettingsIcon /> },
]

function getPageTitle(pathname: string): string {
  const item = navItems.find((n) => pathname.startsWith(n.path))
  return item?.label ?? 'Админ‑панель'
}

export function AdminLayout(_props: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const title = useMemo(() => getPageTitle(location.pathname), [location.pathname])

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
        <Typography variant="h6" fontWeight={700}>
          Клиника
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Админ‑панель
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List>
          {navItems.map((item) => {
            const selected = location.pathname.startsWith(item.path)
            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => {
                  navigate(item.path)
                  setMobileOpen(false)
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            )
          })}
        </List>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 2, display: { sm: 'none' } }}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

