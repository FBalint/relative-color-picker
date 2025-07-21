import * as Slider from '@radix-ui/react-slider'
import { useResultColor } from '@/contexts/result-color-context.tsx'
import { toRelative } from '@/utils/resultColorUtils.ts'
import { useRef } from 'react'

const EDGE_HEIGHT = 24 
const CENTER_HEIGHT = 30
const EDGE_ZONE_RATIO = 0.03 // 3% of slider width on each end
const HUE_GRADIENT_CHROMA = 0.25

export const HueSlider = () => {
    const { resultColor, originColor, transforms, setTransform } = useResultColor()
    const sliderRef = useRef<HTMLDivElement>(null)

    const currentHue = resultColor.h

    const handleValueChange = (values: number[]) => {
        const newHueDegrees = values[0]
        const currentTransform = transforms.h

        if (currentTransform.type === 'absolute') {
            setTransform('h', { type: 'absolute', value: newHueDegrees })
        } else {
            const newTransform = toRelative('h', originColor.h, newHueDegrees)
            setTransform('h', newTransform)
        }
    }

    const getThumbHeight = (position: number) => {
        if (position <= EDGE_ZONE_RATIO) {
            const progressInZone = position / EDGE_ZONE_RATIO
            return EDGE_HEIGHT + (CENTER_HEIGHT - EDGE_HEIGHT) * progressInZone
        }
        
        if (position >= 1 - EDGE_ZONE_RATIO) {
            const progressInZone = (1 - position) / EDGE_ZONE_RATIO
            return EDGE_HEIGHT + (CENTER_HEIGHT - EDGE_HEIGHT) * progressInZone
        }
        
        return CENTER_HEIGHT
    }

    const thumbHeight = getThumbHeight(currentHue / 360)

    return (
        <Slider.Root
            ref={sliderRef}
            className="border border-black/10 rounded-xl relative h-9 cursor-pointer flex items-center"
            style={{
                backgroundImage: `linear-gradient(to right, oklch(${resultColor.l} ${HUE_GRADIENT_CHROMA} 0deg), oklch(${resultColor.l} ${HUE_GRADIENT_CHROMA} 60deg), oklch(${resultColor.l} ${HUE_GRADIENT_CHROMA} 120deg), oklch(${resultColor.l} ${HUE_GRADIENT_CHROMA} 180deg), oklch(${resultColor.l} ${HUE_GRADIENT_CHROMA} 240deg), oklch(${resultColor.l} ${HUE_GRADIENT_CHROMA} 300deg), oklch(${resultColor.l} ${HUE_GRADIENT_CHROMA} 360deg))`,
                backgroundClip: 'padding-box'
            }}
            value={[currentHue]}
            onValueChange={handleValueChange}
            max={360}
            min={0}
            step={1}
        >
            <Slider.Track className="bg-transparent relative flex-1 h-full rounded-full">
                <Slider.Range className="absolute bg-transparent h-full rounded-full" />
            </Slider.Track>
            <Slider.Thumb
                className="block w-2 bg-white shadow-md rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                style={{
                    height: `${thumbHeight}px`
                }}
                aria-label="Hue value"
            />
        </Slider.Root>
    )

}