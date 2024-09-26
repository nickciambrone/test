import React, { useState, useEffect } from 'react';

const Spreadsheet = ({ rows, columns }) => {
  const headers = ['Account', 'Entity', 'Product Group', 'Transaction Type', 'Current', 'Debit/Credit', 'Amount'];

  // Initialize the grid state
  const createInitialGrid = () => {
    const grid = new Array(rows).fill(null).map(() => new Array(columns).fill(''));
    for (let i = 0; i < headers.length; i++) {
      grid[0][i] = headers[i];
    }
    return grid;
  };

  const [grid, setGrid] = useState(createInitialGrid());
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [history, setHistory] = useState([]); // Stores the grid states for undo functionality
  const maxHistorySize = 5; // Max number of actions we can undo

  // Save grid state to history
  const saveToHistory = () => {
    setHistory(prevHistory => {
      const newGrid = grid.map(row => [...row]); // Deep copy each row of the grid
      const newHistory = [...prevHistory, newGrid]; // Add the deep copied grid to history
  
      if (newHistory.length > maxHistorySize) {
        newHistory.shift(); // Remove oldest if history exceeds max size
      }
  
      return newHistory;
    });
  };

  // Undo the last action
  const undo = () => {
    setHistory(prevHistory => {
      if (prevHistory.length === 0) return prevHistory; // No history to undo
      
      const newHistory = [...prevHistory];
      newHistory.pop(); // Remove the most recent history entry
  
      const lastState = newHistory[newHistory.length - 1] || createInitialGrid(); // Get the second most recent state or initial grid
  
      setGrid(lastState); // Set the grid to the second most recent state
      
      return newHistory; // Return the modified history without the last state
    });
  };

  // Get the cell label like A1, B1, etc.
  const getCellLabel = (row, col) => {
    const columnLabel = String.fromCharCode(65 + col); // Converts 0 -> A, 1 -> B, etc.
    return `${columnLabel}${row + 1}`;
  };

  // Handle cell click
  const handleCellClick = (row, col, e) => {
    if (e.shiftKey && selectionStart) {
      setSelectedRange({
        start: selectionStart,
        end: { row, col }
      });
      const startCell = getCellLabel(selectionStart.row, selectionStart.col);
      const endCell = getCellLabel(row, col);
      setSelectedText(`${startCell}:${endCell}`);
    } else {
      // Normal click
      setSelectedCell({ row, col });
      setSelectionStart({ row, col });
      setSelectedRange(null);
      setSelectedText(getCellLabel(row, col));
    }
  };

  // Handle double-click to enter editing mode
  const handleCellDoubleClick = (row, col) => {
    setEditingCell({ row, col });
  };

  // Handle cell input change
  const handleChange = (e, row, col) => {
    const newGrid = [...grid];
    newGrid[row][col] = e.target.value;
    setGrid(newGrid);
  };

  // Handle input blur to save the state after editing
  const handleInputBlur = () => {
    saveToHistory(); // Save state after editing
    setEditingCell(null);
  };

  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    saveToHistory(); // Save state before making any changes
    const pastedData = e.clipboardData.getData('text');
    const rowsData = pastedData.split('\n').map(row => row.split('\t'));

    const newGrid = [...grid];
    rowsData.forEach((rowData, i) => {
      rowData.forEach((cellData, j) => {
        if (selectedCell) {
          const targetRow = selectedCell.row + i;
          const targetCol = selectedCell.col + j;
          if (targetRow < rows && targetCol < columns) {
            newGrid[targetRow][targetCol] = cellData;
          }
        }
      });
    });
    setGrid(newGrid);
  };

  // Check if the cell is part of the selected range
  const isSelected = (row, col) => {
    if (!selectedRange) return selectedCell && selectedCell.row === row && selectedCell.col === col;
    const { start, end } = selectedRange;
    const rowMin = Math.min(start.row, end.row);
    const rowMax = Math.max(start.row, end.row);
    const colMin = Math.min(start.col, end.col);
    const colMax = Math.max(start.col, end.col);
    return row >= rowMin && row <= rowMax && col >= colMin && col <= colMax;
  };

  // Handle Delete key to clear selected cells
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      // Handle Ctrl+Z or Command+Z for undo
      e.preventDefault();
      console.log('Undo triggered'); // Debugging: Check if undo gets triggered
      undo();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      saveToHistory(); // Save state before making any changes
      const newGrid = [...grid];
      if (selectedRange) {
        const { start, end } = selectedRange;
        for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
          for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col++) {
            newGrid[row][col] = '';
          }
        }
      } else if (selectedCell) {
        newGrid[selectedCell.row][selectedCell.col] = '';
      }
      setGrid(newGrid);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Render grid cells
  const renderGrid = () => {
    return grid.map((rowData, row) => (
      <tr key={row}>
        {rowData.map((cellData, col) => (
          <td
            key={`${row}-${col}`}
            className={`cell ${isSelected(row, col) ? 'selected' : ''}`}
            onClick={(e) => handleCellClick(row, col, e)}
            onDoubleClick={() => handleCellDoubleClick(row, col)}
          >
            {editingCell?.row === row && editingCell?.col === col ? (
              <input
                type="text"
                value={cellData}
                onChange={(e) => handleChange(e, row, col)}
                onBlur={handleInputBlur} // Save state on blur
                autoFocus
              />
            ) : (
              cellData
            )}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Selected Cell(s):</strong> {selectedText || 'None'}
      </div>
      <table className="excel-like-grid" onPaste={handlePaste}>
        <tbody>{renderGrid()}</tbody>
      </table>

      <style jsx>{`
        .excel-like-grid {
          border-collapse: collapse;
          user-select: none;
        }

        .excel-like-grid td {
          width: 100px;
          height: 30px;
          border: 1px solid #ddd;
          text-align: center;
          vertical-align: middle;
          cursor: pointer;
        }

        .excel-like-grid td.selected {
          background-color: lightblue;
        }

        .excel-like-grid td:hover {
          background-color: lightgray;
        }

        .excel-like-grid input {
          width: 98%;
          height: 100%;
          box-sizing: border-box;
          border: none;
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default Spreadsheet;
