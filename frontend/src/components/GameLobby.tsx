// src/components/GameLobby.tsx
import React, { useState } from 'react';
import { Button, TextField, Typography, Paper, Divider, Stack } from '@mui/material';

interface GameLobbyProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomCode: string) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [roomCode, setRoomCode] = useState('');

  const handleJoinClick = () => {
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase());
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Join or Create a Game
      </Typography>
      
      <Stack spacing={2} sx={{ mt: 3 }}>
        <Button
          onClick={onCreateRoom}
          variant="contained"
          color="primary"
          size="large"
        >
          Create New Game
        </Button>
        
        <Divider>OR</Divider>

        <Stack spacing={1}>
          <TextField
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            label="Room Code"
            variant="outlined"
            fullWidth
            inputProps={{
              maxLength: 6,
              style: { textTransform: 'uppercase', textAlign: 'center' }
            }}
          />
          <Button
            onClick={handleJoinClick}
            disabled={!roomCode.trim()}
            variant="outlined"
            size="large"
          >
            Join with Code
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default GameLobby;
