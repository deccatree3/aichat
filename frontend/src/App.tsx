import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import LoginSheet from './components/LoginSheet'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MyPage from './pages/MyPage'
import MorePage from './pages/MorePage'
import AccountSettingsPage from './pages/AccountSettingsPage'
import CustomerCenterPage from './pages/CustomerCenterPage'
import WithdrawalPage from './pages/WithdrawalPage'
import SignupProfilePage from './pages/SignupProfilePage'
import NotificationCategoryPage from './pages/NotificationCategoryPage'
import NotificationSettingsPage from './pages/NotificationSettingsPage'
import NoticeDetailPage from './pages/NoticeDetailPage'
import NoticeListPage from './pages/NoticeListPage'
import PieceChargePage from './pages/PieceChargePage'
import PieceHistoryPage from './pages/PieceHistoryPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import BlockedItemsPage from './pages/BlockedItemsPage'
import AdminNoticeGuard from './pages/AdminNoticeGuard'
import AdminNoticeListPage from './pages/AdminNoticeListPage'
import AdminNoticeFormPage from './pages/AdminNoticeFormPage'
import SupportFaqListPage from './pages/SupportFaqListPage'
import SupportFaqDetailPage from './pages/SupportFaqDetailPage'
import SupportSearchPage from './pages/SupportSearchPage'
import SupportContactListPage from './pages/SupportContactListPage'
import SupportContactCreatePage from './pages/SupportContactCreatePage'
import SupportContactDetailPage from './pages/SupportContactDetailPage'

export default function App() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [sheetOpen, setSheetOpen] = useState(() => searchParams.has('nudge'))
  const isSupportRoute = location.pathname.startsWith('/customer-center')

  return (
    <div className={isSupportRoute ? 'app-shell app-shell--support' : 'app-shell'}>
      <Routes>
        <Route path="/" element={<HomePage onLoginRequired={() => setSheetOpen(true)} />} />
        <Route path="/ranking" element={<HomePage mode="ranking" onLoginRequired={() => setSheetOpen(true)} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/signup" element={<SignupProfilePage />} />
        <Route path="/my-page" element={<MyPage onLoginRequired={() => setSheetOpen(true)} />} />
        <Route path="/more" element={<MorePage onLoginRequired={() => setSheetOpen(true)} />} />
        <Route path="/settings/account" element={<AccountSettingsPage />} />
        <Route path="/withdrawal" element={<WithdrawalPage />} />
        <Route path="/customer-center" element={<CustomerCenterPage />} />
        <Route path="/customer-center/search" element={<SupportSearchPage />} />
        <Route path="/customer-center/faqs" element={<SupportFaqListPage />} />
        <Route path="/customer-center/faqs/:id" element={<SupportFaqDetailPage />} />
        <Route path="/customer-center/contacts" element={<SupportContactListPage />} />
        <Route path="/customer-center/contacts/create" element={<SupportContactCreatePage />} />
        <Route path="/customer-center/contacts/:id" element={<SupportContactDetailPage />} />
        <Route path="/settings/notification" element={<NotificationSettingsPage />} />
        <Route path="/settings/notification/:category" element={<NotificationCategoryPage />} />
        <Route path="/announcements" element={<NoticeListPage />} />
        <Route path="/announcements/:id" element={<NoticeDetailPage />} />
        <Route path="/admin/notices" element={<AdminNoticeGuard><AdminNoticeListPage /></AdminNoticeGuard>} />
        <Route path="/admin/notices/new" element={<AdminNoticeGuard><AdminNoticeFormPage /></AdminNoticeGuard>} />
        <Route path="/admin/notices/:id/edit" element={<AdminNoticeGuard><AdminNoticeFormPage /></AdminNoticeGuard>} />
        <Route path="/piece/charge" element={<PieceChargePage />} />
        <Route path="/piece/history" element={<PieceHistoryPage />} />
        <Route path="/blocked-creators" element={<BlockedItemsPage kind="creators" />} />
        <Route path="/blocked-plots" element={<BlockedItemsPage kind="plots" />} />
        <Route path="/blocked-hashtags" element={<BlockedItemsPage kind="hashtags" />} />
        <Route path="/rooms" element={<HomePage title="대화" onLoginRequired={() => setSheetOpen(true)} />} />
        <Route path="/chats" element={<Navigate to="/rooms" replace />} />
        <Route path="/create" element={<HomePage title="제작" onLoginRequired={() => setSheetOpen(true)} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <LoginSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
