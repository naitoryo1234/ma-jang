import { getSheet } from '@/app/actions/sheets'
import ClientSheetDetail from '../ClientSheetDetail'

export const dynamic = 'force-dynamic'

// Correcting PageProps type for Next.js 15+ (params is a Promise)
type PageProps = {
    params: Promise<{ sheetId: string }>
}

export default async function SheetDetailPage({ params }: PageProps) {
    const { sheetId } = await params
    const sheetData = await getSheet(sheetId)

    if (!sheetData) {
        return <div>シートが見つかりません</div>
    }

    // Serialize Date objects for Client Component
    const serializedSheet = JSON.parse(JSON.stringify(sheetData))

    return <ClientSheetDetail sheet={serializedSheet} />
}
