import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Spreadsheet from './components/spreadsheet/Spreadsheet.component';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/my-accounting" element={<Spreadsheet rows={40} columns = {20}/>} />
      </Routes>
    </Router>
  );
}

export default App;
