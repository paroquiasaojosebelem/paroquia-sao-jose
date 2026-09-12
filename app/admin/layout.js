import AdminShell from '../../components/AdminShell'
import { requireAdmin } from '../../lib/auth'
export default async function AdminLayout({children}){const {profile}=await requireAdmin();return <AdminShell profile={profile}>{children}</AdminShell>}
