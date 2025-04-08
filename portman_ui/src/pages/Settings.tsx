import React from 'react';
import {
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import { mockTrackedVessels } from '../data/mockData';

interface SettingsProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ isDarkMode, setIsDarkMode }) => {
  const [refreshInterval, setRefreshInterval] = React.useState('300');
  const [defaultView, setDefaultView] = React.useState('map');
  const [trackedVessels, setTrackedVessels] = React.useState(mockTrackedVessels.join(','));
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  const handleRefreshIntervalChange = (event: SelectChangeEvent) => {
    setRefreshInterval(event.target.value);
  };

  const handleDefaultViewChange = (event: SelectChangeEvent) => {
    setDefaultView(event.target.value);
  };

  const handleTrackedVesselsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTrackedVessels(event.target.value);
  };

  const handleAutoRefreshChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRefresh(event.target.checked);
  };

  const handleDarkModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsDarkMode(event.target.checked);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Application Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Settings
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="refresh-interval-label">Data Refresh Interval</InputLabel>
                  <Select
                    labelId="refresh-interval-label"
                    id="refresh-interval-select"
                    value={refreshInterval}
                    label="Data Refresh Interval"
                    onChange={handleRefreshIntervalChange}
                  >
                    <MenuItem value="60">Every 1 minute</MenuItem>
                    <MenuItem value="300">Every 5 minutes</MenuItem>
                    <MenuItem value="600">Every 10 minutes</MenuItem>
                    <MenuItem value="1800">Every 30 minutes</MenuItem>
                    <MenuItem value="3600">Every hour</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="default-view-label">Default View</InputLabel>
                  <Select
                    labelId="default-view-label"
                    id="default-view-select"
                    value={defaultView}
                    label="Default View"
                    onChange={handleDefaultViewChange}
                  >
                    <MenuItem value="map">Map View</MenuItem>
                    <MenuItem value="list">List View</MenuItem>
                    <MenuItem value="timeline">Timeline View</MenuItem>
                  </Select>
                </FormControl>

                  <FormControlLabel
                      control={
                        <Switch
                            checked={autoRefresh}
                            onChange={handleAutoRefreshChange}
                            name="autoRefresh"
                        />
                      }
                      label="Enable Auto-Refresh"
                      sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                  />

                  <FormControlLabel
                      control={
                        <Switch
                            checked={isDarkMode}
                            onChange={handleDarkModeChange}
                            name="darkMode"
                        />
                      }
                      label="Dark Mode"
                      sx={{ display: 'flex', alignItems: 'center' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

        {/* Vessel Tracking Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vessel Tracking Settings
              </Typography>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  id="tracked-vessels"
                  label="Tracked Vessels (IMO Numbers, comma-separated)"
                  multiline
                  rows={4}
                  value={trackedVessels}
                  onChange={handleTrackedVesselsChange}
                  helperText="Enter IMO numbers separated by commas"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Currently tracking {trackedVessels.split(',').filter(v => v.trim()).length} vessels
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
