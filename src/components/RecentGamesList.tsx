import Link from "next/link"

// Type definition based on getRecentGames return type
// Simulating type here for MVP speed, ideally inferred from Prism
type Participant = {
    id: string
    point: number
    place: number
    player: { name: string }
}

type Game = {
    id: string
    playedAt: Date
    participants: Participant[]
}

export default function RecentGamesList({ games }: { games: Game[] }) {
    if (games.length === 0) {
        return <div className="text-gray-500 text-sm">データがありません</div>
    }

    return (
        <div className="space-y-3">
            {games.map((game) => (
                <div key={game.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-xs text-gray-400 mb-2 flex justify-between">
                        <span>{new Date(game.playedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {/* <span>ID: {game.id.slice(0, 4)}</span> */}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                        {game.participants.map((p) => (
                            <div key={p.id} className="flex flex-col items-center">
                                <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold mb-1 ${p.place === 1 ? 'bg-yellow-100 text-yellow-700' :
                                        p.place === 2 ? 'bg-gray-100 text-gray-700' :
                                            p.place === 3 ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                    {p.place}
                                </span>
                                <span className="font-bold truncate max-w-full">{p.player.name}</span>
                                <span className={`text-xs ${p.point >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                    {p.point > 0 ? '+' : ''}{p.point}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
