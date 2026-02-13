import { getPlayerStats } from '@/app/actions/players'
import RecentGamesList from '@/components/RecentGamesList'

export const dynamic = 'force-dynamic'

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
    const data = await getPlayerStats(params.id)

    if (!data) {
        return <div className="p-4">プレイヤーが見つかりません</div>
    }

    const { player, stats, matchups } = data

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold mb-2">{player.name}</h1>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">総ポイント</div>
                        <div className={`text-xl font-bold ${stats.totalPoint >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                            {stats.totalPoint.toFixed(1)}
                        </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">対局数</div>
                        <div className="text-xl font-bold">{stats.totalGames}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">平均順位</div>
                        <div className="text-xl font-bold">{stats.averagePlace.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xs text-gray-500 mb-1">平均Pt</div>
                        <div className="text-xl font-bold">{stats.averagePoint.toFixed(1)}</div>
                    </div>
                </div>
            </div>

            <section>
                <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">🤝 相性 (同卓時のPt差)</h2>
                <div className="bg-white rounded-lg shadow overflow-hidden text-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-2 text-left">相手</th>
                                <th className="px-4 py-2 text-right">回数</th>
                                <th className="px-4 py-2 text-right">平均差</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {matchups.map((m: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{m.name}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{m.games}</td>
                                    <td className={`px-4 py-3 text-right font-bold ${m.averageDiff >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                        {m.averageDiff > 0 ? '+' : ''}{m.averageDiff.toFixed(1)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-500 mt-2 px-1">※ プラスならカモにしています。マイナスなら苦手です。</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">履歴</h2>
                {/* @ts-ignore: Type mismatch for MVP speed */}
                <RecentGamesList games={player.participations.map(p => p.game)} />
            </section>
        </div>
    )
}
