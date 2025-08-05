// src/components/VotingScreen.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AnswerOption {
  id: number;
  answer_text: string;
  player_id: number;
}

interface VotingScreenProps {
  answers: AnswerOption[];
  onVote: (answerId: number) => void;
  userId: number;
  hasVoted: boolean;
}

const VotingScreen: React.FC<VotingScreenProps> = ({ answers, onVote, userId, hasVoted }) => {
  return (
    <Box sx={{ textAlign: 'center', width: '100%' }}>
      <Typography variant="h5" component="h3" color="primary" gutterBottom>
        Vote for the real answer!
      </Typography>
      {hasVoted && <Typography sx={{ mb: 2 }}>Waiting for other players to vote...</Typography>}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        {answers.map((answer) => {
          const isOwnAnswer = answer.player_id === userId;
          return (
            <Box sx={{ width: 'calc(50% - 1em)', sm: { width: 'calc(50% - 1em)' } }} key={answer.id}>
              <Paper
                onClick={() => !hasVoted && !isOwnAnswer && onVote(answer.id)}
                sx={(theme) => ({
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  border: '2px solid',
                  borderColor: isOwnAnswer ? theme.palette.action.disabled : theme.palette.secondary.main,
                  boxShadow: `0 0 10px ${isOwnAnswer ? 'transparent' : theme.palette.secondary.main}`,
                  cursor: hasVoted || isOwnAnswer ? 'not-allowed' : 'pointer',
                  backgroundColor: isOwnAnswer ? theme.palette.action.disabledBackground : 'transparent',
                  opacity: hasVoted && !isOwnAnswer ? 0.6 : 1,
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  '&:hover': {
                    transform: hasVoted || isOwnAnswer ? 'none' : 'translateY(-2px)',
                    boxShadow: hasVoted || isOwnAnswer ? `0 0 10px transparent` : `0 0 20px ${theme.palette.primary.main}`,
                    borderColor: hasVoted || isOwnAnswer ? theme.palette.action.disabled : theme.palette.primary.main,
                  },
                  '&:active': {
                    transform: hasVoted || isOwnAnswer ? 'none' : 'translateY(0)',
                  }
                })}
                elevation={3}
              >
                <Typography variant="body1">{answer.answer_text.toLowerCase()}</Typography>
              </Paper>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default VotingScreen;
