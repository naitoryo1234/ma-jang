'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// 型定義
type ParticipantInput = {
    playerId: string
    score: number // 素点
    point: number // 計算後ポイント (UIから渡してもらう想定、またはサーバー計算)
    place: number
    chip: number
}

export type GameState = {
    errors?: {
        general?: string[]
        participants?: string[]
    }
    message?: string
}

// デフォルトルールセットを取得または作成
async function ensureRuleSet() {
    const defaultRule = await prisma.ruleSet.findFirst({
        where: { isDefault: true }
    })
    if (defaultRule) return defaultRule

    // なければ作成
    return await prisma.ruleSet.create({
        data: {
            name: '標準ルール',
            isDefault: true,
        }
    })
}

// 追加: シートIDを受け取るバージョン（既存のcreateGameを拡張するか、ラップする）
// 今回は既存のcreateGameの引数を拡張するのは破壊的変更になるため、
// 別途 sheetId を含めたFormDataを処理できるように修正する。

export async function createGame(prevState: GameState | null, formData: FormData): Promise<GameState> {
    // validation
    const playerIds: string[] = []
    const scores: number[] = []
    const points: number[] = []
    const sheetId = formData.get('sheetId') as string | null

    const participantsData: ParticipantInput[] = []

    for (let i = 0; i < 4; i++) {
        const playerId = formData.get(`player_${i}`) as string
        const scoreStr = formData.get(`score_${i}`)
        const pointStr = formData.get(`point_${i}`)
        const chipStr = formData.get(`chip_${i}`) // New: Chip input

        // ... validation logic (same as before)

        if (!playerId || !scoreStr || !pointStr) {
            return { message: '全てのプレイヤーと点数を入力してください' }
        }

        participantsData.push({
            playerId,
            score: Number(scoreStr),
            point: Number(pointStr),
            place: 0, // 仮、後でソートして埋める
            chip: chipStr ? Number(chipStr) : 0
        })
    }

    // 順位判定 (Pointが高い順)
    participantsData.sort((a, b) => b.point - a.point)
    participantsData.forEach((p, index) => {
        p.place = index + 1
    })

    // ポイント合計チェック (誤差許容するかは要件次第だが、一旦合計0チェックはせず保存する)

    const ruleSet = await ensureRuleSet()

    try {
        await prisma.$transaction(async (tx: any) => {
            const game = await tx.game.create({
                data: {
                    ruleSetId: ruleSet.id,
                    playedAt: new Date(), // 入力されていたらそれを使うべきだが、一旦現在時刻
                    sheetId: sheetId || undefined, // Add sheetId relation
                }
            })

            for (const p of participantsData) {
                await tx.participant.create({
                    data: {
                        gameId: game.id,
                        playerId: p.playerId,
                        score: p.score,
                        point: p.point,
                        place: p.place,
                        chip: p.chip
                    }
                })
            }
        })
        revalidatePath('/games/sheet') // Revalidate list
        if (sheetId) {
            revalidatePath(`/games/sheet/${sheetId}`)
        }
        revalidatePath('/') // Dashboard
        revalidatePath('/players') // Player Actions

        return { message: 'ゲーム結果を保存しました' }
    } catch (e) {
        console.error(e)
        return { message: '保存中にエラーが発生しました', errors: { general: ['DB Error'] } }
    }
}

export async function getRecentGames() {
    return await prisma.game.findMany({
        take: 10,
        orderBy: { playedAt: 'desc' },
        include: {
            participants: {
                include: { player: true },
                orderBy: { place: 'asc' }
            }
        }
    })
}

// 集計用: ランキング
export async function getRanking() {
    // SQLiteだとは集計関数が限られるため、全件取得してJSで計算するか、RawQueryを使う
    // MVPなら全件取得でも耐えられるはずだが、GROUP BYはPrismaでできる
    const participants = await prisma.participant.findMany({
        select: {
            playerId: true,
            point: true,
            place: true,
            player: { select: { name: true } }
        }
    })

    const rankingMap = new Map<string, { name: string, totalPoint: number, games: number, averageOrder: number, totalOrder: number }>()

    for (const p of participants) {
        const current = rankingMap.get(p.playerId) ?? {
            name: p.player.name,
            totalPoint: 0,
            games: 0,
            totalOrder: 0,
            averageOrder: 0
        }

        current.totalPoint += p.point
        current.games += 1
        current.totalOrder += p.place
        // averageOrder更新
        current.averageOrder = current.totalOrder / current.games

        rankingMap.set(p.playerId, current)
    }

    return Array.from(rankingMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.totalPoint - a.totalPoint)
}
