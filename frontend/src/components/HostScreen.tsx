// src/components/HostScreen.tsx
import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, Paper, Select, MenuItem, FormControl, InputLabel, Stack } from '@mui/material';
import { API_URL } from '../config';

interface HostScreenProps {
  onStartGame: (theme: string, numQuestions: number) => void;
}

const HostScreen: React.FC<HostScreenProps> = ({ onStartGame }) => {
  const [themes, setThemes] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(5);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        // This can remain an HTTP request as it's just fetching static data
        const response = await fetch(`${API_URL}/rooms/themes`);
        const data = await response.json();
        if (response.ok && data.length > 0) {
          setThemes(data);
          setSelectedTheme(data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch themes:", error);
      }
    };
    fetchThemes();
  }, []);

  const handleStart = () => {
    if (selectedTheme && numQuestions > 0) {
      // The onStartGame function will now be responsible for sending the websocket message
      onStartGame(selectedTheme, numQuestions);
    } else {
      alert("Please select a theme and enter a valid number of questions.");
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center', width: '100%' }}>
      <Typography variant="h4" component="h2" gutterBottom>
        You are the Host!
      </Typography>
      <Typography sx={{ mb: 3 }}>
        Choose a theme and number of questions to start the game.
      </Typography>
      
      <Stack spacing={2} sx={{ maxWidth: 400, mx: 'auto' }}>
        <FormControl fullWidth>
          <InputLabel id="theme-select-label">Theme</InputLabel>
          <Select
            labelId="theme-select-label"
            id="theme-select"
            value={selectedTheme}
            label="Theme"
            onChange={(e) => setSelectedTheme(e.target.value)}
            disabled={themes.length === 0}
          >
            {themes.map(theme => (
              <MenuItem key={theme} value={theme}>{theme}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          type="number"
          id="num-questions"
          label="Number of Questions"
          value={numQuestions}
          onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
          inputProps={{ min: 1, max: 20 }}
          fullWidth
        />

        <Button
          onClick={handleStart}
          variant="contained"
          color="primary"
          size="large"
          disabled={!selectedTheme || numQuestions <= 0}
        >
          Start Game
        </Button>
      </Stack>
    </Paper>
  );
};

export default HostScreen;
