import React, { useState, useEffect } from 'react';

const Spreadsheet = ({ rows, columns, initialValues = [] }) => {
  const headers = ['ENT', 'ACCT', 'SUBAC', 'TT', 'PDGRP', 'CENTER', 'CP', 'LOC', 'FUTURE', 'DEBIT', 'CREDIT', 'Line Description', 'Line DFF Context', 'Line DFF', 'Captured Info Context', 'Captured Info DFF'];
  const accountingFields = [
    'Ledger',
    'Source',
    'Category',
    'Currency',
    'Accounting Date',
    'Batch Name',
    'Batch Description',
    'Journal Name',
    'Journal Description',
  ];

  // Initialize the grid state
  const createInitialGrid = () => {
    const grid = new Array(rows).fill(null).map(() => new Array(columns).fill(''));

    // Fill accounting fields in column A (row 1 to 10)
    for (let i = 0; i < accountingFields.length; i++) {
      grid[i][0] = accountingFields[i]; // First column (A)
    }

    // Fill header row 11
    for (let i = 0; i < headers.length; i++) {
      grid[10][i] = headers[i]; // Row 11
    }

    // If initial values are provided, fill the grid with them
    if (initialValues.length > 0) {
      for (let i = 0; i < initialValues.length && i < rows; i++) {
        for (let j = 0; j < initialValues[i].length && j < columns; j++) {
          grid[i][j] = initialValues[i][j];
        }
      }
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
    // Only allow editing if it's not an accounting field or header with value
    if (row >= 10 || (row === 10 && col >= 15) || (row < 10 && col > 0)) {
      setEditingCell({ row, col });
    }
  };

  // Handle cell input change
  const handleChange = (e, row, col) => {
    const newGrid = [...grid];
    newGrid[row][col] = e.target.value;
    setGrid(newGrid);
  };

  // Handle input blur to save the state after editing
  const handleInputBlur = () => {
    setEditingCell(null);
  };

  // Handle copy event
  const handleCopy = () => {
    if (selectedRange) {
      const { start, end } = selectedRange;
      const copiedRange = [];
      
      for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
        copiedRange.push(grid[row].slice(Math.min(start.col, end.col), Math.max(start.col, end.col) + 1));
      }
  
      const copiedText = copiedRange.map(row => row.join('\t')).join('\n');
      navigator.clipboard.writeText(copiedText);
    } else if (selectedCell) {
      const cellData = grid[selectedCell.row][selectedCell.col];
      navigator.clipboard.writeText(cellData);
    }
  };
  
  // Handle paste event
 // Handle paste event
const handlePaste = async (e) => {
    e.preventDefault();
  
    try {
      const text = await navigator.clipboard.readText();
  
      if (!text) {
        console.error("No data to paste from clipboard.");
        return;
      }
  
      const rowsData = text.split('\n').map(row => row.split('\t'));
      const newGrid = [...grid];
  
      rowsData.forEach((rowData, i) => {
        rowData.forEach((cellData, j) => {
          if (selectedCell) {
            const targetRow = selectedCell.row + i;
            const targetCol = selectedCell.col + j;
            const isHeaderOrAccountingField = (targetRow < 10 && accountingFields.includes(newGrid[targetRow][targetCol])) || (targetRow === 10 && targetCol < headers.length);
  
            // Only update if the target cell is not a header or accounting field
            if (targetRow < rows && targetCol < columns && !isHeaderOrAccountingField) {
              newGrid[targetRow][targetCol] = cellData;
            }
          }
        });
      });
  
      setGrid(newGrid);
    } catch (error) {
      console.error("Failed to read clipboard data: ", error);
    }
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

  // Handle key down events
  const handleKeyDown = (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const newGrid = [...grid];
      if (selectedRange) {
        const { start, end } = selectedRange;
        for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
          for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col++) {
            const isHeaderOrAccountingField = (row < 10 && accountingFields.includes(newGrid[row][col])) || (row === 10 && col < headers.length);
            if (!isHeaderOrAccountingField) {
              newGrid[row][col] = '';
            }
          }
        }
      } else if (selectedCell) {
        const { row, col } = selectedCell;
        const isHeaderOrAccountingField = (row < 10 && accountingFields.includes(newGrid[row][col])) || (row === 10 && col < headers.length);
        if (!isHeaderOrAccountingField) {
          newGrid[row][col] = '';
        }
      }
      setGrid(newGrid);
    } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      handleCopy();
    } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      handlePaste(e);
    } else if (e.key === 'Enter') {
      setEditingCell(null);
    }else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); // Prevent default scrolling behavior
        if (selectedCell) {
            let newRow = selectedCell.row;
            let newCol = selectedCell.col;

            if (e.key === 'ArrowUp' && newRow > 0) newRow--;
            if (e.key === 'ArrowDown' && newRow < rows - 1) newRow++;
            if (e.key === 'ArrowLeft' && newCol > 0) newCol--;
            if (e.key === 'ArrowRight' && newCol < columns - 1) newCol++;

            setSelectedCell({ row: newRow, col: newCol });
            setSelectedText(getCellLabel(newRow, newCol));
        }
    }
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
        {rowData.map((cellData, col) => {
          const isHeaderOrAccountingField = (row < 10 && accountingFields.includes(cellData)) || (row === 10 && col < headers.length);
          const isEditable = !(isHeaderOrAccountingField && cellData !== '');
          
          return (
            <td
              key={`${row}-${col}`}
              className={`cell ${isSelected(row, col) ? 'selected' : ''} ${isHeaderOrAccountingField && cellData !== '' ? 'non-editable' : ''}`}
              onClick={(e) => handleCellClick(row, col, e)}
              onDoubleClick={() => handleCellDoubleClick(row, col)}
              style={{ cursor: isEditable ? 'pointer' : 'not-allowed' }}
            >
              {editingCell && editingCell.row === row && editingCell.col === col ? (
                <input
                  type="text"
                  value={cellData}
                  onChange={(e) => handleChange(e, row, col)}
                  onBlur={handleInputBlur}
                  autoFocus
                />
              ) : (
                <span>{cellData}</span>
              )}
            </td>
          );
        })}
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

        .excel-like-grid td.non-editable {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .excel-like-grid input {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default Spreadsheet;
