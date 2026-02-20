import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  Typography,
  InputAdornment,
  Drawer,
  Grid,
  Skeleton,
  Alert,
  Snackbar,
  OutlinedInput,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { clinicRepository } from '../repositories/clinicRepository.mock';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Service {
  id: number;
  name: string;
  categoryId?: number;
  duration?: number;
  price: number;
  currency: string;
  description?: string;
  isActive: boolean;
}

interface Doctor {
  id: number;
  fullName: string;
  specialization: string;
  phone?: string;
  email?: string;
  description?: string;
  serviceIds: number[];
  isActive: boolean;
}

interface Patient {
  id: number;
  fullName: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  notes?: string;
  isArchived: boolean;
}

type TabValue = 'services' | 'doctors' | 'patients';
type SnackbarType = 'success' | 'error' | 'info';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SettingsPage() {
  const [currentTab, setCurrentTab] = useState<TabValue>('services');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: SnackbarType;
  }>({ open: false, message: '', type: 'success' });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  const showSnackbar = (message: string, type: SnackbarType = 'success') => {
    setSnackbar({ open: true, message, type });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#000' }}>
          Управление клиникой
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
          Управляйте услугами, доктораме и пациентамиыми
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid #e5e5e5',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '16px',
              fontWeight: 500,
              color: '#666',
              py: 2,
              '&.Mui-selected': {
                color: '#1976d2',
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: '#1976d2',
            },
          }}
        >
          <Tab label="Услуги и цены" value="services" />
          <Tab label="Доктора" value="doctors" />
          <Tab label="Пациенты" value="patients" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {currentTab === 'services' && <ServicesSection onSnackbar={showSnackbar} />}
        {currentTab === 'doctors' && <DoctorsSection onSnackbar={showSnackbar} />}
        {currentTab === 'patients' && <PatientsSection onSnackbar={showSnackbar} />}
      </Box>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.type}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

// ============================================================================
// SECTION 1: SERVICES & PRICES
// ============================================================================

interface ServicesSectionProps {
  onSnackbar: (message: string, type?: SnackbarType) => void;
}

function ServicesSection({ onSnackbar }: ServicesSectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    categoryId: undefined,
    duration: undefined,
    price: 0,
    currency: 'UZS',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await clinicRepository.loadDb();
      setServices(
        db.services.map((s: any) => ({
          id: s.id,
          name: s.name || '',
          categoryId: s.categoryId,
          duration: s.duration,
          price: s.price || 0,
          currency: 'UZS',
          description: s.description || '',
          isActive: true,
        }))
      );
      setCategories(db.serviceCategories || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      onSnackbar('Не удалось загрузить услуги', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      (service.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && service.isActive) ||
      (statusFilter === 'hidden' && !service.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        categoryId: undefined,
        duration: undefined,
        price: 0,
        currency: 'UZS',
        description: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingService(null);
  };

  const handleSaveService = () => {
    if (!formData.name?.trim()) {
      onSnackbar('Введите название услуги', 'error');
      return;
    }

    if (editingService) {
      setServices(
        services.map((s) =>
          s.id === editingService.id
            ? { ...s, ...formData }
            : s
        )
      );
      onSnackbar('Услуга обновлена', 'success');
    } else {
      const newService: Service = {
        id: Math.max(...services.map((s) => s.id), 0) + 1,
        name: formData.name || '',
        categoryId: formData.categoryId,
        duration: formData.duration,
        price: formData.price || 0,
        currency: formData.currency || 'UZS',
        description: formData.description,
        isActive: formData.isActive ?? true,
      };
      setServices([...services, newService]);
      onSnackbar('Услуга добавлена', 'success');
    }
    handleCloseDialog();
  };

  const handleDeleteClick = (service: Service) => {
    setDeleteTarget(service);
    setOpenDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setServices(services.filter((s) => s.id !== deleteTarget.id));
      onSnackbar('Услуга удалена', 'success');
    }
    setOpenDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const handleHideService = () => {
    if (deleteTarget) {
      setServices(
        services.map((s) =>
          s.id === deleteTarget.id ? { ...s, isActive: false } : s
        )
      );
      onSnackbar('Услуга скрыта', 'success');
    }
    setOpenDeleteConfirm(false);
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    );
  }

  return (
    <>
      {/* Top Controls */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
            {/* Search */}
            <TextField
              placeholder="Поиск услуги..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#999' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 250 }}
            />

            {/* Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={statusFilter}
                label="Статус"
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="active">Активные</MenuItem>
                <MenuItem value="hidden">Скрытые</MenuItem>
              </Select>
            </FormControl>

            {/* Add Button */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                backgroundColor: '#1976d2',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Добавить услугу
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Services Table */}
      {filteredServices.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="textSecondary">
            {services.length === 0 ? 'Услуг не найдено' : 'По вашему запросу услуг не найдено'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>Название услуги</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>Категория</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#000' }}>
                  Длительность (мин)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#000' }}>
                  Цена (UZS)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#000' }}>
                  Статус
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#000' }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{service.name}</TableCell>
                  <TableCell>
                    {categories.find((c) => c.id === service.categoryId)?.name || '-'}
                  </TableCell>
                  <TableCell align="center">{service.duration || '-'}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('ru-RU').format(service.price)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={service.isActive ? 'Активна' : 'Скрыта'}
                      size="small"
                      sx={{
                        backgroundColor: service.isActive ? '#e8f5e9' : '#f3e5f5',
                        color: service.isActive ? '#2e7d32' : '#6a1b9a',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(service)}
                      sx={{ color: '#1976d2' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(service)}
                      sx={{ color: '#ef4444' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '18px' }}>
          {editingService ? 'Редактировать услугу' : 'Добавить услугу'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Название услуги"
              required
              fullWidth
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Категория</InputLabel>
              <Select
                value={formData.categoryId || ''}
                label="Категория"
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value as any })
                }
              >
                <MenuItem value="">Не выбрана</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Длительность (минуты)"
              type="number"
              fullWidth
              value={formData.duration || ''}
              onChange={(e) =>
                setFormData({ ...formData, duration: parseInt(e.target.value) || undefined })
              }
            />

            <TextField
              label="Цена"
              type="number"
              fullWidth
              value={formData.price || 0}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
              }
              InputProps={{
                endAdornment: <InputAdornment position="end">UZS</InputAdornment>,
              }}
            />

            <TextField
              label="Описание"
              fullWidth
              multiline
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Активна"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveService}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Удалить услугу?</DialogTitle>
        <DialogContent>
          <Typography>
            Удалить услугу <strong>{deleteTarget?.name}</strong> навсегда? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Отмена</Button>
          <Button onClick={handleHideService} sx={{ color: '#f59e0b' }}>
            Скрыть услугу
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            sx={{ backgroundColor: '#ef4444' }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ============================================================================
// SECTION 2: DOCTORS
// ============================================================================

interface DoctorsSectionProps {
  onSnackbar: (message: string, type?: SnackbarType) => void;
}

function DoctorsSection({ onSnackbar }: DoctorsSectionProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialFilter, setSpecialFilter] = useState<number | ''>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<Partial<Doctor>>({
    fullName: '',
    specialization: '',
    phone: '',
    email: '',
    description: '',
    serviceIds: [],
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await clinicRepository.loadDb();
      setDoctors(
        db.doctors.map((d: any) => ({
          id: d.id,
          fullName: d.fullName || '',
          specialization: d.specialization || '',
          phone: d.phone || '',
          email: d.email || '',
          description: d.description || '',
          serviceIds: d.serviceIds || [],
          isActive: true,
        }))
      );
      setServices(db.services || []);
      setSpecializations(db.specialties || []);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      onSnackbar('Не удалось загрузить доктора', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = (doctor.fullName || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSpec =
      specialFilter === '' || (doctor.specialization || '').includes(specialFilter.toString());
    return matchesSearch && matchesSpec;
  });

  const handleOpenDialog = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData(doctor);
    } else {
      setEditingDoctor(null);
      setFormData({
        fullName: '',
        specialization: '',
        phone: '',
        email: '',
        description: '',
        serviceIds: [],
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDoctor(null);
  };

  const handleSaveDoctor = () => {
    if (!(formData.fullName || '').trim()) {
      onSnackbar('Введите ФИО доктора', 'error');
      return;
    }
    if (!(formData.specialization || '').trim()) {
      onSnackbar('Выберите специализацию', 'error');
      return;
    }

    if (editingDoctor) {
      setDoctors(
        doctors.map((d) =>
          d.id === editingDoctor.id
            ? { ...d, ...formData }
            : d
        )
      );
      onSnackbar('Доктор обновлен', 'success');
    } else {
      const newDoctor: Doctor = {
        id: Math.max(...doctors.map((d) => d.id), 0) + 1,
        fullName: formData.fullName || '',
        specialization: formData.specialization || '',
        phone: formData.phone || '',
        email: formData.email || '',
        description: formData.description,
        serviceIds: formData.serviceIds || [],
        isActive: formData.isActive ?? true,
      };
      setDoctors([...doctors, newDoctor]);
      onSnackbar('Доктор добавлен', 'success');
    }
    handleCloseDialog();
  };

  const handleDeleteClick = (doctor: Doctor) => {
    setDeleteTarget(doctor);
    setOpenDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setDoctors(doctors.filter((d) => d.id !== deleteTarget.id));
      onSnackbar('Доктор удален', 'success');
    }
    setOpenDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const handleDisableDoctor = () => {
    if (deleteTarget) {
      setDoctors(
        doctors.map((d) =>
          d.id === deleteTarget.id ? { ...d, isActive: false } : d
        )
      );
      onSnackbar('Доктор отключен', 'success');
    }
    setOpenDeleteConfirm(false);
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    );
  }

  return (
    <>
      {/* Top Controls */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
            {/* Search */}
            <TextField
              placeholder="Поиск по имени или телефону..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#999' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 250 }}
            />

            {/* Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Специализация</InputLabel>
              <Select
                value={specialFilter}
                label="Специализация"
                onChange={(e) => setSpecialFilter(e.target.value as any)}
              >
                <MenuItem value="">Все</MenuItem>
                {specializations.map((spec) => (
                  <MenuItem key={spec.id} value={spec.id}>
                    {spec.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Add Button */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                backgroundColor: '#1976d2',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Добавить доктора
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      {filteredDoctors.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="textSecondary">
            {doctors.length === 0 ? 'Доктора не найдены' : 'По вашему запросу доктора не найдены'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>ФИО</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>Специализация</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>Телефон</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#000' }}>
                  Статус
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#000' }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{doctor.fullName}</TableCell>
                  <TableCell>
                    {specializations.find((s) => s.id.toString() === doctor.specialization)
                      ?.name || doctor.specialization}
                  </TableCell>
                  <TableCell>{doctor.phone || '-'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={doctor.isActive ? 'Активен' : 'Отключен'}
                      size="small"
                      sx={{
                        backgroundColor: doctor.isActive ? '#e8f5e9' : '#ffebee',
                        color: doctor.isActive ? '#2e7d32' : '#c62828',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(doctor)}
                      sx={{ color: '#1976d2' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(doctor)}
                      sx={{ color: '#ef4444' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '18px' }}>
          {editingDoctor ? 'Редактировать доктора' : 'Добавить доктора'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="ФИО"
              required
              fullWidth
              value={formData.fullName || ''}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />

            <FormControl fullWidth required>
              <InputLabel>Специализация</InputLabel>
              <Select
                value={formData.specialization || ''}
                label="Специализация"
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
              >
                {specializations.map((spec) => (
                  <MenuItem key={spec.id} value={spec.id.toString()}>
                    {spec.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Телефон"
              fullWidth
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <TextField
              label="Описание"
              fullWidth
              multiline
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Услуги</InputLabel>
              <Select
                multiple
                value={formData.serviceIds || []}
                label="Услуги"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    serviceIds: typeof e.target.value === 'string'
                      ? e.target.value.split(',').map(Number)
                      : e.target.value,
                  })
                }
                renderValue={(selected) =>
                  selected
                    .map((id) => services.find((s) => s.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')
                }
              >
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {service.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Активен"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveDoctor}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Удалить доктора?</DialogTitle>
        <DialogContent>
          <Typography>
            Удалить доктора <strong>{deleteTarget?.fullName}</strong>? Если у доктора есть история
            пациентов, рекомендуется его отключить, а не удалить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Отмена</Button>
          <Button onClick={handleDisableDoctor} sx={{ color: '#f59e0b' }}>
            Отключить
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            sx={{ backgroundColor: '#ef4444' }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ============================================================================
// SECTION 3: PATIENTS
// ============================================================================

interface PatientsSectionProps {
  onSnackbar: (message: string, type?: SnackbarType) => void;
}

function PatientsSection({ onSnackbar }: PatientsSectionProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived'>('active');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Partial<Patient>>({
    fullName: '',
    phone: '',
    birthDate: '',
    gender: '',
    notes: '',
    isArchived: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await clinicRepository.loadDb();
      setPatients(
        db.patients.map((p: any) => ({
          id: p.id,
          fullName: p.fullName || '',
          phone: p.phone || '',
          birthDate: p.birthDate || '',
          gender: p.gender || '',
          notes: p.notes || '',
          isArchived: false,
        }))
      );
    } catch (error) {
      console.error('Failed to load patients:', error);
      onSnackbar('Не удалось загрузить пациентов', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      (patient.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone || '').includes(searchTerm);
    const matchesArchive =
      archiveFilter === 'active' ? !patient.isArchived : patient.isArchived;
    return matchesSearch && matchesArchive;
  });

  const handleOpenDialog = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData(patient);
    } else {
      setEditingPatient(null);
      setFormData({
        fullName: '',
        phone: '',
        birthDate: '',
        gender: '',
        notes: '',
        isArchived: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPatient(null);
  };

  const handleViewPatient = (patient: Patient) => {
    setViewingPatient(patient);
    setDrawerOpen(true);
  };

  const handleSavePatient = () => {
    if (!(formData.fullName || '').trim()) {
      onSnackbar('Введите ФИО пациента', 'error');
      return;
    }
    if (!(formData.phone || '').trim()) {
      onSnackbar('Введите телефон пациента', 'error');
      return;
    }

    if (editingPatient) {
      setPatients(
        patients.map((p) =>
          p.id === editingPatient.id
            ? { ...p, ...formData }
            : p
        )
      );
      if (viewingPatient && viewingPatient.id === editingPatient.id) {
        setViewingPatient({ ...viewingPatient, ...formData });
      }
      onSnackbar('Пациент обновлен', 'success');
    } else {
      const newPatient: Patient = {
        id: Math.max(...patients.map((p) => p.id), 0) + 1,
        fullName: formData.fullName || '',
        phone: formData.phone || '',
        birthDate: formData.birthDate || '',
        gender: formData.gender || '',
        notes: formData.notes,
        isArchived: formData.isArchived ?? false,
      };
      setPatients([...patients, newPatient]);
      onSnackbar('Пациент добавлен', 'success');
    }
    handleCloseDialog();
  };

  const handleDeleteClick = (patient: Patient) => {
    setDeleteTarget(patient);
    setOpenDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setPatients(patients.filter((p) => p.id !== deleteTarget.id));
      onSnackbar('Пациент удален', 'success');
    }
    setOpenDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const handleArchivePatient = () => {
    if (deleteTarget) {
      setPatients(
        patients.map((p) =>
          p.id === deleteTarget.id ? { ...p, isArchived: true } : p
        )
      );
      onSnackbar('Пациент архивирован', 'success');
    }
    setOpenDeleteConfirm(false);
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    );
  }

  return (
    <>
      {/* Top Controls */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
            {/* Search */}
            <TextField
              placeholder="Поиск по имени или телефону..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#999' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 250 }}
            />

            {/* Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={archiveFilter}
                label="Статус"
                onChange={(e) => setArchiveFilter(e.target.value as any)}
              >
                <MenuItem value="active">Активные</MenuItem>
                <MenuItem value="archived">Архив</MenuItem>
              </Select>
            </FormControl>

            {/* Add Button */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                backgroundColor: '#1976d2',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Добавить пациента
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Patients Table */}
      {filteredPatients.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="textSecondary">
            {patients.length === 0 ? 'Пациентов не найдено' : 'По вашему запросу пациентов не найдено'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>ФИО</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>Телефон</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>Дата рождения</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#000' }}>Пол</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#000' }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{patient.fullName}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>
                    {patient.birthDate
                      ? new Date(patient.birthDate).toLocaleDateString('ru-RU')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {patient.gender === 'M' ? 'М' : patient.gender === 'F' ? 'Ж' : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      onClick={() => handleViewPatient(patient)}
                      sx={{ color: '#1976d2', textTransform: 'none' }}
                    >
                      Открыть
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(patient)}
                      sx={{ color: '#1976d2' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(patient)}
                      sx={{ color: '#ef4444' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Right Side Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            p: 3,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Данные пациента
          </Typography>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            size="small"
            sx={{ color: '#666' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {viewingPatient && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ color: '#999', fontWeight: 600 }}>
                ФИО
              </Typography>
              <Typography sx={{ fontWeight: 500 }}>{viewingPatient.fullName}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#999', fontWeight: 600 }}>
                Телефон
              </Typography>
              <Typography sx={{ fontWeight: 500 }}>{viewingPatient.phone}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#999', fontWeight: 600 }}>
                Дата рождения
              </Typography>
              <Typography sx={{ fontWeight: 500 }}>
                {viewingPatient.birthDate
                  ? new Date(viewingPatient.birthDate).toLocaleDateString('ru-RU')
                  : '-'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#999', fontWeight: 600 }}>
                Пол
              </Typography>
              <Typography sx={{ fontWeight: 500 }}>
                {viewingPatient.gender === 'M' ? 'Мужской' : viewingPatient.gender === 'F' ? 'Женский' : '-'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#999', fontWeight: 600 }}>
                Заметки
              </Typography>
              <Typography sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                {viewingPatient.notes || '-'}
              </Typography>
            </Box>

            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e5e5e5' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                История визитов
              </Typography>
              <Typography variant="body2" sx={{ color: '#999' }}>
                История визитов будет отображаться здесь...
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setDrawerOpen(false);
                  handleOpenDialog(viewingPatient);
                }}
              >
                Редактировать
              </Button>
            </Stack>
          </Stack>
        )}
      </Drawer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '18px' }}>
          {editingPatient ? 'Редактировать пациента' : 'Добавить пациента'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="ФИО"
              required
              fullWidth
              value={formData.fullName || ''}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />

            <TextField
              label="Телефон"
              required
              fullWidth
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <TextField
              label="Дата рождения"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={formData.birthDate || ''}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Пол</InputLabel>
              <Select
                value={formData.gender || ''}
                label="Пол"
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <MenuItem value="">Не указан</MenuItem>
                <MenuItem value="M">Мужской</MenuItem>
                <MenuItem value="F">Женский</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Заметки"
              fullWidth
              multiline
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleSavePatient}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Удалить пациента?</DialogTitle>
        <DialogContent>
          <Typography>
            Удалить пациента <strong>{deleteTarget?.fullName}</strong>? Если у пациента есть история
            визитов, рекомендуется его архивировать, а не удалять.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Отмена</Button>
          <Button onClick={handleArchivePatient} sx={{ color: '#f59e0b' }}>
            Архивировать
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            sx={{ backgroundColor: '#ef4444' }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

