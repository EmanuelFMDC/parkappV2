import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Providers } from './app/Providers'
import { HomePage } from './pages/HomePage'
import { StyleguidePage } from './styleguide/StyleguidePage'

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="design-system" element={<StyleguidePage />} />
          <Route index element={<HomePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}
