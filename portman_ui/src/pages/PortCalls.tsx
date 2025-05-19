import React, { useEffect, useState, useCallback } from 'react';
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
  Typography,
  Skeleton,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  FilterAlt as FilterIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DirectionsBoat as VesselIcon,
  LocationOn as PortIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Business as CompanyIcon,
} from '@mui/icons-material';
import { PortCall } from '../types';
import api from "../services/api";
import XmlViewDialog from '../components/common/XmlViewDialog';

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
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const today = new Date();

  const [startDate, setStartDate] = useState<Date | null>(oneWeekAgo);
  const [endDate, setEndDate] = useState<Date | null>(today);

  // State for the XML View Dialog
  const [isXmlDialogOpen, setIsXmlDialogOpen] = useState(false);
  const [selectedXmlUrl, setSelectedXmlUrl] = useState<string | null>(null);
  const [selectedXmlType, setSelectedXmlType] = useState<string | null>(null);

  const fetchData = useCallback(async (currentData: PortCall[] = [], url?: string) => {
    if (!url && currentData.length === 0) setLoading(true);
    if (url) setLoadingMore(true);
    setError(null);

    try {
      const response = await api.getPortCallsPaginated({
        afterParam: url ? new URL(url).searchParams.get('$after') || undefined : undefined,
        startDate: startDate,
        endDate: endDate
      });

      const newData = response?.data?.value || [];
      const combinedData = url ? [...currentData, ...newData] : newData;
      setPortCalls(combinedData);
      setTotalPortCalls(combinedData.length); // This might need adjustment if backend provides total count

      if (response?.data?.nextLink) {
        setNextPageUrl(response.data.nextLink);
        // Continue loading all data if it's the initial load or if specifically triggered
        if (!url) { // Initial load implies we want all data
          setTimeout(() => {
            fetchData(combinedData, response.data.nextLink);
          }, 300);
        }
      } else {
        setNextPageUrl(null);
        setLoadingAllData(false);
      }
    } catch (err) {
      console.error('Error fetching port calls:', err);
      setError('Failed to load port calls. Please try again later.');
    } finally {
      if (!url) setLoading(false);
      if (url) setLoadingMore(false);
      if (!nextPageUrl) setLoadingAllData(false);
    }
  }, [startDate, endDate, nextPageUrl]); // Added nextPageUrl to dependencies to avoid issues if it changes

  useEffect(() => {
    setLoadingAllData(true); // Indicate that we are attempting to load all data
    fetchData(); // Initial data load
  }, [startDate, endDate]); // Removed fetchData from here, it's called inside


  const handleClearFilters = () => {
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 7);
    setStartDate(defaultStartDate);
    setEndDate(new Date());
    setStatusFilter('all');
    setPage(0);
  };

  const getStatus = (call: PortCall) => {
    if (call.atd) return { label: 'Completed', color: 'default' as const };
    if (call.ata) return { label: 'Arrived', color: 'success' as const };
    const now = new Date();
    const etaDate = call.eta ? new Date(call.eta) : null;
    if (!etaDate) return { label: 'Unknown', color: 'default' as const };
    if (etaDate < new Date(now.getTime() - 3 * 60 * 60 * 1000)) return { label: 'Delayed', color: 'warning' as const };
    if (etaDate < new Date(now.getTime() + 24 * 60 * 60 * 1000)) return { label: 'Arriving Soon', color: 'info' as const };
    return { label: 'Expected', color: 'primary' as const };
  };

  const filteredPortCalls = (portCalls || [])
      .filter((call: PortCall) => {
        // Apply search filter
        const matchesSearch =
            call?.vesselname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call?.imolloyds?.toString().includes(searchTerm) ||
            call?.portareaname?.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply status filter
        if (statusFilter === 'all') return matchesSearch;
        if (statusFilter === 'arrived' && call.ata) return matchesSearch;
        if (statusFilter === 'completed' && call.atd) return matchesSearch;
        if (statusFilter === 'expected' && !call.ata && !call.atd) return matchesSearch;
        if (statusFilter === 'arriving-soon') {
          const now = new Date();
          const etaDate = call.eta ? new Date(call.eta) : null;
          if (etaDate && etaDate < new Date(now.getTime() + 24 * 60 * 60 * 1000) && !call.ata) return matchesSearch;
        }
        if (statusFilter === 'delayed') {
          const now = new Date();
          const etaDate = call.eta ? new Date(call.eta) : null;
          if (etaDate && etaDate < new Date(now.getTime() - 3 * 60 * 60 * 1000) && !call.ata) return matchesSearch;
        }
        return false;
      })
      .sort((a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime());

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
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}.${month}.${year} - ${hours}.${minutes}.${seconds}`;
  };

  // Updated function to open the dialog
  const handleOpenXmlDialog = (url: string, type: string) => {
    setSelectedXmlUrl(url);
    setSelectedXmlType(type);
    setIsXmlDialogOpen(true);
  };

  interface GridItemProps {
    title: string;
    value: any;
    icon?: React.ReactNode;
  }

  const GridItem: React.FC<GridItemProps> = ({ title, value, icon }) => (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px dotted rgba(0, 0, 0, 0.1)',
        py: 0.25
      }}>
        <Typography variant="body2" sx={{
          fontSize: '0.7rem',
          fontWeight: 500,
          color: 'text.secondary',
          width: '35%'
        }}>
          {title}:
        </Typography>
        <Typography variant="body2" sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'text.primary',
          fontWeight: value ? 'normal' : 'light',
          fontSize: '0.7rem',
          width: '65%'
        }}>
          {value || 'N/A'}
        </Typography>
      </Box>
  );

  interface RowProps {
    call: PortCall;
  }

  const Row: React.FC<RowProps> = ({ call }) => {
    const [open, setOpen] = useState(false);
    const status = getStatus(call);

    return (
        <React.Fragment>
          <TableRow
              hover
              key={call?.portcallid}
              onClick={() => setOpen(!open)}
              sx={{
                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  cursor: 'pointer',
                  '.expand-icon': {
                    opacity: 1,
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                  }
                },
                '&:hover .action-buttons': { opacity: 1 }
              }}
              data-cy={`portcall-row-${call?.portcallid}`}
          >
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" sx={{
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }} data-cy="vessel-name">
                    {call?.vesselname || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" data-cy="vessel-imo" sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    IMO: {call?.imolloyds || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {call?.vid_xml_url && (
                      <Tooltip title="Preview VID XML">
                        <IconButton
                            color="warning"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenXmlDialog(call.vid_xml_url!, 'VID');
                            }}
                            sx={{
                              padding: { xs: '4px', sm: '8px' }
                            }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                  )}
                  <Tooltip title={open ? "Collapse" : "Expand"}>
                    <IconButton
                        size="small"
                        className="expand-icon"
                        sx={{
                          opacity: 0.5,
                          transition: 'all 0.2s ease-in-out',
                          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                          padding: { xs: '4px', sm: '8px' }
                        }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </TableCell>
            <TableCell>
              <Chip
                  label={status.label}
                  color={status.color}
                  size="small"
                  data-cy="status-chip"
                  sx={{
                    fontWeight: 'medium',
                    minWidth: { xs: 70, sm: 85 },
                    '& .MuiChip-label': {
                      px: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '0.7rem', sm: '0.8125rem' }
                    }
                  }}
              />
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body1" data-cy="port-to-visit" sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  {call?.porttovisit || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" data-cy="port-area" sx={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>
                  {call?.portareaname || 'N/A'}
                </Typography>
              </Box>
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }} data-cy="eta-value">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>{formatDateTime(call?.eta)}</Typography>
                {call?.noa_xml_url && (
                    <Tooltip title="Preview NOA XML">
                      <IconButton
                          color="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenXmlDialog(call.noa_xml_url!, 'NOA');
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
                {call?.ata_xml_url && (
                    <Tooltip title="Preview ATA XML">
                      <IconButton
                          color="success"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenXmlDialog(call.ata_xml_url!, 'ATA');
                          }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                )}
              </Box>
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }} data-cy="etd-value">
              <Typography>{formatDateTime(call?.etd)}</Typography>
            </TableCell>
          </TableRow>
          <TableRow sx={{
            backgroundColor: open ? "rgba(25, 118, 210, 0.04)" : "#eeeeee",
            '& > td': { borderBottom: open ? '1px solid rgba(224, 224, 224, 1)' : 'none' }
          }}>
            <TableCell style={{ padding: 0 }} colSpan={8}>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{
                  padding: { xs: '4px 6px', sm: '6px 8px' },
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: '1px dashed #cccccc',
                  backgroundColor: 'rgba(25, 118, 210, 0.02)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                  borderRadius: '0 0 4px 4px'
                }}>
                  {/* Mobile-specific time info visible only on small screens */}
                  <Box sx={{
                    display: { xs: 'flex', md: 'none' },
                    width: '100%',
                    flexDirection: 'column',
                    gap: 0.5,
                    mb: 1,
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                  }}>
                    <Typography variant="caption" sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.75rem',
                      color: 'primary.main',
                      fontWeight: 'bold',
                      pb: 0.5
                    }}>
                      <TimeIcon sx={{ fontSize: '0.9rem' }} /> Time Information
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <Box sx={{ minWidth: '50%', pr: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>ETA:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {formatDateTime(call?.eta)}
                          {call?.noa_xml_url && (
                              <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenXmlDialog(call.noa_xml_url!, 'NOA');
                                  }}
                                  sx={{ p: 0.25, ml: 0.5 }}
                              >
                                <VisibilityIcon sx={{ fontSize: '0.75rem' }} />
                              </IconButton>
                          )}
                        </Typography>
                      </Box>
                      <Box sx={{ minWidth: '50%', pr: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>ATA:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {call?.ata ? formatDateTime(call.ata) : '-'}
                          {call?.ata_xml_url && (
                              <IconButton
                                  color="success"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenXmlDialog(call.ata_xml_url!, 'ATA');
                                  }}
                                  sx={{ p: 0.25, ml: 0.5 }}
                              >
                                <VisibilityIcon sx={{ fontSize: '0.75rem' }} />
                              </IconButton>
                          )}
                        </Typography>
                      </Box>
                      <Box sx={{ minWidth: '50%', pr: 1, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>ETD:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {formatDateTime(call?.etd)}
                        </Typography>
                      </Box>
                      <Box sx={{ minWidth: '50%', pr: 1, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>ATD:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {formatDateTime(call?.atd)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{
                    display: 'flex',
                    width: '100%',
                    flexWrap: { xs: 'wrap', md: 'nowrap' },
                  }}>
                    <Box sx={{
                      width: { xs: '100%', sm: '50%', md: '25%' },
                      px: 1,
                      borderRight: { md: '1px solid rgba(0, 0, 0, 0.1)' },
                      mb: { xs: 1, md: 0 }
                    }}>
                      <Typography variant="caption" sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.75rem',
                        color: 'primary.main',
                        mb: 0.5,
                        fontWeight: 'bold',
                        borderBottom: '1px solid rgba(25, 118, 210, 0.2)',
                        pb: 0.5
                      }}>
                        <VesselIcon sx={{ fontSize: '0.9rem' }} /> Vessel
                      </Typography>
                      <GridItem title="Name" value={call.vesselname} />
                      <GridItem title="IMO" value={call.imolloyds} />
                      <GridItem title="Type" value={call.vesseltypecode} />
                      <GridItem title="Port Call ID" value={call.portcallid} />
                    </Box>

                    <Box sx={{
                      width: { xs: '100%', sm: '50%', md: '25%' },
                      px: 1,
                      borderRight: { md: '1px solid rgba(0, 0, 0, 0.1)' },
                      mb: { xs: 1, md: 0 }
                    }}>
                      <Typography variant="caption" sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.75rem',
                        color: 'primary.main',
                        mb: 0.5,
                        fontWeight: 'bold',
                        borderBottom: '1px solid rgba(25, 118, 210, 0.2)',
                        pb: 0.5
                      }}>
                        <PortIcon sx={{ fontSize: '0.9rem' }} /> Port
                      </Typography>
                      <GridItem title="To Visit" value={call.porttovisit} />
                      <GridItem title="Area" value={call.portareaname} />
                      <GridItem title="Berth" value={call.berthcode} />
                      <GridItem title="Next Port" value={call.nextport} />
                    </Box>

                    <Box sx={{
                      width: { xs: '100%', sm: '50%', md: '25%' },
                      px: 1,
                      borderRight: { md: '1px solid rgba(0, 0, 0, 0.1)' },
                      mb: { xs: 1, md: 0 },
                      display: { xs: 'none', md: 'block' } // Hide on mobile as we show a summary above
                    }}>
                      <Typography variant="caption" sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.75rem',
                        color: 'primary.main',
                        mb: 0.5,
                        fontWeight: 'bold',
                        borderBottom: '1px solid rgba(25, 118, 210, 0.2)',
                        pb: 0.5
                      }}>
                        <TimeIcon sx={{ fontSize: '0.9rem' }} /> Times
                      </Typography>
                      <GridItem title="ETA" value={formatDateTime(call.eta)} />
                      <GridItem title="ATA" value={formatDateTime(call.ata)} />
                      <GridItem title="ETD" value={formatDateTime(call.etd)} />
                      <GridItem title="ATD" value={formatDateTime(call.atd)} />
                    </Box>

                    <Box sx={{
                      width: { xs: '100%', sm: '50%', md: '25%' },
                      px: 1,
                      mb: { xs: 1, md: 0 }
                    }}>
                      <Typography variant="caption" sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.75rem',
                        color: 'primary.main',
                        mb: 0.5,
                        fontWeight: 'bold',
                        borderBottom: '1px solid rgba(25, 118, 210, 0.2)',
                        pb: 0.5
                      }}>
                        <CompanyIcon sx={{ fontSize: '0.9rem' }} /> Company
                      </Typography>
                      <GridItem title="Agent" value={call.agentname} />
                      <GridItem title="Shipping Co." value={call.shippingcompany} />
                      <GridItem title="Created" value={formatDateTime(call.created)} />
                      <GridItem title="Prev. Port" value={call.prevport} />
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </TableCell>
          </TableRow>
        </React.Fragment>
    );
  };

  // Loading skeleton for table rows
  const TableSkeleton = () => (
      <>
        {[...Array(5)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="40%" height={20} />
              </TableCell>
              <TableCell>
                <Skeleton variant="rounded" width={80} height={24} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width="70%" height={20} />
                <Skeleton variant="text" width="50%" height={20} />
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Skeleton variant="text" width="80%" height={20} />
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Skeleton variant="text" width="80%" height={20} />
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Skeleton variant="text" width="80%" height={20} />
              </TableCell>
            </TableRow>
        ))}
      </>
  );

  if (loading && portCalls.length === 0) {
    return (
        <Box sx={{ p: 3 }} data-cy="portcalls-loading-container">
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width={200} height={40} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Skeleton variant="text" width="30%" height={30} />
              <Skeleton variant="text" width="30%" height={30} />
            </Box>
          </Box>

          <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 3, borderRadius: 1 }} />

          <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: 2, mb: 3 }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: '15%', color: 'white' }}>Vessel</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '15%', color: 'white' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '15%', color: 'white' }}>Port</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '20%', color: 'white', display: { xs: 'none', md: 'table-cell' } }}>ETA</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '20%', color: 'white', display: { xs: 'none', md: 'table-cell' } }}>ATA</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '15%', color: 'white', display: { xs: 'none', md: 'table-cell' } }}>ETD</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableSkeleton />
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>
    );
  }

  return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }} data-cy="portcalls-container">
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          mb: { xs: 1.5, md: 3 },
          gap: { xs: 1, md: 2 }
        }}>
          <Typography variant="h4" component="h1" data-cy="portcalls-title" sx={{
            fontSize: { xs: '1.5rem', md: '2.125rem' },
            mb: { xs: 0.5, md: 0 }
          }}>
            Port Calls
          </Typography>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, md: 2 },
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
                  sx: {
                    height: { xs: '40px', md: 'auto' }
                  }
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
                sx={{
                  height: { xs: '40px', md: 'auto' },
                  whiteSpace: 'nowrap'
                }}
            >
              Filters
            </Button>
          </Box>
        </Box>

        <Box sx={{ mb: { xs: 1.5, md: 3 }, overflowX: 'auto' }}>
          <Tabs
              value={statusFilter}
              onChange={(_, newValue) => setStatusFilter(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
              aria-label="status filter tabs"
              sx={{
                '.MuiTabs-indicator': {
                  height: '3px'
                },
                '.MuiTab-root': {
                  minHeight: { xs: '40px', md: '48px' },
                  py: { xs: 0.5, md: 1 },
                  px: { xs: 1, md: 2 },
                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                }
              }}
          >
            <Tab
                label="All"
                value="all"
                icon={<Chip label={portCalls.length} size="small" />}
                iconPosition="end"
            />
            <Tab
                label="Arrived"
                value="arrived"
                icon={<Chip label={portCalls.filter(call => call.ata).length} size="small" color="success" />}
                iconPosition="end"
            />
            <Tab
                label="Expected"
                value="expected"
                icon={<Chip label={portCalls.filter(call => !call.ata && !call.atd).length} size="small" color="primary" />}
                iconPosition="end"
            />
            <Tab
                label="Arriving Soon"
                value="arriving-soon"
                icon={<Chip
                    label={portCalls.filter(call => {
                      const now = new Date();
                      const etaDate = call.eta ? new Date(call.eta) : null;
                      return etaDate && etaDate < new Date(now.getTime() + 24 * 60 * 60 * 1000) && !call.ata;
                    }).length}
                    size="small"
                    color="info"
                />}
                iconPosition="end"
            />
            <Tab
                label="Delayed"
                value="delayed"
                icon={<Chip
                    label={portCalls.filter(call => {
                      const now = new Date();
                      const etaDate = call.eta ? new Date(call.eta) : null;
                      return etaDate && etaDate < new Date(now.getTime() - 3 * 60 * 60 * 1000) && !call.ata;
                    }).length}
                    size="small"
                    color="warning"
                />}
                iconPosition="end"
            />
            <Tab
                label="Completed"
                value="completed"
                icon={<Chip label={portCalls.filter(call => call.atd).length} size="small" color="default" />}
                iconPosition="end"
            />
          </Tabs>
        </Box>

        <Collapse in={showFilters} sx={{ mb: { xs: 1.5, md: 3 } }}>
          <Paper sx={{
            p: { xs: 1.5, md: 2 },
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>Date Filters</Typography>
              <IconButton size="small" onClick={handleClearFilters} disabled={!startDate && !endDate}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Grid container spacing={{ xs: 1, md: 2 }} alignItems="center">
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
                    sx={{
                      '& .MuiInputBase-root': {
                        height: { xs: '40px', md: 'auto' }
                      }
                    }}
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
                    sx={{
                      '& .MuiInputBase-root': {
                        height: { xs: '40px', md: 'auto' }
                      }
                    }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography variant="body2" sx={{
                  textAlign: { xs: 'left', sm: 'center' },
                  mt: { xs: 0.5, sm: 0 }
                }}>
                  {filteredPortCalls.length} results
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {error && (
            <Alert severity="error" sx={{ mb: { xs: 1.5, md: 3 } }} data-cy="portcalls-error">
              {error}
            </Alert>
        )}

        <Box sx={{
          mb: { xs: 1.5, md: 3 },
          p: { xs: 1.5, md: 2 },
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1
        }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '0.9rem', md: '1.25rem' } }}>Summary</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
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
          mb: { xs: 1.5, md: 3 }
        }} data-cy="portcalls-table-container">
          <Box sx={{ overflowX: 'auto' }}>
            <Table data-cy="portcalls-table" sx={{
              tableLayout: 'fixed',
              '& .MuiTableCell-root': {
                px: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 1.5 },
                whiteSpace: { xs: 'normal', md: 'nowrap' },
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{
                    fontWeight: 'bold',
                    width: { xs: '40%', sm: '30%', md: '15%' },
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }} data-cy="table-header-vessel">Vessel</TableCell>
                  <TableCell sx={{
                    fontWeight: 'bold',
                    width: { xs: '25%', sm: '25%', md: '15%' },
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }} data-cy="table-header-status">Status</TableCell>
                  <TableCell sx={{
                    fontWeight: 'bold',
                    width: { xs: '35%', sm: '45%', md: '15%' },
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }} data-cy="table-header-port">Port</TableCell>
                  <TableCell sx={{
                    fontWeight: 'bold',
                    width: '20%',
                    color: 'white',
                    display: { xs: 'none', md: 'table-cell' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }} data-cy="table-header-eta">ETA</TableCell>
                  <TableCell sx={{
                    fontWeight: 'bold',
                    width: '20%',
                    color: 'white',
                    display: { xs: 'none', md: 'table-cell' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }} data-cy="table-header-ata">ATA</TableCell>
                  <TableCell sx={{
                    fontWeight: 'bold',
                    width: '15%',
                    color: 'white',
                    display: { xs: 'none', md: 'table-cell' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }} data-cy="table-header-etd">ETD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody data-cy="portcalls-table-body">
                {loading && portCalls.length > 0 ? (
                    <TableSkeleton />
                ) : (
                    <>
                      {filteredPortCalls
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((call: PortCall) => (
                              <Row key={call?.portcallid} call={call} />
                          ))}
                      {filteredPortCalls.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                              No port calls found
                            </TableCell>
                          </TableRow>
                      )}
                    </>
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
                  paddingY: { xs: 0.5, md: 1 },
                  paddingX: { xs: 1, md: 2 },
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                  '&:focus': {
                    borderColor: 'primary.main',
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                  }
                },
                '.MuiTablePagination-selectIcon': { color: 'primary.main' },
                '.MuiTablePagination-displayedRows': {
                  fontWeight: 'medium',
                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                },
                '.MuiTablePagination-actions': {
                  marginLeft: { xs: 0.5, md: 2 }
                }
              }}
              labelRowsPerPage={<Typography component="span" sx={{ display: { xs: 'none', sm: 'initial' } }}>Rows:</Typography>}
              labelDisplayedRows={({ from, to, count }) => (
                  <Typography component="span" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    {from}-{to} of {count}
                  </Typography>
              )}
          />
        </Paper>
        {/* Render the XmlViewDialog */}
        <XmlViewDialog
            open={isXmlDialogOpen}
            onClose={() => setIsXmlDialogOpen(false)}
            xmlUrl={selectedXmlUrl}
            xmlType={selectedXmlType}
        />
      </Box>
  );
};

export default PortCalls;
