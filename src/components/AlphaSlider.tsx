import * as Slider from '@radix-ui/react-slider'
import { useResultColor } from '@/contexts/result-color-context.tsx'
import { toRelative } from '@/utils/resultColorUtils.ts'
import { useRef } from 'react'

const EDGE_HEIGHT = 24 
const CENTER_HEIGHT = 30
const EDGE_ZONE_RATIO = 0.03 // 3% of slider width on each end

export const AlphaSlider = () => {
  const { resultColor, originColor, transforms, setTransform } = useResultColor()
  const sliderRef = useRef<HTMLDivElement>(null)
  
  const currentAlpha = resultColor.a

  
  const handleValueChange = (values: number[]) => {
    const newAlpha = values[0]
    const currentTransform = transforms.a
    
    if (currentTransform.type === 'absolute') {
      setTransform('a', { type: 'absolute', value: newAlpha })
    } else {
      const newTransform = toRelative('a', originColor.a, newAlpha)
      setTransform('a', newTransform)
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

  const thumbHeight = getThumbHeight(currentAlpha)

  return (
    <Slider.Root
      ref={sliderRef}
      className="border border-black/10 rounded-xl relative h-9 cursor-pointer flex items-center"
      style={{
        backgroundImage: `
          linear-gradient(to right, 
            oklch(${resultColor.l} ${resultColor.c} ${resultColor.h} / 0), 
            oklch(${resultColor.l} ${resultColor.c} ${resultColor.h} / 1)
          ),
          repeating-conic-gradient(#e5e5e5 0deg 90deg, transparent 90deg 180deg)
        `,
        backgroundSize: 'auto, 8px 8px',
        backgroundPosition: '0% 0%, 0% 0%',
        backgroundClip: 'padding-box'
      }}
      value={[currentAlpha]}
      onValueChange={handleValueChange}
      max={1}
      min={0}
      step={0.01}
    >
      <Slider.Track className="bg-transparent relative flex-1 h-full rounded-full">
        <Slider.Range className="absolute bg-transparent h-full rounded-full" />
      </Slider.Track>
      <Slider.Thumb 
        className="block w-2 bg-white shadow-md rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        style={{
          height: `${thumbHeight}px`
        }}
        aria-label="Alpha value"
      />
    </Slider.Root>
  )

}
