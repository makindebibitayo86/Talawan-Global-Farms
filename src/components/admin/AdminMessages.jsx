import { useParams } from 'react-router-dom'
import MailTab from './MailTab'
import AdminNewsletter from './AdminNewsletter'

// Mirrors AdminSettings.jsx's :tab pattern — one entry per sub-section.
const TABS = ['mail', 'news']

export default function AdminMessages() {
  const { tab } = useParams()
  const activeTab = TABS.includes(tab) ? tab : 'mail'

  return (
    <div>
      {activeTab === 'mail' && <MailTab />}
      {activeTab === 'news' && <AdminNewsletter />}
    </div>
  )
}
