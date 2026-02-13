'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type SheetState = {
    errors?: {
        players?: string[]
    }
    message?: string
    sheetId?: string
}

// シート作成 (6人までのプレイヤーを受け取る)
export async function createSheet(prevState: SheetState, formData: FormData): Promise<SheetState> {
    const playerIds = formData.getAll('playerIds') as string[]

    if (playerIds.length < 4) {
        return {
            message: '最低4人のプレイヤーを選択してください',
        }
    }

    try {
        const sheet = await prisma.sheet.create({
            data: {
                title: `${new Date().toLocaleDateString()} セット`,
                players: {
                    connect: playerIds.map(id => ({ id }))
                }
            }
        })

        return {
            message: 'シートを作成しました',
            sheetId: sheet.id
        }
    } catch (e) {
        console.error(e)
        return { message: 'シート作成に失敗しました' }
    }
}

export async function getSheet(sheetId: string) {
    return await prisma.sheet.findUnique({
        where: { id: sheetId },
        include: {
            players: true,
            games: {
                include: {
                    participants: {
                        include: { player: true }
                    }
                },
                orderBy: { playedAt: 'asc' }
            }
        }
    })
}
