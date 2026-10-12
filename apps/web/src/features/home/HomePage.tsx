import { HistoryFeed } from './HistoryFeed'
import { OpenBagsStrip } from './OpenBagsStrip'

export function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <OpenBagsStrip />
      <HistoryFeed />
    </div>
  )
}
