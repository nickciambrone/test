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

  // Load grid from local storage or create a new one
  const loadGrid = () => {
    const savedGrid = localStorage.getItem('spreadsheetGrid');
    return savedGrid ? JSON.parse(savedGrid) : createInitialGrid();
  };

  const [grid, setGrid] = useState(loadGrid());
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [copiedContent, setCopiedContent] = useState('');

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
    console.log(newGrid); // Log the grid state
  };

  // Handle input blur to save the state after editing
  const handleInputBlur = () => {
    setEditingCell(null);
  };

// Handle KeyDown for Copy (Ctrl+C) and Paste (Ctrl+V)
const handleKeyDown = (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
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
      console.log(newGrid); // Log the grid state
    } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      // Handle copy (Ctrl+C)
      if (selectedCell) {
        const cellData = grid[selectedCell.row][selectedCell.col];
        setCopiedContent(cellData);
        e.preventDefault(); // Prevent copying to system clipboard
      }
    } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      // Handle paste (Ctrl+V)
      if (selectedCell && copiedContent !== '') {
        const newGrid = [...grid];
        newGrid[selectedCell.row][selectedCell.col] = copiedContent;
        setGrid(newGrid);
        console.log(newGrid); // Log the grid state
        e.preventDefault(); // Prevent pasting from system clipboard
      }
    }
  };
  
  // Handle paste event for multi-cell paste from external sources
  const handlePaste = (e) => {
    e.preventDefault(); // Prevent default paste behavior
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
    console.log(newGrid); // Log the grid state
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



  // Save grid to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('spreadsheetGrid', JSON.stringify(grid));
  }, [grid]);

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
