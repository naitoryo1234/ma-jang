import { getPlayers } from '@/app/actions/players'
import GameForm from './GameForm'

export const dynamic = 'force-dynamic'

export default async function NewGamePage() {
    const players = await getPlayers()

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">結果入力</h1>
            {players.length < 4 ? (
                <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 border border-yellow-200">
                    <p className="font-bold">プレイヤー不足</p>
                    <p className="text-sm mt-1">
                        少なくとも4人のプレイヤーが必要です。
                        <a href="/players" className="underline ml-1">プレイヤー管理</a>から追加してください。
                    </p>
                </div>
            ) : (
                <GameForm players={players} />
            )}
        </div>
    )
}
