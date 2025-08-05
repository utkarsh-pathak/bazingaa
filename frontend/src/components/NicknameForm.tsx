// src/components/NicknameForm.tsx
import { useState } from 'react';
import { Button, TextField, Typography, Paper, Stack } from '@mui/material';

interface NicknameFormProps {
  onNicknameSubmit: (nickname: string) => void;
}

const NicknameForm: React.FC<NicknameFormProps> = ({ onNicknameSubmit }) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      setError('Nickname must be at least 2 characters long.');
      return;
    }
    if (nickname.trim().length > 15) {
      setError('Nickname cannot be more than 15 characters long.');
      return;
    }
    onNicknameSubmit(nickname.trim());
  };

  return (
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Choose Your Nickname
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 3 }}>
          <TextField
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError('');
            }}
            label="Nickname"
            variant="outlined"
            fullWidth
            error={!!error}
            helperText={error}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
          >
            Continue
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default NicknameForm;
