import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Providers } from './app/Providers'
import { HomePage } from './pages/HomePage'

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}
