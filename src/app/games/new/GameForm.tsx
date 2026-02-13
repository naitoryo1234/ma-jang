'use client'

import { createGame, GameState } from '@/app/actions/games'
import { Player } from '@prisma/client'
import { useFormStatus, useFormState } from 'react-dom'

type Props = {
    players: Player[]
}

const initialState: GameState = {
    message: '',
    errors: {}
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-cyan-600 text-white text-lg font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
        >
            {pending ? '保存中...' : '結果を保存'}
        </button>
    )
}

function PlayerRow({ index, players }: { index: number; players: Player[] }) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <span className="font-bold text-gray-400 w-6">{index + 1}</span>
                <select
                    name={`player_${index}`}
                    required
                    defaultValue=""
                    className="flex-1 h-12 text-lg bg-gray-50 border border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                    <option value="" disabled>プレイヤー選択</option>
                    {players.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">素点</label>
                    <input
                        type="number"
                        name={`score_${index}`}
                        inputMode="numeric"
                        placeholder="25000"
                        className="w-full h-12 text-lg border border-gray-300 rounded-lg px-3 text-right tabular-nums focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1 font-bold text-cyan-700">Pt (±)</label>
                    <input
                        type="number"
                        name={`point_${index}`}
                        step="0.1"
                        inputMode="decimal"
                        placeholder="0.0"
                        required
                        className="w-full h-12 text-lg font-bold text-gray-900 border border-gray-300 rounded-lg px-3 text-right tabular-nums focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-cyan-50"
                    />
                </div>
            </div>
        </div>
    )
}

export default function GameForm({ players }: Props) {
    const [state, formAction] = useFormState(createGame, initialState)

    return (
        <form action={formAction} className="space-y-6">
            {state.message && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold">
                    {state.message}
                </div>
            )}

            <div className="grid gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <PlayerRow key={i} index={i} players={players} />
                ))}
            </div>

            <div className="pt-4 pb-8">
                <SubmitButton />
            </div>
        </form>
    )
}
