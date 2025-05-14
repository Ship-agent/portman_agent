import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert, Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import { mockPortCalls } from '../data/mockData';
import { PortCall } from '../types';

const PortCallManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPortCall, setCurrentPortCall] = useState<PortCall | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portCalls, setPortCalls] = useState<PortCall[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // In a production environment, this would be an actual API call
        // For now, we'll use our mock data with a simulated delay

        // Simulate API call delay
        // await new Promise(resolve => setTimeout(resolve, 1000));

        // Use mock data
        // setPortCalls(mockPortCalls);

        // In a real implementation, we would use:
        const response = await api.getPortCalls();
        setPortCalls(response);
      } catch (err) {
        console.error('Error fetching port calls:', err);
        setError('Failed to load port calls. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter port calls based on search term
  const filteredPortCalls = portCalls?.filter(call =>
    call.vesselname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.imolloyds.toString().includes(searchTerm) ||
    call.portareaname.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setCurrentPortCall(null);
    setSaveError(null);
    setSaveSuccess(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (portCall: PortCall) => {
    setDialogMode('edit');
    setCurrentPortCall(portCall);
    setSaveError(null);
    setSaveSuccess(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSavePortCall = async () => {
    // In a real application, this would save to the backend
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, we would use:
      // if (dialogMode === 'add') {
      //   await api.createPortCall(formData);
      // } else {
      //   await api.updatePortCall(currentPortCall.portCallId, formData);
      // }

      setSaveSuccess(dialogMode === 'add' ? 'Port call added successfully!' : 'Port call updated successfully!');

      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setOpenDialog(false);

        // Refresh data
        // In a real implementation, we would fetch fresh data from the API
        // For now, we'll just keep using our mock data
      }, 1500);
    } catch (err) {
      console.error('Error saving port call:', err);
      setSaveError('Failed to save port call. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="div" data-cy="portcallmanagement-title">
          Port Call Management
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          data-cy="add-portcall-button"
        >
          Add Port Call
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by vessel name, IMO number, or port"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          data-cy="portcallmanagement-search"
        />
      </Box>

      {/* Port Calls Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-label="port calls table" data-cy="portcallmanagement-table">
            <TableHead>
              <TableRow>
                <TableCell>Vessel Name</TableCell>
                <TableCell>IMO</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>Berth</TableCell>
                <TableCell>ETA</TableCell>
                <TableCell>ATA</TableCell>
                <TableCell>ETD</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPortCalls
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((call: PortCall) => (
                  <TableRow hover key={call.portcallid}>
                    <TableCell>{call.vesselname}</TableCell>
                    <TableCell>{call.imolloyds}</TableCell>
                    <TableCell>{call.portareaname}</TableCell>
                    <TableCell>{call.berthname}</TableCell>
                    <TableCell>{formatDateTime(call.eta)}</TableCell>
                    <TableCell>{formatDateTime(call.ata)}</TableCell>
                    <TableCell>{formatDateTime(call.etd)}</TableCell>
                    <TableCell>
                      <Chip
                        label={call.ata ? 'Arrived' : 'Expected'}
                        color={call.ata ? 'success' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditDialog(call)}
                        aria-label="edit"
                        data-cy="edit-portcall-button"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => {/* TODO: Implement delete */ }}
                        aria-label="delete"
                        data-cy="delete-portcall-button"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredPortCalls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No port calls found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPortCalls.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth data-cy="portcall-dialog">
        <DialogTitle data-cy="portcall-dialog-title">
          {dialogMode === 'add' ? 'Add New Port Call' : 'Edit Port Call'}
        </DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {saveError}
            </Alert>
          )}

          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
              {saveSuccess}
            </Alert>
          )}

          <Box sx={{ mt: 1 }}>
            {saveLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box component="form">
                <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                  Vessel Information
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Vessel Name"
                    fullWidth
                    margin="normal"
                    defaultValue={currentPortCall?.vesselname || ''}
                  />

                  <TextField
                    label="IMO Number"
                    fullWidth
                    margin="normal"
                    defaultValue={currentPortCall?.imolloyds || ''}
                  />

                  <TextField
                    label="Vessel Type"
                    fullWidth
                    margin="normal"
                    defaultValue={currentPortCall?.vesseltypecode || ''}
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Port Information
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Port Name"
                    fullWidth
                    margin="normal"
                    defaultValue={currentPortCall?.portareaname || ''}
                  />

                  <TextField
                    label="Port Code"
                    fullWidth
                    margin="normal"
                    defaultValue={currentPortCall?.porttovisit || ''}
                  />

                  <TextField
                    label="Berth Name"
                    fullWidth
                    margin="normal"
                    defaultValue={currentPortCall?.berthname || ''}
                  />

                  <TextField
                    label="Berth Code"
                    fullWidth
                    margin="normal"
                    defaultValue={currentPortCall?.berthcode || ''}
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Schedule Information
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="ETA"
                    type="datetime-local"
                    defaultValue={currentPortCall?.eta ? new Date(currentPortCall.eta).toISOString().slice(0, 16) : ''}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="ETD"
                    type="datetime-local"
                    defaultValue={currentPortCall?.etd ? new Date(currentPortCall.etd).toISOString().slice(0, 16) : ''}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="ATA"
                    type="datetime-local"
                    defaultValue={currentPortCall?.ata ? new Date(currentPortCall.ata).toISOString().slice(0, 16) : ''}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="ATD"
                    type="datetime-local"
                    defaultValue={currentPortCall?.atd ? new Date(currentPortCall.atd).toISOString().slice(0, 16) : ''}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Passenger Count"
                    type="number"
                    defaultValue={currentPortCall?.passengersonarrival || ''}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Crew Count"
                    type="number"
                    defaultValue={currentPortCall?.crewonarrival || ''}
                    sx={{ mb: 2 }}
                  />

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      label="Status"
                      defaultValue={currentPortCall?.ata === undefined ? 'SCHEDULED' : 'ACTIVE'}
                    >
                      <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Cargo Description"
                    multiline
                    rows={2}
                    // defaultValue={currentPortCall?.cargoDescription || ''}
                    defaultValue={'Default value'}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} data-cy="dialog-cancel-button">Cancel</Button>
          <Button
            onClick={handleSavePortCall}
            variant="contained"
            disabled={saveLoading}
            data-cy="dialog-save-button"
          >
            {saveLoading ? 'Saving...' : dialogMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortCallManagement;
