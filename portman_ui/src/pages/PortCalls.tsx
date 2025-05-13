import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Grid,
  Grid2,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  FilterAlt as FilterIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { PortCall } from '../types';
import api from "../services/api";

const PortCalls: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portCalls, setPortCalls] = useState<PortCall[]>([]);
  const [totalPortCalls, setTotalPortCalls] = useState<number>(0);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loadingAllData, setLoadingAllData] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Set default date range to one week (7 days ago to today)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const today = new Date();
  
  const [startDate, setStartDate] = useState<Date | null>(oneWeekAgo);
  const [endDate, setEndDate] = useState<Date | null>(today);

  // Initial data load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.getPortCallsPaginated();
        const data = response?.data?.value || [];
        setPortCalls(data);
        setTotalPortCalls(data.length);

        // Store the next page URL if available
        if (response?.data?.nextLink) {
          setNextPageUrl(response.data.nextLink);
          // Automatically start loading all data
          loadAllData(response.data.nextLink, data);
        }
      } catch (err) {
        console.error('Error fetching port calls:', err);
        setError('Failed to load port calls. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to load all data recursively
  const loadAllData = async (url: string, currentData: PortCall[]) => {
    if (!url) return;

    setLoadingAllData(true);
    setLoadingMore(true);

    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      const afterParam = params.get('$after');

      if (afterParam) {
        // Pass the afterParam along with date filters
        const response = await api.getPortCallsPaginated({
          afterParam: afterParam,
          startDate: startDate,
          endDate: endDate
        });
        
        const newData = response?.data?.value || [];

        const combinedData = [...currentData, ...newData];
        setPortCalls(combinedData);
        setTotalPortCalls(combinedData.length);

        // If there's more data, continue loading
        if (response?.data?.nextLink) {
          // Short delay to prevent overloading the server
          setTimeout(() => {
            loadAllData(response.data.nextLink, combinedData);
          }, 300);
        } else {
          setNextPageUrl(null);
          setLoadingAllData(false);
          setLoadingMore(false);
        }
      }
    } catch (err) {
      console.error('Error loading more port calls:', err);
      setError('Failed to load all port calls. Some data might be missing.');
      setLoadingAllData(false);
      setLoadingMore(false);
    }
  };

  const handleClearFilters = () => {
    // Reset to one week ago (default filter)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    setStartDate(oneWeekAgo);
    setEndDate(new Date()); // Today
    setPage(0);
  };

  // Filter port calls based on search term only (date filtering is now done server-side)
  const filteredPortCalls = (portCalls || [])
    .filter((call: PortCall) =>
      // Text search filter
      call?.vesselname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call?.imolloyds?.toString().includes(searchTerm) ||
      call?.portareaname?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    
    // Format as dd.mm.yyyy - hh.mm.ss
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}.${month}.${year} - ${hours}.${minutes}.${seconds}`;
  };

  const handleViewXML = (url: string) => {
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SCHEDULED':
        return 'primary';
      case 'COMPLETED':
        return 'default';
      default:
        return 'default';
    }
  };

  // Helper function to determine the status label and color
  const getStatus = (call: PortCall) => {
    if (call.atd) {
      return { label: 'Completed', color: 'default' as const };
    }
    if (call.ata) {
      return { label: 'Arrived', color: 'success' as const };
    }

    const now = new Date();
    const etaDate = call.eta ? new Date(call.eta) : null;

    if (!etaDate) {
      return { label: 'Unknown', color: 'default' as const };
    }

    // If ETA is in the past by more than 3 hours and no ATA
    if (etaDate < new Date(now.getTime() - 3 * 60 * 60 * 1000)) {
      return { label: 'Delayed', color: 'warning' as const };
    }

    // If ETA is within the next 24 hours
    if (etaDate < new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      return { label: 'Arriving Soon', color: 'info' as const };
    }

    return { label: 'Expected', color: 'primary' as const };
  };

  interface GridItemProps {
    title: string;
    value: any;
  }

  const GridItem: React.FC<GridItemProps> = ({ title, value }) => {
    return (
        <Grid2 component="div" sx={{ width: '250px' }}>
          <Box sx={{
            padding: "8px 4px 8px 8px",
            height: "100%",
            borderLeft: '1px solid rgba(25, 118, 210, 0.2)',
            '&:first-of-type': {
              borderLeft: 'none'
            }
          }}>
            <Typography variant="body1" sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'text.secondary',
              textDecoration: "underline",
              textDecorationColor: 'rgba(0, 0, 0, 0.2)',
              textDecorationStyle: 'dotted',
              marginBottom: '2px'
            }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: 'text.primary',
              fontWeight: value ? 'normal' : 'light'
            }}>
              {value || 'N/A'}
            </Typography>
          </Box>
        </Grid2>
    );
  }


  interface RowProps {
    call: PortCall;
  }

  const Row: React.FC<RowProps> = ({ call }) => {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
          <TableRow
              hover
              key={call?.portcallid}
              onClick={() => setOpen(!open)}
              sx={{
                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                transition: 'all 0.2s ease-in-out',
                '&:hover .action-buttons': { opacity: 1 }
              }}
              data-cy={`portcall-row-${call?.portcallid}`}
          >
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }} data-cy="vessel-name">
                    {call?.vesselname || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" data-cy="vessel-imo">
                    IMO: {call?.imolloyds || 'N/A'}
                  </Typography>
                </Box>
                {call?.vid_xml_url && (
                    <Tooltip title="View VID XML">
                      <IconButton
                          color="warning"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewXML(call.vid_xml_url!);
                          }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                )}
              </Box>
            </TableCell>

            <TableCell>
              <Chip
                  label={getStatus(call).label}
                  color={getStatus(call).color}
                  size="small"
                  data-cy="status-chip"
                  sx={{
                    fontWeight: 'medium',
                    minWidth: 85,
                    '& .MuiChip-label': { px: 1 }
                  }}
              />
            </TableCell>

            <TableCell>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body1" data-cy="port-to-visit">
                  {call?.porttovisit || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" data-cy="port-area">
                  {call?.portareaname || 'N/A'}
                </Typography>
              </Box>
            </TableCell>

            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }} data-cy="eta-value">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>{formatDateTime(call?.eta)}</Typography>
                {call?.noa_xml_url && (
                  <Tooltip title="View NOA XML">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewXML(call.noa_xml_url!);
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </TableCell>

            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }} data-cy="ata-value">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>{call?.ata ? formatDateTime(call.ata) : '-'}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {call?.ata_xml_url && (
                      <Tooltip title="View ATA XML">
                        <IconButton
                            color="success"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewXML(call.ata_xml_url!);
                            }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                  )}
                </Box>
              </Box>
            </TableCell>

            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }} data-cy="etd-value">
              <Typography>{formatDateTime(call?.etd)}</Typography>
            </TableCell>
          </TableRow>

          <TableRow sx={{ backgroundColor: open ? "rgba(25, 118, 210, 0.04)" : "#eeeeee" }}>
            <TableCell style={{ padding: 0 }} colSpan={8}>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{
                  padding: '12px 12px 12px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: '1px dashed #cccccc',
                  backgroundColor: 'rgba(25, 118, 210, 0.02)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                  borderRadius: '0 0 4px 4px'
                }}>
                  <Grid2 container component="div" spacing={1} sx={{
                    width: '100%',
                    margin: 0,
                    '& > .MuiGrid2-root': {
                      padding: 0
                    }
                  }}>
                    <GridItem title="Port Call ID" value={call.portcallid} />
                    <GridItem title="Vessel Type" value={call.vesseltypecode} />
                    <GridItem title="Port to Visit" value={call.porttovisit} />
                    <GridItem title="Port Area" value={call.portareaname} />
                    <GridItem title="Berth Code" value={call.berthcode} />
                    <GridItem title="Previous Port" value={call.prevport} />
                    <GridItem title="Next Port" value={call.nextport} />
                    <GridItem title="ATD" value={formatDateTime(call.atd)} />
                    <GridItem title="Crew on Arrival" value={call.crewonarrival} />
                    <GridItem title="Crew on Departure" value={call.crewondeparture} />
                    <GridItem title="Passengers on Arrival" value={call.passengersonarrival} />
                    <GridItem title="Passengers on Departure" value={call.passengersondeparture} />
                    <GridItem title="Agent Name" value={call.agentname} />
                    <GridItem title="Shipping Company" value={call.shippingcompany} />
                    <GridItem title="Created" value={formatDateTime(call.created)} />
                    <GridItem title="Modified" value={formatDateTime(call.modified)} />
                  </Grid2>
                </Box>
              </Collapse>
            </TableCell>
          </TableRow>
        </React.Fragment>
    );
  }

  // Fetch port calls when date range changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Send date filter parameters to the API
        const response = await api.getPortCallsPaginated({
          startDate: startDate,
          endDate: endDate
        });
        
        const data = response?.data?.value || [];
        setPortCalls(data);
        setTotalPortCalls(data.length);

        // Store the next page URL if available
        if (response?.data?.nextLink) {
          setNextPageUrl(response.data.nextLink);
          // Automatically start loading all data with the same date filters
          loadAllData(response.data.nextLink, data);
        }
      } catch (err) {
        console.error('Error fetching port calls:', err);
        setError('Failed to load port calls. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]); // Re-fetch when date filters change

  if (loading && portCalls.length === 0) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress data-cy="portcalls-loading" />
        </Box>
    );
  }

  return (
      <Box sx={{ p: 3 }} data-cy="portcalls-container">
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          mb: 3,
          gap: 2
        }}>
          <Typography variant="h4" component="h1" data-cy="portcalls-title">
            Port Calls
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: 2,
            width: { xs: '100%', md: 'auto' } 
          }}>
            <TextField
              variant="outlined"
              placeholder="Search vessels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
              data-cy="portcalls-search"
              sx={{ flexGrow: 1 }}
            />
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              size="small"
            >
              Filters
            </Button>
          </Box>
        </Box>

        <Collapse in={showFilters} sx={{ mb: 3 }}>
          <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Date Filters</Typography>
              <IconButton size="small" onClick={handleClearFilters} disabled={!startDate && !endDate}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setStartDate(date);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setEndDate(date);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                  {filteredPortCalls.length} results
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-cy="portcalls-error">
              {error}
            </Alert>
        )}

        {/* Statistics Summary */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom>Summary</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography>
              Total Port Calls: <strong>{totalPortCalls}</strong>
              {loadingAllData && ' (loading more...)'}
            </Typography>
            {loadingAllData && <CircularProgress size={20} />}
          </Box>
        </Box>

        <Paper sx={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: 2,
          mb: 3
        }} data-cy="portcalls-table-container">
          <Box sx={{ overflowX: 'auto' }}>
            <Table data-cy="portcalls-table" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '15%', color: 'white' }} data-cy="table-header-vessel">Vessel</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '15%', color: 'white' }} data-cy="table-header-status">Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '15%', color: 'white' }} data-cy="table-header-port">Port</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '20%', color: 'white', display: { xs: 'none', md: 'table-cell' } }} data-cy="table-header-eta">ETA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '20%', color: 'white', display: { xs: 'none', md: 'table-cell' } }} data-cy="table-header-ata">ATA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '15%', color: 'white', display: { xs: 'none', md: 'table-cell' } }} data-cy="table-header-etd">ETD</TableCell>
                </TableRow>
              </TableHead>

              <TableBody data-cy="portcalls-table-body">
                {filteredPortCalls
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((call: PortCall) => (
                        <Row key={call?.portcallid} call={call} />
                    ))}
                {filteredPortCalls.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No port calls found
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
          {loadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
          )}
          <TablePagination
              component="div"
              count={filteredPortCalls.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50, 100, 150, 200, 300, 500]}
              sx={{
                '.MuiTablePagination-select': {
                  paddingY: 1,
                  paddingX: 2,
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                  '&:focus': {
                    borderColor: 'primary.main',
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                  }
                },
                '.MuiTablePagination-selectIcon': {
                  color: 'primary.main'
                },
                '.MuiTablePagination-displayedRows': {
                  fontWeight: 'medium'
                }
              }}
              labelRowsPerPage="Rows:"
          />
        </Paper>
      </Box>
  );
};

export default PortCalls;
