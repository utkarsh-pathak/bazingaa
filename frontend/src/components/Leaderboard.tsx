// src/components/Leaderboard.tsx
import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, Avatar, ListItemAvatar, Button } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Medal icon

interface Player {
  id: number;
  username: string;
  score: number;
}

interface LeaderboardProps {
  players: Player[];
  isFinal: boolean;
  isHost?: boolean;
  onPlayAgain?: () => void;
}

const getMedalColor = (index: number) => {
  if (index === 0) return '#FFD700'; // Gold
  if (index === 1) return '#C0C0C0'; // Silver
  if (index === 2) return '#CD7F32'; // Bronze
  return 'action.disabled';
};

const Leaderboard: React.FC<LeaderboardProps> = ({ players, isFinal, isHost, onPlayAgain }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center', width: '100%' }}>
      <Typography variant="h4" component="h2" gutterBottom>
        {isFinal ? 'Final Scores' : 'Leaderboard'}
      </Typography>
      <List>
        {sortedPlayers.map((player, index) => (
          <React.Fragment key={player.id}>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {player.username.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary={`${index + 1}. ${player.username}`} 
                secondary={`${player.score} pts`} 
                primaryTypographyProps={{ variant: 'h6', fontWeight: 'medium' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.secondary' }}
              />
              {index < 3 && (
                <EmojiEventsIcon sx={{ color: getMedalColor(index), fontSize: 30 }} />
              )}
            </ListItem>
            {index < sortedPlayers.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
      {isFinal && sortedPlayers.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h3" component="p" sx={{ fontWeight: 'bold' }}>
            🏆 {sortedPlayers[0].username} wins! 🏆
          </Typography>
        </Box>
      )}
      {isFinal && isHost && (
        <Box sx={{ mt: 4 }}>
          <Button variant="contained" color="primary" onClick={onPlayAgain}>
            Play Again
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default Leaderboard;
