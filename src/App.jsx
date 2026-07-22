import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminLogin from './components/admin/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminProducts from './components/admin/AdminProducts'
import AdminMessages from './components/admin/AdminMessages'
import AdminGallery from './components/admin/AdminGallery'
import AdminSettings from './components/admin/AdminSettings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminProducts />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
