'use client'

import { createGame } from '@/app/actions/games'
import { useState, useMemo } from 'react'
import { useFormStatus } from 'react-dom'

// Initial types based on server data
type SheetData = {
    id: string
    players: { id: string, name: string }[]
    games: any[] // Complex nested type, treating as any for MVP speed
    [key: string]: any // Allow extra serialized props
}


export default function ClientSheetDetail({ sheet }: { sheet: SheetData }) {
    // Helper to init input map
    const [inputs, setInputs] = useState<Record<string, string>>({})
    const [signs, setSigns] = useState<Record<string, boolean>>({}) // true = negative
    const [topPlayerId, setTopPlayerId] = useState<string | null>(null)
    const [error, setError] = useState('')

    // Calculate totals
    const totals = useMemo(() => {
        const map: Record<string, { pt: number, chip: number, total: number }> = {}
        sheet.players.forEach(p => map[p.id] = { pt: 0, chip: 0, total: 0 })

        sheet.games.forEach(g => {
            g.participants.forEach((p: any) => {
                if (map[p.playerId]) {
                    map[p.playerId].pt += p.point
                    map[p.playerId].chip += (p.chip || 0)
                    map[p.playerId].total += p.point + (p.chip || 0)
                }
            })
        })
        return map
    }, [sheet.games, sheet.players])

    // Handle Input Change
    const handleInputChange = (pid: string, val: string) => {
        // Strip any - chars just in case to keep it absolute
        const cleanVal = val.replace(/-/g, '')
        const newInputs = { ...inputs, [pid]: cleanVal }
        setInputs(newInputs)
        setError('')
    }

    // Toggle Sign Helper
    const toggleSign = (pid: string) => {
        const newSigns = { ...signs, [pid]: !signs[pid] }
        setSigns(newSigns)
    }

    // Auto-Calc Logic
    // Using useMemo to calculate the 'display' value for the Top player dynamically
    // or effect to update state. Let's use derived state for display.
    // BUT the form submission needs the value.
    // Let's modify: `inputs` contains manual entries. 
    // We calculate the Top's value on the fly for display and submission.

    const calculatedTopScore = useMemo(() => {
        if (!topPlayerId) return null

        // Sum other inputs
        let sum = 0
        let count = 0
        sheet.players.forEach(p => {
            if (p.id === topPlayerId) return
            const val = inputs[p.id]
            if (val && val !== '') {
                const raw = parseFloat(val)
                if (!isNaN(raw)) {
                    sum += signs[p.id] ? -raw : raw
                    count++
                }
            }
        })

        // If we have inputs for others, calculate remainder
        if (count > 0) {
            // Round to 1 decimal to avoid float errors
            return Math.round((-sum) * 10) / 10
        }
        return 0
    }, [inputs, signs, topPlayerId, sheet.players])

    async function clientAction(formData: FormData) {
        setError('')
        formData.append('sheetId', sheet.id)

        // Construct participant data
        // We need exactly 4 players.
        // Logic: 
        // - Check manual inputs (non-empty)
        // - If topPlayerId is selected, add it as one player using calculatedTopScore

        const activeMembers: { id: string, point: string }[] = []

        sheet.players.forEach(p => {
            if (p.id === topPlayerId) {
                // Top Player
                activeMembers.push({ id: p.id, point: calculatedTopScore?.toString() ?? '0' })
            } else {
                // Manual Player
                // If it has input, compute the signed value
                const rawVal = inputs[p.id]
                if (rawVal && rawVal !== '') {
                    const signedVal = signs[p.id] ? -parseFloat(rawVal) : parseFloat(rawVal)
                    activeMembers.push({ id: p.id, point: signedVal.toString() })
                }
            }
        })

        if (activeMembers.length !== 4) {
            setError(`4人の点数を入力してください (現在: ${activeMembers.length}人)`)
            return
        }

        // Prepare FormData for server
        activeMembers.forEach((m, idx) => {
            formData.append(`player_${idx}`, m.id)
            formData.append(`point_${idx}`, m.point)
            // Fake score
            const ptNum = parseFloat(m.point)
            const estimatedScore = (ptNum * 1000) + 30000 // default 30000
            formData.append(`score_${idx}`, estimatedScore.toString())

            // Get Chip input
            const chipInput = (document.getElementById(`input_chip_${m.id}`) as HTMLInputElement)?.value
            const chipVal = chipInput ? chipInput : '0'
            formData.append(`chip_${idx}`, chipVal)
        })

        const res = await createGame(null, formData)
        if (res.message && !res.errors) {
            // Reset
            setInputs({})
            setSigns({}) // Reset signs
            setTopPlayerId(null) // Reset top selection too? Maybe keep it? Let's reset for safety.
            // Actually user might be top again. Let's keep it? 
            // Start fresh is safer to avoid accidental inputs.
            setTopPlayerId(null)
            setError('')
        } else {
            setError(res.message || 'エラー')
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Sticky Header: Totals */}
            <div className="shrink-0 bg-slate-900 text-white z-10 shadow-md">
                <div className="flex border-b border-slate-700">
                    <div className="w-10 shrink-0 flex flex-col items-center justify-center text-[10px] text-slate-400 border-r border-slate-700 bg-slate-800">
                        <span>Total</span>
                    </div>
                    {sheet.players.map(p => {
                        const data = totals[p.id] || { pt: 0, chip: 0, total: 0 }
                        return (
                            <div key={p.id} className="flex-1 min-w-0 p-1 text-center border-r border-slate-700 last:border-none">
                                <div className="text-[10px] truncate font-bold text-slate-400 mb-0.5">{p.name.slice(0, 2)}</div>

                                {/* Main Total */}
                                <div className={`text-base font-bold leading-tight ${data.total >= 0 ? 'text-cyan-400' : 'text-pink-500'}`}>
                                    {data.total > 0 ? '+' : ''}{data.total.toFixed(1)}
                                </div>

                                {/* Sub Info (Pt / Chip) */}
                                <div className="flex justify-center gap-1 text-[9px] opacity-70">
                                    <span className={data.pt >= 0 ? 'text-blue-300' : 'text-red-300'}>
                                        {data.pt > 0 ? '+' : ''}{Math.round(data.pt)}
                                    </span>
                                    <span className="text-slate-500">|</span>
                                    <span className={data.chip >= 0 ? 'text-yellow-300' : 'text-orange-400'}>
                                        {data.chip > 0 ? '+' : ''}{data.chip}φ
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Scrollable History */}
            <div className="flex-1 overflow-y-auto bg-slate-800">
                {sheet.games.map((g, gameIdx) => (
                    <div key={g.id} className="flex border-b border-slate-700 h-10 items-center text-white">
                        <div className="w-8 shrink-0 text-center text-xs text-slate-500 border-r border-slate-700">{gameIdx + 1}</div>
                        {sheet.players.map(p => {
                            const part = g.participants.find((part: any) => part.playerId === p.id)
                            return (
                                <div key={p.id} className="flex-1 min-w-0 text-center border-r border-slate-700 last:border-none relative h-full flex items-center justify-center">
                                    {part ? (
                                        <span className={`font-medium ${part.point >= 0 ? 'text-blue-300' : 'text-red-300'}`}>
                                            {part.point > 0 ? '+' : ''}{part.point.toFixed(1)}
                                        </span>
                                    ) : (
                                        <div className="w-full h-full bg-slate-900/50 flex items-center justify-center">
                                            <div className="w-full h-[1px] bg-slate-700 rotate-[-12deg]"></div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}
                {/* Clickable filler to dismiss keyboard on mobile? */}
                <div className="h-40"></div>
            </div>

            {/* Fixed Bottom Input Area */}
            <div className="shrink-0 bg-slate-900 border-t-2 border-cyan-800 p-2 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
                {error && <p className="text-red-400 text-xs font-bold mb-2 text-center">{error}</p>}

                <form action={clientAction}>
                    {/* Top Selection Row (Name Header & Auto-Calc Trigger) */}
                    <div className="flex mb-1">
                        <div className="w-8 shrink-0 flex items-center justify-center text-[10px] text-cyan-500 font-bold border-r border-slate-700">
                            TOP
                        </div>
                        {sheet.players.map(p => (
                            <div key={p.id} className="flex-1 min-w-0 flex justify-center border-r border-slate-700 last:border-none bg-slate-800/50">
                                <label className="cursor-pointer w-full flex flex-col items-center justify-center py-1 hover:bg-slate-700/50 transition-colors">
                                    <span className={`text-[10px] font-bold mb-0.5 truncate max-w-full px-0.5 ${topPlayerId === p.id ? 'text-cyan-400' : 'text-slate-400'}`}>
                                        {p.name.slice(0, 4)}
                                    </span>
                                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${topPlayerId === p.id ? 'border-cyan-500 bg-cyan-900' : 'border-slate-500 bg-slate-800'
                                        }`}>
                                        {topPlayerId === p.id && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="top_player"
                                        checked={topPlayerId === p.id}
                                        onChange={() => setTopPlayerId(p.id)}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* Input Row: Pt */}
                    <div className="flex mb-1">
                        <div className="w-8 shrink-0 flex flex-col items-center justify-center text-xs text-slate-400 font-bold border-r border-slate-700 bg-slate-900">
                            <div>Pt</div>
                        </div>
                        {sheet.players.map(p => {
                            const isTop = topPlayerId === p.id
                            // For Display:
                            // If Top, show calculated score (with its own sign)
                            // If Manual, show absolute value from inputs[p.id]

                            let displayValue = ''
                            let isNegative = false

                            if (isTop) {
                                if (calculatedTopScore !== null) {
                                    isNegative = calculatedTopScore < 0
                                    displayValue = Math.abs(calculatedTopScore).toString()
                                }
                            } else {
                                displayValue = inputs[p.id] || ''
                                isNegative = !!signs[p.id]
                            }

                            return (
                                <div key={p.id} className="flex-1 min-w-0 p-0.5 border-r border-slate-700 last:border-none bg-slate-900 relative group">
                                    <div className="relative w-full h-full">
                                        {/* Visual Minus Sign */}
                                        {isNegative && (
                                            <div className="absolute left-1 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-red-400 font-bold text-lg">-</span>
                                            </div>
                                        )}

                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={displayValue}
                                            onChange={(e) => !isTop && handleInputChange(p.id, e.target.value)}
                                            readOnly={isTop}
                                            className={`w-full text-center font-bold h-10 rounded text-lg focus:ring-2 focus:outline-none placeholder-slate-700 transition-colors pl-2
                                                ${isTop
                                                    ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-800/50 focus:ring-0'
                                                    : 'bg-slate-800 text-white focus:ring-cyan-500 focus:bg-slate-700'
                                                }
                                                ${isNegative ? 'text-red-300' : ''}
                                            `}
                                            placeholder={isNegative ? "" : "-"}
                                        />

                                        {/* Sign Toggle Button (Only for non-Top) */}
                                        {!isTop && (
                                            <button
                                                type="button"
                                                onClick={() => toggleSign(p.id)}
                                                className={`absolute top-0 right-0 h-5 w-6 text-[10px] rounded-bl flex items-center justify-center border-l border-b border-slate-600 shadow-sm transition-colors
                                                    ${isNegative
                                                        ? 'bg-red-900/80 text-red-200 hover:bg-red-800'
                                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                    }
                                                `}
                                                tabIndex={-1} // Skip tab index
                                            >
                                                +/-
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Input Row: Chip */}
                    <div className="flex">
                        <div className="w-8 shrink-0 flex items-center justify-center text-[10px] text-yellow-400 font-bold border-r border-slate-700 bg-slate-900">
                            Chip
                        </div>
                        {sheet.players.map(p => {
                            return (
                                <div key={p.id} className="flex-1 min-w-0 p-0.5 border-r border-slate-700 last:border-none bg-slate-900">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        id={`input_chip_${p.id}`}
                                        className={`w-full text-center font-bold h-7 rounded text-sm focus:ring-1 focus:outline-none placeholder-slate-800 transition-colors bg-slate-800 text-yellow-400 focus:bg-slate-700 focus:ring-yellow-500`}
                                        placeholder="0"
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <button type="submit" className="w-full mt-3 bg-cyan-600 h-10 rounded font-bold text-white hover:bg-cyan-500">
                        保存 (Save)
                    </button>
                </form>
            </div>
        </div>
    )
}
