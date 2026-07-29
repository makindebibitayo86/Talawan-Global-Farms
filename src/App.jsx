import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminLogin from './components/admin/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminProducts from './components/admin/AdminProducts'
import AdminMessages from './components/admin/AdminMessages'
import AdminGallery from './components/admin/AdminGallery'
import AdminTeam from './components/admin/AdminTeam'
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
          <Route path="messages" element={<Navigate to="/admin/messages/mail" replace />} />
          <Route path="messages/:tab" element={<AdminMessages />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="team" element={<AdminTeam />} />
          <Route path="settings" element={<Navigate to="/admin/settings/hero" replace />} />
          <Route path="settings/:tab" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
