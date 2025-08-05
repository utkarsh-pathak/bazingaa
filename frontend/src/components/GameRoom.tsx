// src/components/GameRoom.tsx
import { useState, useRef, useEffect } from "react";
import { Box, Typography, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, useTheme, useMediaQuery, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RoundResults from './RoundResults';
import QuestionDisplay from "./QuestionDisplay";
import Leaderboard from "./Leaderboard";
import HostScreen from "./HostScreen";
import VoteResult from "./VoteResult";
import { API_URL, WEBSOCKET_URL } from '../config';

// --- TypeScript Interfaces ---
interface Player { id: number; username: string; score: number; }
interface Question { id: number; question_text: string; correct_answer_id: number; }
interface AnswerOption { id: number; answer_text: string; player_id: number; }
interface Result { answer_text: string; author: string; voters: string[]; points: number; }
interface VoteResultData {
  text: string;
  isCorrect: boolean;
  fooledBy?: string;
}

type GamePhase = 'waiting' | 'answering' | 'voting' | 'voted' | 'round_over' | 'game_over';

interface GameRoomProps {
  roomCode: string;
  initialPlayers: Player[];
  userId: number;
  isHost: boolean;
}

const parseWebSocketMessage = (message: string) => {
  try { return JSON.parse(message); } catch (error) { return null; }
};

const GameRoom: React.FC<GameRoomProps> = ({ roomCode, initialPlayers, userId, isHost }) => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gamePhase, setGamePhase] = useState<GamePhase>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([]);
  const [roundResults, setRoundResults] = useState<Result[]>([]);
  const [votedPlayerIds, setVotedPlayerIds] = useState<Set<number>>(new Set());
  const [answeredPlayerIds, setAnsweredPlayerIds] = useState<Set<number>>(new Set());
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [voteResult, setVoteResult] = useState<VoteResultData | null>(null);
  const [answerError, setAnswerError] = useState<string>('');

  const socketRef = useRef<WebSocket | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = parseWebSocketMessage(event.data);
      if (!data) return;

      switch (data.event) {
        case 'player_update': 
          setPlayers(data.players);
          break;
        case 'game_started': 
          setGamePhase('answering'); 
          break;
        case 'new_question':
          setCurrentQuestion(data.question);
          setAnsweredPlayerIds(new Set());
          setVotedPlayerIds(new Set());
          setRoundResults([]);
          setVoteResult(null);
          setAnswerError('');
          setGamePhase('answering');
          break;
        case 'player_answered':
          setAnsweredPlayerIds((prev) => new Set(prev).add(data.user_id));
          setAnswerError('');
          break;
        case 'start_voting':
          setAnswerOptions(data.answers);
          setGamePhase('voting');
          break;
        case 'player_voted':
          setVotedPlayerIds((prev) => new Set(prev).add(data.user_id));
          break;
        case 'all_vote_results':
          const userResult = data.results[userId];
          if (userResult) {
            setVoteResult({
              text: userResult.text,
              isCorrect: userResult.is_correct,
              fooledBy: userResult.fooled_by,
            });
          }
          setGamePhase('voted');
          break;
        case 'round_over':
          setRoundResults(data.results);
          setGamePhase('round_over');
          break;
        case 'game_over':
          setLeaderboard(data.leaderboard);
          setGamePhase('game_over');
          break;
        case 'duplicate_answer':
          setAnswerError(data.message);
          break;
        case 'error':
          alert(`Server error: ${data.message}`);
          break;
      }
    };

    if (userId && typeof userId === 'number') {
      const ws = new WebSocket(`${WEBSOCKET_URL}/rooms/ws/${roomCode}/${userId}`);
      socketRef.current = ws;
      ws.onopen = () => console.log('WebSocket connected');
      ws.onclose = () => console.log('WebSocket disconnected');
      ws.onmessage = handleMessage;

      return () => ws.close();
    }
  }, [roomCode, userId]);

  const sendWebSocketMessage = (type: string, payload: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const handleStartGame = (theme: string, numQuestions: number) => {
    sendWebSocketMessage('START_GAME', { theme, num_questions: numQuestions });
  };

  const handleAnswerSubmit = (answerText: string) => {
    if (currentQuestion && userId) {
      setAnswerError('');
      sendWebSocketMessage('SUBMIT_ANSWER', { question_id: currentQuestion.id, answer_text: answerText });
    }
  };

  const handleVoteSubmit = (answerId: number) => {
    if (userId) {
      sendWebSocketMessage('SUBMIT_VOTE', { answer_id: answerId });
    }
  };

  const handleNextQuestion = async () => {
    try {
      const response = await fetch(`${API_URL}/rooms/${roomCode}/next_question/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to advance question: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error advancing to next question:", error);
      alert("An error occurred while trying to advance the question.");
    }
  };

  const renderGameContent = () => {
    if (!userId) {
      return <Typography>Loading user...</Typography>;
    }
    
    switch (gamePhase) {
      case 'answering':
      case 'voting':
        return currentQuestion ? (
          <QuestionDisplay
            question={currentQuestion}
            phase={gamePhase}
            answers={answerOptions}
            userId={userId}
            hasAnswered={answeredPlayerIds.has(userId)}
            hasVoted={votedPlayerIds.has(userId)}
            onAnswerSubmit={handleAnswerSubmit}
            onVoteSubmit={handleVoteSubmit}
            answerError={answerError}
          />
        ) : <Typography>Loading question...</Typography>;
      case 'voted':
        return voteResult ? <VoteResult selectedAnswer={voteResult} /> : <Typography>Loading results...</Typography>;
      case 'round_over':
        return (
          <>
            <RoundResults results={roundResults} />
            {isHost && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleNextQuestion}
                sx={{ mt: 3 }}
              >
                Next Question
              </Button>
            )}
          </>
        );
      case 'game_over':
        return <Leaderboard players={leaderboard} isFinal={true} isHost={isHost} onPlayAgain={handlePlayAgain} />;
      case 'waiting':
      default:
        return isHost ? <HostScreen onStartGame={handleStartGame} /> : <Typography>Waiting for host to start...</Typography>;
    }
  };

  const handlePlayAgain = () => {
    setGamePhase('waiting');
    setCurrentQuestion(null);
    setLeaderboard([]);
    // Reset other relevant states if necessary
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: 2 }}>
      <Box sx={{ flex: '1 1 30%' }}>
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" component="h2" gutterBottom align="center">
            Players
          </Typography>
          <List sx={{ maxHeight: { xs: 150, md: 'calc(100vh - 200px)' }, overflowY: 'auto' }}>
            {sortedPlayers.map((p) => (
              <ListItem 
                key={p.id} 
                sx={{ 
                  bgcolor: p.id === userId ? 'action.selected' : 'background.paper',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>{p.username.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={p.username} 
                  secondary={`${p.score} pts`} 
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                />
                {(gamePhase === 'answering' && answeredPlayerIds.has(p.id)) ||
                 (gamePhase === 'voting' && votedPlayerIds.has(p.id)) ||
                 (gamePhase === 'voted' && votedPlayerIds.has(p.id)) ? (
                  <CheckCircleIcon color="success" />
                ) : null}
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
      <Box sx={{ flex: '1 1 70%' }}>
        <Paper elevation={3} sx={{ p: 2, minHeight: { xs: 300, md: 500 }, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" component="h2" gutterBottom align="center">
            Room: {roomCode}
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderGameContent()}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default GameRoom;

