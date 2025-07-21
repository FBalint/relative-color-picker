import { Copy } from 'lucide-react'
import { AlphaSlider } from './AlphaSlider.tsx'
import { ColorPicker } from './ColorPicker.tsx'
import { ColorSwatch } from './ColorSwatch.tsx'
import { ComponentInput } from './ComponentInput.tsx'
import { HueSlider } from './HueSlider.tsx'
import { OriginColorSelect } from './OriginColorSelect.tsx'
import { useResultColor } from '@/contexts/result-color-context.tsx'
import { getColorString } from '@/utils/resultColorUtils.ts'

export const RelativeColorPicker = () => {
  const { resultColor } = useResultColor()


  const copyResultColor = () => {
    navigator.clipboard.writeText(getColorString(resultColor))
  }

  return (
    <div className="bg-neutral-50 rounded-2xl p-5 shadow-lg flex gap-6">
      <div className="flex flex-col gap-2">
        <ColorPicker className='border border-black/10 rounded-xl relative' width={280} height={280} />
        <HueSlider />
        <AlphaSlider />
      </div>

      <div className="flex flex-col gap-3">
        <OriginColorSelect />

        <div className="border w-full border-black/10 rounded-xl flex flex-col gap-3 p-2 h-full justify-between">
          <ComponentInput component="l" />
          <ComponentInput component="c" />
          <ComponentInput component="h" suffix="deg" steps={1} defaultValue={0} />
          <ComponentInput component="a" />
        </div>

        <div className="relative rounded-xl overflow-hidden h-fit shrink-0 border border-black/10 hover:bg-black/5 transition-colors cursor-pointer" onClick={() => copyResultColor()}>
          <ColorSwatch color={{ l: resultColor.l, c: resultColor.c, h: resultColor.h, a: resultColor.a }} label="Result color" />
          <div className='absolute top-1/2 -translate-y-1/2 right-4 text-black/50' inert>
            <Copy className='size-4 '/>
          </div>
        </div>
      </div>
    </div>
  )
} 