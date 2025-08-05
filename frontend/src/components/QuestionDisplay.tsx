// src/components/QuestionDisplay.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import AnswerForm from './AnswerForm';
import VotingScreen from './VotingScreen';

// --- TypeScript Interfaces ---
interface Question {
  id: number;
  question_text: string;
}

interface AnswerOption {
  id: number;
  answer_text: string;
  player_id: number;
}

interface GamePhaseProps {
  question: Question;
  phase: 'answering' | 'voting';
  answers: AnswerOption[];
  userId: number;
  hasAnswered: boolean;
  hasVoted: boolean;
  onAnswerSubmit: (answer: string) => void;
  onVoteSubmit: (answerId: number) => void;
  answerError: string;
}

// --- Main Component ---
const QuestionDisplay: React.FC<GamePhaseProps> = ({ question, phase, answers, userId, hasAnswered, hasVoted, onAnswerSubmit, onVoteSubmit, answerError }) => {
  return (
    <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
        {question.question_text}
      </Typography>
      
      {phase === 'answering' && !hasAnswered && (
        <AnswerForm onSubmit={onAnswerSubmit} error={answerError} />
      )}
      {phase === 'answering' && hasAnswered && (
        <Typography sx={{ mt: 4 }}>Waiting for other players to answer...</Typography>
      )}
      
      {phase === 'voting' && (
        <VotingScreen answers={answers} onVote={onVoteSubmit} userId={userId} hasVoted={hasVoted} />
      )}
    </Box>
  );
};

export default QuestionDisplay;

