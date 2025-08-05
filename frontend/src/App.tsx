// src/App.tsx
import { useState } from 'react';
import { Container, Box, Typography, Paper, CssBaseline } from '@mui/material';
import GameLobby from './components/GameLobby';
import GameRoom from './components/GameRoom';
import NicknameForm from './components/NicknameForm';
import { API_URL } from './config';

interface Player {
  id: number;
  username: string;
  score: number;
}

interface User {
  id: number | null;
  username: string;
}

interface RoomState {
  roomCode: string;
  players: Player[];
  userId: number;
  ownerId: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  const handleNicknameSubmit = (nickname: string) => {
    setUser({ id: null, username: nickname });
  };

  const handleCreateRoom = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/rooms/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${user.username}'s Room`,
          user: { username: user.username, password: "password" }
        }),
      });
      const roomData = await response.json();
      if (response.ok) {
        const me = roomData.players.find((p: Player) => p.username === user.username);
        if (me) {
          setUser({ ...user, id: me.id });
          setRoomState({ 
            roomCode: roomData.room_code, 
            players: roomData.players, 
            userId: me.id,
            ownerId: roomData.owner_id 
          });
        }
      } else {
        alert(roomData.detail);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Is the backend server running?");
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, password: "password" }),
      });
      const roomData = await response.json();
      if (response.ok) {
        const me = roomData.players.find((p: Player) => p.username === user.username);
        if (me) {
          setUser({ ...user, id: me.id });
          setRoomState({ 
            roomCode: roomData.room_code, 
            players: roomData.players, 
            userId: me.id,
            ownerId: roomData.owner_id
          });
        }
      } else {
        alert(roomData.detail);
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Failed to join room. Is the backend server running?");
    }
  };

  const renderContent = () => {
    if (!user) {
      return <NicknameForm onNicknameSubmit={handleNicknameSubmit} />;
    }
    if (roomState && user.id) {
      const isHost = roomState.ownerId === user.id;
      return (
        <GameRoom
          roomCode={roomState.roomCode}
          initialPlayers={roomState.players}
          userId={user.id}
          isHost={isHost}
        />
      );
    }
    return <GameLobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  };

  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Bazinga!
          </Typography>
        </Box>
        <Paper elevation={4} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
          <main>{renderContent()}</main>
        </Paper>
      </Container>
    </>
  );
}

export default App;
