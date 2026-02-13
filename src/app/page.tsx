import { getRanking, getRecentGames } from '@/app/actions/games'
import RankingTable from '@/components/RankingTable'
import RecentGamesList from '@/components/RecentGamesList'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const ranking = await getRanking()
  // @ts-ignore: Prisma inferred types vs defined types mismatch handling for MVP
  const recentGames = await getRecentGames()

  return (
    <div className="space-y-8">
      {/* Hero / Quick Action */}
      <section className="text-center py-4">
        <Link
          href="/games/new"
          className="inline-block w-full max-w-xs bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          結果を入力する
        </Link>
      </section>

      {/* Ranking */}
      <section>
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-lg font-bold text-gray-800">🏆 通算ランキング</h2>
          <Link href="/players" className="text-xs text-blue-600">全て見る</Link>
        </div>
        <RankingTable ranking={ranking} />
      </section>

      {/* Recent Games */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">🕒 直近の対局</h2>
        <RecentGamesList games={recentGames} />
      </section>
    </div>
  )
}
