// Frontend: React (src/App.jsx)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import {
  Button, TextField, Typography, Container, Box, Paper, CssBaseline, createTheme, ThemeProvider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Switch, FormControlLabel
} from '@mui/material';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5000';

const getTheme = (mode) => createTheme({
  palette: { mode },
});

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [weight, setWeight] = useState('');
  const [history, setHistory] = useState([]);
  const [sortDirection, setSortDirection] = useState('desc');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('auth');
    if (authStatus === 'true') {
      const storedUsername = localStorage.getItem('username');
      setUsername(storedUsername);
      setIsAuthenticated(true);
    }
  }, []);

  const authenticate = async () => {
    const response = await axios.post(`${API_BASE}/api/auth`, { username, password });
    if (response.data.success) {
      localStorage.setItem('auth', 'true');
      localStorage.setItem('username', username);
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const addWeight = async () => {
    await axios.post(`${API_BASE}/api/add_weight`, { username, weight });
    loadHistory();
  };

  const loadHistory = async () => {
    const res = await axios.get(`${API_BASE}/api/history`, { params: { username } });
    const sorted = [...res.data].sort((a, b) => new Date(b.date) - new Date(a.date));
    setHistory(sorted);
  };

  const toggleSort = () => {
    const sorted = [...history].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortDirection === 'asc' ? dateB - dateA : dateA - dateB;
    });
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    setHistory(sorted);
  };

  useEffect(() => {
    if (isAuthenticated) loadHistory();
  }, [isAuthenticated]);

  return (
    <ThemeProvider theme={getTheme(darkMode ? 'dark' : 'light')}>
      <CssBaseline />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <FormControlLabel
          control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
          label="Dark Mode"
        />
      </Box>
      {!isAuthenticated ? (
        <Container maxWidth="sm">
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h5">Login or Sign Up</Typography>
            <TextField
              label="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={authenticate}>Submit</Button>
          </Box>
        </Container>
      ) : (
        <Container maxWidth="md">
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h5">Add Today's Weight</Typography>
            <TextField
              label="Weight (kg)"
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="success" onClick={addWeight}>Add Weight</Button>
              <Button variant="outlined" color="error" onClick={logout}>Logout</Button>
            </Box>
            <Typography variant="h6" sx={{ mt: 2 }}>Weight History</Typography>
            <Paper elevation={3} sx={{ padding: 2 }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#42a5f5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#42a5f5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#8884d8" tick={{ fill: darkMode ? '#fff' : '#000' }} />
                  <YAxis stroke="#8884d8" tick={{ fill: darkMode ? '#fff' : '#000' }} />
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#ccc'} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', border: 'none' }} labelStyle={{ color: darkMode ? '#fff' : '#000' }} itemStyle={{ color: darkMode ? '#fff' : '#000' }} />
                  <Area type="monotone" dataKey="weight" stroke="#42a5f5" fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
            <Typography variant="h6">Entries Table</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Weight (lbs)</TableCell>
                    <TableCell sortDirection={sortDirection}>
                      <TableSortLabel
                        active
                        direction={sortDirection}
                        onClick={toggleSort}
                      >
                        Logged Date
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{entry.weight}</TableCell>
                      <TableCell>{new Date(entry.date).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Container>
      )}
    </ThemeProvider>
  );
}

export default App;
