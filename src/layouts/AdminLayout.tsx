import { PropsWithChildren, useMemo, useState } from 'react'
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
  Button,
} from '@mui/material'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PeopleIcon from '@mui/icons-material/People'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import SettingsIcon from '@mui/icons-material/Settings'
import MenuIcon from '@mui/icons-material/Menu'
import HomeIcon from '@mui/icons-material/Home'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'

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
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)

  const title = useMemo(() => getPageTitle(location.pathname), [location.pathname])

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f8fafc' }}>
      <Box sx={{
        p: 2.5,
        borderBottom: '2px solid #e2e8f0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Button
          fullWidth
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{
            justifyContent: 'flex-start',
            mb: 1.5,
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          На главную
        </Button>
        <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
          Клиника
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Админ‑панель v1.0
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <List sx={{ p: 0 }}>
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
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: '8px',
                  transition: (theme) =>
                    theme.transitions.create(['all'], {
                      duration: theme.transitions.duration.standard,
                    }),
                  borderLeft: '4px solid transparent',
                  '&:hover': {
                    bgcolor: '#e0e7ff',
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    bgcolor: '#e0e7ff',
                    color: '#667eea',
                    fontWeight: 600,
                    borderLeftColor: '#667eea',
                    '& .MuiListItemIcon-root': {
                      color: '#667eea',
                    },
                    '&:hover': {
                      bgcolor: '#dfe8ff',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 40,
                  color: selected ? 'white' : '#64748b',
                  transition: 'color 0.2s'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: '0.95rem',
                      fontWeight: selected ? 600 : 500,
                    }
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Box>
      <Box sx={{
        p: 2,
        borderTop: '1px solid #e2e8f0',
        bgcolor: '#f1f5f9',
        fontSize: '0.75rem',
        color: '#64748b',
        textAlign: 'center'
      }}>
        © 2026 Med Admin
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
          ml: { sm: desktopSidebarOpen ? `${drawerWidth}px` : 0 },
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 2, display: { sm: 'none' } }}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}
            onClick={() => setDesktopSidebarOpen((open) => !open)}
          >
            {desktopSidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Button
            color="primary"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            На главную
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: desktopSidebarOpen ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}>
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
            display: { xs: 'none', sm: desktopSidebarOpen ? 'block' : 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transition: (theme) =>
                theme.transitions.create('transform', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
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
          width: { sm: desktopSidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          mt: 8,
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

