import axios from 'axios';

// const API_KEY = 'PUT IT HERE IF NEEDED';
const BASE_URL = 'http://localhost:8080';

const instance = axios.create({
  baseURL: BASE_URL,
});

export const startNewLobby = async (player, side) => {
  const requestData = {
    playerId: player,
    side: side,
  };
  const response = await instance.post('/games', requestData);
  // console.log('Posting a new game:', response.data);
  return response.data;
};

export const joinGame = async (gameId, playerId) => {
  const requestData = {
    gameId,
    playerId,
  };
  const response = await instance.put('/games', requestData);
  console.log('Joining game:', response.data);
  return response.data;
};

// Новый PUT-запрос для отправки хода
export const submitMove = async (gameId, moveData) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/games/${gameId}/moves`,
      moveData
    );

    return response.data;
  } catch (error) {
    console.error('Error submitting move:', error);
    throw error;
  }
};

//Get current state of a game (the result of the last move)
export const getCheckersPositions = async gameId => {
  const { data } = await instance.get(`/games/${gameId}/moves`);
  console.log('fetching board state');
  return data;
};

// the game API

// GET
// /game
// Get games

// POST
// /game
// Start a new game

// GET
// /game/{gameId}
// Find game by ID
