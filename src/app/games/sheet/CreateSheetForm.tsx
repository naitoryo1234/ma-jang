'use client'

import { createSheet } from '@/app/actions/sheets'
import { Player } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
    players: Player[]
}

export default function CreateSheetForm({ players }: Props) {
    const router = useRouter()
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set())
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const togglePlayer = (id: string) => {
        const next = new Set(selectedPlayerIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedPlayerIds(next)
    }

    const handleSubmit = async () => {
        if (selectedPlayerIds.size < 4) {
            setError('最低4人のプレイヤーを選択してください')
            return
        }

        setIsSubmitting(true)
        setError('')

        const formData = new FormData()
        selectedPlayerIds.forEach(id => formData.append('playerIds', id))

        const res = await createSheet({}, formData)

        if (res.sheetId) {
            router.push(`/games/sheet/${res.sheetId}`)
        } else {
            setError(res.message || 'エラーが発生しました')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4">新しいシートを作成</h2>
            <p className="text-sm text-gray-500 mb-4">本日の対局に参加するメンバーを選択してください（後で変更・追加はできません）。</p>

            {error && <p className="text-red-500 text-sm mb-4 font-bold">{error}</p>}

            <div className="grid grid-cols-2 gap-3 mb-6">
                {players.map(p => (
                    <label key={p.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedPlayerIds.has(p.id)
                            ? 'bg-cyan-50 border-cyan-500 text-cyan-900'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}>
                        <input
                            type="checkbox"
                            className="mr-3 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                            checked={selectedPlayerIds.has(p.id)}
                            onChange={() => togglePlayer(p.id)}
                        />
                        <span className="font-bold">{p.name}</span>
                    </label>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-cyan-600 text-white font-bold py-3 rounded-lg hover:bg-cyan-700 transition disabled:opacity-50"
            >
                {isSubmitting ? '作成中...' : 'シートを作成して開始'}
            </button>
        </div>
    )
}
