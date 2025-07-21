import { OklchColor } from "@/types.ts"

export const ColorSwatch = ({ color, label }: { color: OklchColor, label: string }) => {
    const colorString = `oklch(${color.l} ${color.c} ${color.h} / ${color.a})`
    
    return (
        <div className="flex gap-3 p-2 items-center w-full h-fit">
            <div 
                className="size-10 rounded-lg border border-black/5" 
                style={{ backgroundColor: colorString }}
                aria-hidden="true" 
            />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-xs text-black/50 font-medium text-left truncate">
                    {label}
                </span>
                <code className="font-mono text-sm font-medium text-black truncate text-left">
                    {colorString}
                </code>
            </div>
        </div>
    )
}