import React from 'react'
import * as Toggle from '@radix-ui/react-toggle'
import { Pin, RotateCcw } from 'lucide-react'
import { useResultColor } from '@/contexts/result-color-context.tsx'
import { OklchComponent } from '@/types.ts'
import { COMPONENT_CONSTRAINTS, Transform, TRANSFORM_CONSTRAINTS } from '@/utils/resultColorUtils.ts'

export const ComponentInput = ({ component, suffix, steps = 0.1, defaultValue = 1 }: { component: OklchComponent, suffix?: string, steps?: number, defaultValue?: number }) => {
    const { setTransform, transforms, toggleComponent } = useResultColor()

    const transform = transforms[component]

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTransform(component, { ...transform, value: Number(e.target.value) })
    }

    const getInputConstraints = (transform: Transform, component: OklchComponent) => {
        if (transform.type === 'absolute') {
            return {
                min: COMPONENT_CONSTRAINTS[component].min,
                max: COMPONENT_CONSTRAINTS[component].max
            }
        }

        return {
            min: transform.type === 'add' ? -Infinity : 0,
            max: Infinity
        }
    }

    const showPrefix = transform.type !== 'absolute'

    return (
        <div className='relative w-full flex items-center gap-2'>
            <label htmlFor={component} className='w-12 text-center uppercase opacity-50'>{component}</label>
            <div className='relative w-full flex items-center gap-2'>
                {showPrefix && <span className='absolute left-3 top-1/2 -translate-y-1/2 opacity-50 uppercase' inert>{component} {transform.type === 'add' ? transform.value < 0 ? '-' : '+' : '×'}</span>}
                <input
                    type="number"
                    name={component}
                    id={component}
                    step={steps}
                    value={transform.value}
                    onChange={handleChange}
                    className={`w-full ${showPrefix ? 'pl-10' : 'pl-2'} py-1.5 align-middle flex items-center border border-black/10 rounded-lg shadow-sm shadow-black/5`}
                    style={{
                        textIndent: showPrefix && transform.value < 0 ? '-0.7ch' : '0'
                    }}
                    min={getInputConstraints(transform, component).min}
                    max={getInputConstraints(transform, component).max}
                />
                {suffix && <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-50' inert>{suffix}</span>}
            </div>

            <div className='flex items-center gap-0'>

                <button
                    className='size-7 rounded-lg shrink-0 text-black/50 hover:text-black hover:bg-black/10 transition-colors cursor-pointer'
                    onClick={() => setTransform(component, { type: TRANSFORM_CONSTRAINTS[component], value: defaultValue })}
                >
                    <RotateCcw className="size-3 mx-auto" strokeWidth={"2.5px"} />
                </button>
                <Toggle.Root
                    pressed={transforms[component].type === 'absolute'}
                    onPressedChange={() => toggleComponent(component)}
                    className='size-7 rounded-lg data-[state=on]:text-black data-[state=on]:bg-black/5 shrink-0 text-black/50 hover:text-black hover:bg-black/10 transition-colors cursor-pointer'
                >
                    <Pin className="size-3 mx-auto" strokeWidth={"2.5px"} />
                </Toggle.Root>


            </div>
        </div>
    )
}
