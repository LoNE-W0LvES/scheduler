import React, { useState, useEffect } from 'react';

const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

export default function TicTacToeGate({ onUnlock, themeMode, onToggleTheme }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // User is X
  const [gameMode, setGameMode] = useState('easy'); // 'easy' | 'medium' | 'hard' | 'pvp'
  const [winner, setWinner] = useState(null); // 'X' | 'O' | 'draw'
  const [winningLine, setWinningLine] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Check board state
  const checkWinner = (squares) => {
    for (let pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: pattern };
      }
    }
    if (squares.every(sq => sq !== null)) {
      return { winner: 'draw', line: [] };
    }
    return null;
  };

  // Handle cell click
  const handleClick = (idx) => {
    if (board[idx] || winner || isAiThinking) return;

    const newBoard = [...board];
    newBoard[idx] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const res = checkWinner(newBoard);
    if (res) {
      setWinner(res.winner);
      setWinningLine(res.line);
      setScores(prev => ({ ...prev, [res.winner]: prev[res.winner] + 1 }));
    } else {
      setIsXNext(!isXNext);
    }
  };

  // AI Move effect
  useEffect(() => {
    if (gameMode !== 'pvp' && !isXNext && !winner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        makeAiMove();
        setIsAiThinking(false);
      }, 400); // realistic slight pause
      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, gameMode]);

  const makeAiMove = () => {
    const aiSymbol = 'O';
    const userSymbol = 'X';

    // Helper: find winning or blocking cell
    const findTargetCell = (sym) => {
      for (let pattern of WIN_PATTERNS) {
        const [a, b, c] = pattern;
        const vals = [board[a], board[b], board[c]];
        if (vals.filter(v => v === sym).length === 2 && vals.includes(null)) {
          return pattern[vals.indexOf(null)];
        }
      }
      return -1;
    };

    let move = -1;

    if (gameMode === 'hard') {
      // 1. Try to win
      move = findTargetCell(aiSymbol);
      // 2. Try to block
      if (move === -1) move = findTargetCell(userSymbol);
      // 3. Take center
      if (move === -1 && !board[4]) move = 4;
      // 4. Take random available
    } else if (gameMode === 'medium') {
      // 60% chance to block/win, else random
      if (Math.random() < 0.65) {
        move = findTargetCell(aiSymbol);
        if (move === -1) move = findTargetCell(userSymbol);
      }
    } else {
      // Easy mode: 25% chance to win if immediately available, rarely blocks
      if (Math.random() < 0.25) {
        move = findTargetCell(aiSymbol);
      }
    }

    // Fallback: pick random empty square
    if (move === -1 || board[move] !== null) {
      const emptyIndices = board
        .map((val, idx) => (val === null ? idx : null))
        .filter(val => val !== null);
      if (emptyIndices.length > 0) {
        move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    }

    if (move !== -1) {
      const newBoard = [...board];
      newBoard[move] = aiSymbol;
      setBoard(newBoard);

      const res = checkWinner(newBoard);
      if (res) {
        setWinner(res.winner);
        setWinningLine(res.line);
        setScores(prev => ({ ...prev, [res.winner]: prev[res.winner] + 1 }));
      } else {
        setIsXNext(true);
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
  };

  const isUserWinner = winner === 'X' || (gameMode === 'pvp' && (winner === 'X' || winner === 'O'));

  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#121212] flex flex-col justify-between items-center px-4 py-8 transition-colors duration-300">
      {/* Top Header Bar */}
      <div className="w-full max-w-2xl flex justify-between items-center bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] px-5 py-3 rounded-2xl shadow-sm mb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl animate-bounce">🎮</span>
          <div>
            <h1 className="font-kanit text-lg font-bold text-[#111] dark:text-[#F0F0F0] leading-tight">
              HR Planner Access Gate
            </h1>
            <p className="text-[11px] text-[#888] dark:text-[#AAA]">
              Security verification via Tic-Tac-Toe
            </p>
          </div>
        </div>
        <button
          onClick={onToggleTheme}
          className="px-3 py-1.5 rounded-xl border border-[#E2E0D8] dark:border-[#333] text-xs font-medium text-[#444] dark:text-[#CCC] hover:bg-[#F0EFEB] dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>{themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>
        </button>
      </div>

      {/* Main Challenge Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center relative overflow-hidden">
        
        {/* Glow overlay if won */}
        {isUserWinner && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1D9E75]/10 to-transparent pointer-events-none animate-pulse" />
        )}

        {/* Title */}
        <h2 className="font-kanit text-2xl font-bold text-[#111] dark:text-[#F0F0F0] text-center mb-1">
          {winner ? (
            isUserWinner ? (
              <span className="text-[#1D9E75] dark:text-[#26D09A] flex items-center justify-center gap-2">
                🎉 Victory Achieved!
              </span>
            ) : winner === 'draw' ? (
              <span className="text-[#EBA038]">🤝 Stalemate!</span>
            ) : (
              <span className="text-[#E24B4A]">🤖 AI Took The Round!</span>
            )
          ) : (
            'Make Your Move (X)'
          )}
        </h2>
        
        <p className="text-xs text-[#666] dark:text-[#AAA] text-center mb-6">
          {winner
            ? isUserWinner
              ? 'Verification complete. You have unlocked access to your HR tasks!'
              : 'Try again! Win a game against the AI to open your workspace.'
            : isAiThinking
            ? 'AI is calculating its strategy...'
            : gameMode === 'pvp'
            ? `Current turn: Player ${isXNext ? 'X' : 'O'}`
            : 'Win a round of Tic-Tac-Toe to proceed into the application.'}
        </p>

        {/* Difficulty Mode Selector */}
        <div className="flex gap-1.5 bg-[#F0EFEB] dark:bg-[#262626] p-1 rounded-xl mb-6 w-full justify-center">
          {[
            { id: 'easy', label: '🟢 Easy AI' },
            { id: 'medium', label: '🟡 Smart AI' },
            { id: 'hard', label: '🔴 Hard AI' },
            { id: 'pvp', label: '👥 2-Player' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { setGameMode(m.id); resetGame(); }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                gameMode === m.id
                  ? 'bg-white dark:bg-[#333] text-[#111] dark:text-white shadow-sm'
                  : 'text-[#666] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Score Board */}
        <div className="flex justify-between w-full px-4 py-2 bg-[#FAFAFA] dark:bg-[#262626] rounded-xl border border-[#EEE] dark:border-[#333] mb-6 text-xs font-medium">
          <div className="text-[#1D9E75] font-bold">You (X): <span className="text-sm font-kanit">{scores.X}</span></div>
          <div className="text-[#888]">Draws: <span className="text-sm font-kanit">{scores.draw}</span></div>
          <div className="text-[#5B4EC8] font-bold">{gameMode === 'pvp' ? 'Player O' : 'AI (O)'}: <span className="text-sm font-kanit">{scores.O}</span></div>
        </div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-3 w-64 h-64 sm:w-72 sm:h-72 mb-6">
          {board.map((cell, idx) => {
            const isWinningCell = winningLine.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleClick(idx)}
                disabled={!!cell || !!winner || isAiThinking}
                className={`rounded-2xl border-2 flex items-center justify-center text-4xl sm:text-5xl font-kanit font-bold transition-all duration-200 cursor-pointer ${
                  isWinningCell
                    ? 'bg-[#1D9E75]/20 border-[#1D9E75] text-[#1D9E75] dark:text-[#26D09A] scale-105 shadow-lg'
                    : cell === 'X'
                    ? 'bg-[#FAFAFA] dark:bg-[#262626] border-[#1D9E75]/40 text-[#1D9E75] dark:text-[#26D09A]'
                    : cell === 'O'
                    ? 'bg-[#FAFAFA] dark:bg-[#262626] border-[#5B4EC8]/40 text-[#5B4EC8] dark:text-[#9E92F8]'
                    : 'bg-[#FAFAFA] dark:bg-[#262626] border-[#E2E0D8] dark:border-[#383838] hover:border-[#888] dark:hover:border-[#666] active:scale-95'
                }`}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        {isUserWinner ? (
          <div className="w-full flex flex-col gap-2.5 animate-fade-in">
            <button
              onClick={onUnlock}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#1D9E75] to-[#16805E] text-white font-kanit font-bold text-base shadow-lg hover:shadow-xl hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🚀 Unlock & Enter Planner Workspace</span>
            </button>
            <button
              onClick={resetGame}
              className="w-full py-2 text-xs font-medium text-[#666] dark:text-[#AAA] hover:text-[#111] dark:hover:text-white transition-colors cursor-pointer"
            >
              Play another round for fun
            </button>
          </div>
        ) : (
          <div className="w-full flex gap-3">
            <button
              onClick={resetGame}
              className="flex-1 py-2.5 rounded-xl border border-[#E2E0D8] dark:border-[#333] bg-[#FAFAFA] dark:bg-[#262626] text-xs font-semibold text-[#444] dark:text-[#CCC] hover:bg-[#EEE] dark:hover:bg-[#333] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🔄 Reset Board</span>
            </button>
            {winner && (
              <button
                onClick={resetGame}
                className="flex-1 py-2.5 rounded-xl bg-[#111] dark:bg-[#E0E0E0] text-white dark:text-[#111] text-xs font-bold shadow transition-opacity hover:opacity-90 cursor-pointer"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer / Emergency Bypass */}
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            if (window.confirm('🚨 Urgent HR Meeting bypass?\n\nClick OK to skip verification and access your tasks immediately.')) {
              onUnlock();
            }
          }}
          className="text-[11px] text-[#888] dark:text-[#777] hover:text-[#444] dark:hover:text-[#AAA] underline transition-colors cursor-pointer"
        >
          ⏰ Urgent HR Meeting right now? Emergency Bypass
        </button>
      </div>
    </div>
  );
}
