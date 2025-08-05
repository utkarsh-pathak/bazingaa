// src/components/RoundResults.tsx
import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Avatar, Stack, Divider } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonIcon from '@mui/icons-material/Person';

interface Result {
  answer_text: string;
  author: string;
  voters: string[];
  points: number;
}

interface RoundResultsProps {
  results: Result[];
}

const RoundResults: React.FC<RoundResultsProps> = ({ results }) => {
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
        Round Results
      </Typography>
      <Stack spacing={2}>
        {results.map((result, index) => {
          const isCorrectAnswer = result.author === 'Bazinga!';
          return (
            <Card 
              key={index} 
              elevation={3}
              sx={{ 
                border: 2,
                borderColor: isCorrectAnswer ? 'success.main' : 'transparent',
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: isCorrectAnswer ? 'success.main' : 'primary.main' }}>
                    {isCorrectAnswer ? <CheckCircleOutlineIcon /> : <PersonIcon />}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      "{result.answer_text}"
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isCorrectAnswer ? 'The real answer' : `Submitted by: ${result.author}`}
                    </Typography>
                  </Box>
                  <Typography variant="h5" component="div" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    +{result.points}
                  </Typography>
                </Stack>
                {result.voters.length > 0 && !isCorrectAnswer && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Fooled:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {result.voters.map((voter, i) => (
                        <Chip 
                          key={i} 
                          label={voter} 
                          size="small"
                          avatar={<Avatar>{voter.charAt(0).toUpperCase()}</Avatar>} 
                        />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default RoundResults;
