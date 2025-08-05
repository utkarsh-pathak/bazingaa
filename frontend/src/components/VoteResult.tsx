
// src/components/VoteResult.tsx
import React from 'react';
import { Box, Typography, keyframes, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const bazinga = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-30px); }
  60% { transform: translateY(-15px); }
`;

interface VoteResultProps {
  selectedAnswer: {
    text: string;
    isCorrect: boolean;
    fooledBy?: string;
  };
}

const VoteResult: React.FC<VoteResultProps> = ({ selectedAnswer }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        textAlign: 'center',
        width: '100%',
        animation: `${popIn} 0.5s ease-out`,
      }}
    >
      {selectedAnswer.isCorrect ? (
        <Paper elevation={3} sx={{ p: 4, color: 'success.main', border: 2, borderColor: 'success.main' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 60 }} />
          <Typography variant="h2" sx={{ fontWeight: 'bold', mt: 2 }}>
            Correct!
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            You outsmarted everyone!
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 4, color: 'error.main', border: 2, borderColor: 'error.main' }}>
          <ErrorOutlineIcon sx={{ fontSize: 60, animation: `${bazinga} 1s ease-in-out` }} />
          <Typography variant="h2" sx={{ fontWeight: 'bold', mt: 2 }}>
            Bazinga'ed!
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            You fell for <Typography component="span" sx={{ fontWeight: 'bold' }}>{selectedAnswer.fooledBy}</Typography>'s answer!
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default VoteResult;
