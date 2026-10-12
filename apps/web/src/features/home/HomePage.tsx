import { OpenBagsStrip } from './OpenBagsStrip'

// The history feed below the strip arrives with #8.
export function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <OpenBagsStrip />
    </div>
  )
}
