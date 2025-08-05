// src/components/AnswerForm.tsx
import React, { useState, useEffect } from 'react';
import { Button, TextField, Stack } from '@mui/material';

interface AnswerFormProps {
  onSubmit: (answer: string) => void;
  error: string;
}

const AnswerForm: React.FC<AnswerFormProps> = ({ onSubmit, error }) => {
  const [answer, setAnswer] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setLocalError(error);
    if (error) {
      // Keep the answer in the text field so the user can edit it.
      // setAnswer(''); 
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmit(answer.trim().toLowerCase());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ alignItems: 'center', width: '100%', maxWidth: 500, mx: 'auto' }}>
        <TextField
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setLocalError(''); // Clear error on new input
          }}
          label="Enter your fake answer..."
          variant="outlined"
          multiline
          rows={3}
          fullWidth
          error={!!localError}
          helperText={localError || "Try to fool the other players!"}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={!answer.trim()}
        >
          Submit Answer
        </Button>
      </Stack>
    </form>
  );
};

export default AnswerForm;
