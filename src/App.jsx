import Home from './pages/Home'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Location from './pages/location'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/location" element={<Location />} />
      </Routes>
    </BrowserRouter>

  )

}
export default App