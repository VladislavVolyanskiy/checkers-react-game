import { useState, useEffect } from 'react';
import {
  // startNewLobby,
  submitMove,
  getCheckersPositions,
} from '../../api/CheckersApi.js';
import CheckersBoardDebug from '../CheckersBoardDebug/CheckersBoardDebug.jsx';
// import StartForm from ../StartForm/StartForm.jsx
import { isArraysEqual } from '../../utils/isArraysEqual.js';
import { getCellColor } from '../../utils/getCellColor.js';
import styles from './CheckersBoard.module.css';
import checkerData from '../../data/newgame.json'; // переписать, чтобы брать из InitialBoardState.json
import InitialBoardState from '../../data/InitialBoardState.json';

const CheckerBoard = ({ gameId, side, playerId }) => {
  // const [playerId, setPlayerId] = useState(); //on gameStart
  // const [side, setSide] = useState('LIGHT'); //on gameStart
  // const [currentGameId, setCurrentGameId] = useState(gameId); //on gameStart
  const [dark, setDark] = useState(checkerData.dark);
  const [light, setLight] = useState(checkerData.light);
  const [isOpponentTurn, setIsOpponentTurn] = useState(false); // opponent's turn is default
  const [possibleMoves, setPossibleMoves] = useState([]); //
  const [startMoveCell, setStartMoveCell] = useState(null); // Начальная клетка
  // const [endMoveCell, setEndMoveCell] = useState(null); // Конечная клетка
  const [highlightedCell, setHighlightedCell] = useState(null); // Подсвеченная ячейка
  const [moveData, setMoveData] = useState(null); // Состояние для moveData только для CheckersBoardDebug!

  // Преобразуем possibleMoves в массив строк и устанавливаем state
  const formatAndSetPossibleMoves = possibleMoves => {
    const formattedMoves = Object.entries(possibleMoves).flatMap(
      ([position, moves]) =>
        moves.map(move => `${position}-${move.destination}`)
    );
    setPossibleMoves(formattedMoves);
  };

  // Функция для обновления состояния доски
  const updateBoardState = async () => {
    try {
      const data = await getCheckersPositions(gameId);
      if (
        !isArraysEqual(data.state.dark, dark) ||
        !isArraysEqual(data.state.light, light)
      ) {
        setDark(data.state.dark);
        setLight(data.state.light);

        formatAndSetPossibleMoves(data.possibleMoves);

        setIsOpponentTurn(side !== data.side);
      }
    } catch (error) {
      console.error('Error updating board state:', error);
    }
  };

  useEffect(() => {
    // Создаем начальные ходы один раз при загрузке компонента
    const initializePossibleMoves = () => {
      if (side === 'LIGHT') {
        // Получаем список ходов из InitialBoardState
        formatAndSetPossibleMoves(InitialBoardState.possibleMoves);
      } else if (side === 'DARK') {
        updateBoardState();
      }
    };

    initializePossibleMoves(); // Вызываем функцию инициализации
  }, []); // Выполняется один раз после загрузки

  useEffect(() => {
    const fetchDataInterval = setInterval(() => {
      if (isOpponentTurn) {
        updateBoardState();
      }
    }, 1000); // 1 time per second

    return () => {
      clearInterval(fetchDataInterval); // Clear the interval when the component unmounts
    };
  }, [gameId, isOpponentTurn, dark, light]); // Add dataFetched to the dependency array

  const handleCellClick = async cellNumber => {
    if (startMoveCell === null) {
      // Проверяем, принадлежит ли шашка текущей стороне
      const playerCheckers = side === 'LIGHT' ? light : dark;
      if (playerCheckers.includes(cellNumber)) {
        setStartMoveCell(cellNumber);
        setHighlightedCell(cellNumber); // Подсветка ячейки
      }
    } else {
      // Устанавливаем конечную ячейку
      // setEndMoveCell(cellNumber);
      const move = `${startMoveCell}-${cellNumber}`;
      if (possibleMoves.includes(move)) {
        // Валидный ход
        const newMoveData = {
          side,
          move,
          state: {
            dark,
            light,
          },
          playerId,
        };
        setMoveData(newMoveData); // Обновляем состояние moveData
        console.log('Move data:', newMoveData);
        try {
          // Отправить данные хода на сервер
          await submitMove(gameId, newMoveData);
          console.log('Move successfully submitted:', newMoveData);
          // Reset состояния после успешного хода
          setStartMoveCell(null);
          setHighlightedCell(null);
          updateBoardState();
        } catch (error) {
          console.error('Failed to submit move:', error);
        }
      } else {
        // Невалидный ход
        setStartMoveCell(null);
        setHighlightedCell(null);
      }
    }
  };

  // Генерация доски
  const renderTable = () => {
    let blackCellCounter = side === 'LIGHT' ? 0 : 33;
    return Array.from({ length: 8 }, (_, row) => (
      <tr key={row}>
        {Array.from({ length: 8 }, (_, col) => {
          const cellColor = getCellColor(row, col);
          const isBlackCell = cellColor === 'black';
          let cellNumber;
          if (side === 'LIGHT') {
            cellNumber = isBlackCell ? ++blackCellCounter : null;
          } else {
            cellNumber = isBlackCell ? --blackCellCounter : null;
          }

          const isHighlighted = cellNumber === highlightedCell;

          const cellText =
            isBlackCell && dark.includes(cellNumber)
              ? '⚫'
              : isBlackCell && light.includes(cellNumber)
              ? '⚪'
              : '';

          return (
            <td
              key={col}
              className={`${styles.cell} ${styles[cellColor]}`}
              data-number={cellNumber}
              onClick={() => handleCellClick(cellNumber)}
            >
              <div
                className={`${styles.checkerPiece} ${
                  isHighlighted && cellText ? styles.pulsing : ''
                }`}
              >
                {cellText}
              </div>
              <div className={styles.cellLabel}>{cellNumber}</div>
            </td>
          );
        })}
      </tr>
    ));
  };

  return (
    <div>
      <table className={styles.checkerboard}>
        <tbody>{renderTable()}</tbody>
      </table>

      {/* Подключение CheckersBoardDebug */}
      <CheckersBoardDebug
        state={{
          playerId,
          side,
          gameId,
          dark,
          light,
          isOpponentTurn,
          possibleMoves,
        }}
        moveData={moveData}
      />
    </div>
  );
};

export default CheckerBoard;
