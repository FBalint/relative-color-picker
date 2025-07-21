import { ResultColorProvider } from './contexts/result-color-context.tsx'
import { RelativeColorPicker } from './components/RelativeColorPicker.tsx'
import { CSSOutput } from './components/CSSOutput.tsx'

const App = () => {
  return (
    <ResultColorProvider>
      <main className='flex justify-center flex-col items-center h-screen gap-12'>
        <RelativeColorPicker />
        <CSSOutput />
      </main>
    </ResultColorProvider>
  )
}

export default App