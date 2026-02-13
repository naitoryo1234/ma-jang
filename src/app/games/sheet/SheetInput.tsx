'use client'

import { createGame } from '@/app/actions/games'
import { Player } from '@prisma/client'
import { useState } from 'react'
import { useFormStatus } from 'react-dom'

type Props = {
    players: Player[]
}

export default function SheetInput({ players }: Props) {
    // Phase 1: Select Active Members for the Sheet
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set())
    const [isSheetReady, setIsSheetReady] = useState(false)
    const [message, setMessage] = useState('')

    const togglePlayer = (id: string) => {
        const next = new Set(selectedPlayerIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedPlayerIds(next)
    }

    const startSheet = () => {
        if (selectedPlayerIds.size < 4) {
            setMessage('最低4人のプレイヤーを選択してください')
            return
        }
        setIsSheetReady(true)
        setMessage('')
    }

    if (!isSheetReady) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4">シート作成：メンバー選択</h2>
                {message && <p className="text-red-500 text-sm mb-4 font-bold">{message}</p>}
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
                    onClick={startSheet}
                    className="w-full bg-cyan-600 text-white font-bold py-3 rounded-lg hover:bg-cyan-700 transition"
                >
                    入力シートを作成
                </button>
            </div>
        )
    }

    // Phase 2: Input Grid
    // Sort players by ID or selection order to keep consistent usage
    const sheetPlayers = players.filter(p => selectedPlayerIds.has(p.id))

    return <GridForm sheetPlayers={sheetPlayers} onBack={() => setIsSheetReady(false)} />
}

function GridForm({ sheetPlayers, onBack }: { sheetPlayers: Player[], onBack: () => void }) {
    // Client-side validation logic handled inside default form action or simple validation
    const [error, setError] = useState('')

    async function clientAction(formData: FormData) {
        setError('')
        // Extract non-empty values
        const inputs: { playerId: string, point: number }[] = []

        sheetPlayers.forEach(p => {
            const val = formData.get(`point_${p.id}`)
            if (val && val.toString() !== '') {
                inputs.push({ playerId: p.id, point: Number(val) })
            }
        })

        // Validation
        if (inputs.length !== 4) {
            setError(`入力された人数が${inputs.length}人です。ちょうど4人の点数を入力してください。`)
            return
        }

        const total = inputs.reduce((sum, cur) => sum + cur.point, 0)
        // 浮動小数点の誤差を考慮して少し緩くするか、厳密にするか。今回は厳密な0は求めず、注意だけ出すか、Serverで処理するか。
        // Server Action `createGame` expects `player_0`, `score_0`, `point_0`.
        // We need to adhere to that format or create a new server action. 
        // For MVP, we can adapt the FormData here to match what `createGame` expects.

        const adaptedData = new FormData()
        inputs.forEach((input, index) => {
            adaptedData.append(`player_${index}`, input.playerId)
            adaptedData.append(`point_${index}`, input.point.toString())
            // Score (素点) is optional in our requested UI (only Pt shown in image), but required by DB?
            // schema says `score Int`, `point Float`.
            // If the UI only takes Point, we might need to fake Score or calculate it if 30000 base.
            // Let's assume Score = Point * 1000 + 30000 for rough estimation or just put 0.
            const estimatedScore = (input.point * 1000) + 25000 // 仮: 25000持ち
            adaptedData.append(`score_${index}`, estimatedScore.toString())
        })

        const res = await createGame(null, adaptedData)
        if (res.message && !res.errors) {
            // Success: Clear inputs? Or Keep them? usually start fresh.
            // Reset form manually
            const form = document.querySelector('form') as HTMLFormElement
            form.reset()
            setError('')
            // Ideally show a toast
            alert(res.message)
        } else {
            setError(res.message || 'エラーが発生しました')
        }
    }

    return (
        <div className="bg-slate-900 text-white p-2 rounded-xl shadow-lg overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-2 py-2">
                <h2 className="font-bold">スコア入力シート</h2>
                <button onClick={onBack} className="text-xs text-slate-400 hover:text-white">メンバー再選択</button>
            </div>

            {error && (
                <div className="bg-red-500/20 text-red-200 border border-red-500/50 p-3 rounded mb-4 text-sm font-bold animate-pulse">
                    {error}
                </div>
            )}

            <form action={clientAction} className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr>
                            {sheetPlayers.map(p => (
                                <th key={p.id} className="p-2 border border-slate-700 min-w-[80px] text-sm font-bold text-slate-300">
                                    {p.name}
                                </th>
                            ))}
                            <th className="p-2 border border-slate-700 w-16 text-xs text-slate-500">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Input Row */}
                        <tr className="bg-slate-800/50">
                            {sheetPlayers.map(p => (
                                <td key={p.id} className="p-1 border border-slate-700">
                                    <input
                                        type="number"
                                        step="0.1"
                                        name={`point_${p.id}`}
                                        className="w-full bg-slate-800 text-white text-center font-bold h-10 rounded focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-600"
                                        placeholder="-"
                                    />
                                </td>
                            ))}
                            <td className="p-1 border border-slate-700">
                                <SubmitButton />
                            </td>
                        </tr>
                        {/* History Placeholders could go here */}
                    </tbody>
                </table>
            </form>
            <div className="mt-4 text-xs text-slate-500 text-center">
                4人の欄に数値を入力して「保存」を押してください
            </div>
        </div>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full h-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded flex items-center justify-center disabled:opacity-50"
        >
            {pending ? '...' : '保存'}
        </button>
    )
}
