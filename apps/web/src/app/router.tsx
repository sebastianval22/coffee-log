import { createBrowserRouter } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { BagDetailPage } from '@/features/bags/BagDetailPage'
import { BagsPage } from '@/features/bags/BagsPage'
import { EditBagPage } from '@/features/bags/EditBagPage'
import { NewBagPage } from '@/features/bags/NewBagPage'
import { HomePage } from '@/features/home/HomePage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { NewVisitPage } from '@/features/visits/NewVisitPage'
import { VisitsPage } from '@/features/visits/VisitsPage'
import { AppLayout } from './AppLayout'
import { NewEntryPage } from './NewEntryPage'
import { NotFoundPage } from './NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'bags', element: <BagsPage /> },
          { path: 'bags/:id', element: <BagDetailPage /> },
          { path: 'bags/:id/edit', element: <EditBagPage /> },
          { path: 'visits', element: <VisitsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'new', element: <NewEntryPage /> },
          { path: 'new/bag', element: <NewBagPage /> },
          { path: 'new/visit', element: <NewVisitPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
