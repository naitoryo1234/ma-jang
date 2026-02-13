import Link from "next/link"

type RankingItem = {
    id: string
    name: string
    totalPoint: number
    games: number
    averageOrder: number
}

export default function RankingTable({ ranking }: { ranking: RankingItem[] }) {
    if (ranking.length === 0) {
        return <div className="text-gray-500 text-sm">データがありません</div>
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                    <tr>
                        <th className="px-3 py-2 text-left">順位</th>
                        <th className="px-3 py-2 text-left">名前</th>
                        <th className="px-3 py-2 text-right">Pts</th>
                        <th className="px-3 py-2 text-right">回数</th>
                        <th className="px-3 py-2 text-right">平均</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {ranking.map((player, index) => (
                        <tr key={player.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 font-bold text-gray-400 w-10">#{index + 1}</td>
                            <td className="px-3 py-3 font-bold text-gray-900">
                                <Link href={`/players/${player.id}`} className="hover:underline">
                                    {player.name}
                                </Link>
                            </td>
                            <td className={`px-3 py-3 text-right font-bold ${player.totalPoint >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                {player.totalPoint.toFixed(1)}
                            </td>
                            <td className="px-3 py-3 text-right text-gray-600">{player.games}</td>
                            <td className="px-3 py-3 text-right text-gray-600">{player.averageOrder.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
