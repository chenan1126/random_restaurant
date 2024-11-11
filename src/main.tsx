import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RestaurantPicker from './RestaurantPicker.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RestaurantPicker/>
  </StrictMode>,
)
