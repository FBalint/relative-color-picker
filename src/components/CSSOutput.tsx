import { useResultColor } from "@/contexts/result-color-context.tsx"

export const CSSOutput = () => {

    const { toCss } = useResultColor()

    return (
        <div className="bg-neutral-900 rounded-xl p-5 hover:bg-neutral-800 transition-colors cursor-pointer" role="button" onClick={() => navigator.clipboard.writeText(toCss())}>
            <p className="text-white font-mono">
                {toCss()}
            </p>
        </div>
    )
}