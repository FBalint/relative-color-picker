import * as Select from '@radix-ui/react-select'
import { ChevronDown } from 'lucide-react'
import { useResultColor } from '@/contexts/result-color-context.tsx'
import { OklchColor } from '@/types.ts'
import { ColorSwatch } from './ColorSwatch.tsx'

const sourceColors: { label: string; color: OklchColor }[] = [
  { label: "Vibrant Purple", color: { l: 0.6179, c: 0.2114, h: 280.67, a: 1 } },
  { label: "Ocean Blue", color: { l: 0.5, c: 0.15, h: 220, a: 1 } },
  { label: "Forest Green", color: { l: 0.6, c: 0.18, h: 142, a: 1 } }
];

export const OriginColorSelect = () => {
  const { originColor, setOriginColor } = useResultColor();
  
  const currentColorIndex = sourceColors.findIndex(
    sc => sc.color.l === originColor.l && sc.color.c === originColor.c && sc.color.h === originColor.h && sc.color.a === originColor.a
  );
  
  const currentValue = currentColorIndex !== -1 ? currentColorIndex.toString() : "custom";
  
  return (
    <Select.Root value={currentValue} onValueChange={(value) => {
      if (value !== "custom") {
        const selectedColor = sourceColors[parseInt(value)];
        setOriginColor(selectedColor.color);
      }
    }}>
      <Select.Trigger className="border border-black/10 rounded-xl w-full flex justify-between items-center relative overflow-hidden shrink-0 h-fit hover:bg-black/5 transition-colors cursor-pointer">
        <ColorSwatch 
          color={originColor} 
          label={currentColorIndex !== -1 ? sourceColors[currentColorIndex].label : "Custom color"} 
        />
        <Select.Icon className='absolute right-3 top-1/2 -translate-y-1/2'>
          <ChevronDown className="size-4 text-black/50" />
        </Select.Icon>
      </Select.Trigger>
      
      <Select.Portal>
        <Select.Content 
          className="bg-white rounded-xl border border-black/10 shadow-lg p-1 z-50" 
          position="popper"
          sideOffset={8}
          style={{ width: 'var(--radix-select-trigger-width)' }}
        >
          <Select.Viewport>
            {sourceColors.map((sourceColor, index) => (
              <Select.Item
                key={index}
                value={index.toString()}
                className="cursor-pointer hover:bg-black/5 transition-colors rounded-lg outline-none data-[highlighted]:bg-black/5"
              >
                <Select.ItemText>
                  <ColorSwatch color={sourceColor.color} label={sourceColor.label} />
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}; 