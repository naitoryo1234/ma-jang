'use client'

import { createPlayer, PlayerState } from '@/app/actions/players'
import { useFormStatus, useFormState } from 'react-dom'

const initialState: PlayerState = {
    message: '',
    errors: {}
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold disabled:opacity-50 w-full"
        >
            {pending ? '追加中...' : '追加する'}
        </button>
    )
}

export default function AddPlayerForm() {
    const [state, formAction] = useFormState(createPlayer, initialState)

    return (
        <form action={formAction} className="bg-white p-4 rounded-lg shadow space-y-4 mb-6">
            <h2 className="font-bold text-lg text-gray-800">新規プレイヤー追加</h2>
            {state.message && <p className="text-sm text-red-500">{state.message}</p>}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    名前
                </label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    placeholder="例: 佐藤"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {state.errors?.name && (
                    <p className="text-sm text-red-500 mt-1">{state.errors.name.join(',')}</p>
                )}
            </div>
            <SubmitButton />
        </form>
    )
}
