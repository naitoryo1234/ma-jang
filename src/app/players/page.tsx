import { getPlayers } from '@/app/actions/players'
import AddPlayerForm from './AddPlayerForm'
import Link from 'next/link'
import { Player } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function PlayersPage() {
    const players = await getPlayers()

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">プレイヤー管理</h1>

            <AddPlayerForm />

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {players.length === 0 ? (
                        <li className="p-4 text-center text-gray-500">プレイヤーがいません</li>
                    ) : (
                        players.map((player: Player) => (
                            <li key={player.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                <span className="font-medium text-lg">{player.name}</span>
                                <Link
                                    href={`/players/${player.id}`}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    詳細 &rarr;
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    )
}
