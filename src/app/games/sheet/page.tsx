import { getPlayers } from '@/app/actions/players'
import CreateSheetForm from './CreateSheetForm'

export const dynamic = 'force-dynamic'

export default async function SheetPage() {
    const players = await getPlayers()

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">記録票 (シート)</h1>
            <CreateSheetForm players={players} />
        </div>
    )
}
