'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

export type PlayerState = {
    errors?: {
        name?: string[]
    }
    message?: string
}

export async function createPlayer(prevState: PlayerState, formData: FormData): Promise<PlayerState> {
    const name = formData.get('name') as string

    if (!name || name.length < 1) {
        return {
            errors: {
                name: ['名前を入力してください'],
            },
            message: '入力エラーがあります',
        }
    }

    try {
        await prisma.player.create({
            data: {
                name,
            },
        })
        revalidatePath('/players')
        return { message: 'プレイヤーを作成しました' }
    } catch (e) {
        return { message: 'データベースエラーが発生しました' }
    }
}

export async function getPlayers() {
    return await prisma.player.findMany({
        orderBy: {
            name: 'asc'
        }
    })
}

// 詳細データ取得用
export async function getPlayerStats(playerId: string) {
    const player = await prisma.player.findUnique({
        where: { id: playerId },
        include: {
            participations: {
                include: {
                    game: {
                        include: {
                            participants: {
                                include: { player: true }
                            }
                        }
                    }
                },
                orderBy: { game: { playedAt: 'desc' } }
            }
        }
    })

    if (!player) return null

    // Explicit type usage to avoid implicit any errors
    const totalGames = player.participations.length
    const totalPoint = player.participations.reduce((sum: number, p: any) => sum + p.point, 0)
    const averagePoint = totalGames > 0 ? totalPoint / totalGames : 0
    const totalPlace = player.participations.reduce((sum: number, p: any) => sum + p.place, 0)
    const averagePlace = totalGames > 0 ? totalPlace / totalGames : 0

    // 順位分布
    const placeDistribution = [0, 0, 0, 0]
    player.participations.forEach((p: any) => {
        if (p.place >= 1 && p.place <= 4) {
            placeDistribution[p.place - 1]++
        }
    })

    // 相性集計
    // 相手ID -> { name, games, pointDiffSum }
    const matchups = new Map<string, { name: string, games: number, pointDiffSum: number }>()

    player.participations.forEach((myPart: any) => {
        const game = myPart.game
        game.participants.forEach((otherPart: any) => {
            // type guard or safe access
            if (!otherPart || otherPart.playerId === player.id) return

            const current = matchups.get(otherPart.playerId) ?? {
                name: otherPart.player.name,
                games: 0,
                pointDiffSum: 0
            }

            current.games++
            // 自分 - 相手 のPt差
            current.pointDiffSum += (myPart.point - otherPart.point)

            matchups.set(otherPart.playerId, current)
        })
    })

    const matchupList = Array.from(matchups.values())
        .map((m: any) => ({
            name: m.name,
            games: m.games,
            averageDiff: m.games > 0 ? m.pointDiffSum / m.games : 0
        }))
        .sort((a: any, b: any) => b.games - a.games)

    return {
        player,
        stats: {
            totalGames,
            totalPoint,
            averagePoint,
            averagePlace,
            placeDistribution,
        },
        matchups: matchupList
    }
}
