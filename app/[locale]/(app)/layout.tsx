import { BottomNav } from '@/components/layout/BottomNav'

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav locale={locale} />
    </div>
  )
}
