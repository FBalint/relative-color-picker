
import React, { useEffect } from "react"
import { useResultColor } from "@/contexts/result-color-context.tsx"
import { OKLCHBackground } from "./OKLCHBackground"
import { toRelative } from "@/utils/resultColorUtils.ts"
import { useRef, useState, useCallback } from "react"

interface ColorPickerProps {
    width?: number
    height?: number
    className?: string
}

export const ColorPicker = ({ width = 300, height = 300, className }: ColorPickerProps) => {
    const { resultColor, originColor, transforms, setTransform } = useResultColor()
    const containerRef = useRef<HTMLDivElement>(null)
    const handleRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const canvasWidth = width
    const canvasHeight = height
    const maxChroma = 0.4
    
    const xPosition = (resultColor.c / maxChroma) * canvasWidth
    const yPosition = (1 - resultColor.l) * canvasHeight
    
    const circleRadius = 12
    const left = xPosition - circleRadius
    const top = yPosition - circleRadius

    const updateColor = useCallback((newChroma: number, newLightness: number) => {
        const currentChromaTransform = transforms.c
        if (currentChromaTransform.type === 'absolute') {
            setTransform('c', { type: 'absolute', value: newChroma })
        } else {
            const newChromaTransform = toRelative('c', originColor.c, newChroma)
            setTransform('c', newChromaTransform)
        }

        const currentLightnessTransform = transforms.l
        if (currentLightnessTransform.type === 'absolute') {
            setTransform('l', { type: 'absolute', value: newLightness })
        } else {
            const newLightnessTransform = toRelative('l', originColor.l, newLightness)
            setTransform('l', newLightnessTransform)
        }
    }, [transforms, originColor, setTransform])

    const updateColorFromPosition = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top

        const clampedX = Math.max(0, Math.min(canvasWidth, x))
        const clampedY = Math.max(0, Math.min(canvasHeight, y))

        const newChroma = (clampedX / canvasWidth) * maxChroma
        const newLightness = 1 - (clampedY / canvasHeight)

        updateColor(newChroma, newLightness)
    }, [updateColor, canvasWidth, canvasHeight, maxChroma])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const step = e.shiftKey ? 0.1 : 0.02
        
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault()
                updateColor(Math.max(0, Math.min(maxChroma, resultColor.c + step * maxChroma)), resultColor.l)
                break
            case 'ArrowLeft':
                e.preventDefault()
                updateColor(Math.max(0, Math.min(maxChroma, resultColor.c - step * maxChroma)), resultColor.l)
                break
            case 'ArrowUp':
                e.preventDefault()
                updateColor(resultColor.c, Math.max(0, Math.min(1, resultColor.l + step)))
                break
            case 'ArrowDown':
                e.preventDefault()
                updateColor(resultColor.c, Math.max(0, Math.min(1, resultColor.l - step)))
                break
            case 'Home':
                e.preventDefault()
                updateColor(0, resultColor.l)
                break
            case 'End':
                e.preventDefault()
                updateColor(maxChroma, resultColor.l)
                break
            case 'PageUp':
                e.preventDefault()
                updateColor(resultColor.c, Math.max(0, Math.min(1, resultColor.l + 0.2)))
                break
            case 'PageDown':
                e.preventDefault()
                updateColor(resultColor.c, Math.max(0, Math.min(1, resultColor.l - 0.2)))
                break
        }
    }, [updateColor, resultColor, maxChroma])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        updateColorFromPosition(e.clientX, e.clientY)
    }, [updateColorFromPosition])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return
        e.preventDefault()
        updateColorFromPosition(e.clientX, e.clientY)
    }, [isDragging, updateColorFromPosition])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleHandleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        handleMouseDown(e)
        if (handleRef.current) {
            handleRef.current.focus()
        }
    }, [handleMouseDown])

    
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    const chromaPercent = Math.round((resultColor.c / maxChroma) * 100)
    const lightnessPercent = Math.round(resultColor.l * 100)

    return (
        <div 
            ref={containerRef}
            className={`relative cursor-pointer`}
            onMouseDown={handleMouseDown}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                overflow: 'visible'
            }}
            role="img"
            aria-label="Color picker canvas"
        >
            <div 
                ref={handleRef}
                className={`size-6 rounded-full border-[5px] border-white absolute shadow-md cursor-grab z-10 ${
                    isFocused && 'outline-2 outline-blue-500'
                }`}
                style={{
                    backgroundColor: `oklch(${resultColor.l} ${resultColor.c} ${resultColor.h})`,
                    left: `${left}px`,
                    top: `${top}px`
                }}
                tabIndex={0}
                role="slider"
                aria-label={`Color picker handle. Chroma: ${chromaPercent}%, Lightness: ${lightnessPercent}%. Use arrow keys to adjust.`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={chromaPercent}
                aria-orientation="horizontal"
                onMouseDown={handleHandleMouseDown}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            <OKLCHBackground width={width} height={height} hue={resultColor.h} className={className} />
        </div>
    )

}
