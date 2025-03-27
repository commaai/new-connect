import { VoidComponent, createEffect } from 'solid-js'
import { getUploadQueue } from '~/api/athena'
import { createQuery } from '~/utils/createQuery'
import StatisticBar from './StatisticBar'

const UploadQueue: VoidComponent<{ dongleId: string }> = (props) => {
  const [queue] = createQuery({
    source: () => props.dongleId,
    fetcher: getUploadQueue,
    refetchInterval: 2000,
  })
  createEffect(() => {
    console.log(queue()?.result)
  })
  return (
    <div class="flex flex-col border-2 border-t-0 border-surface-container-high bg-surface-container-lowest">
      <div class="flex-auto p-4">
        <StatisticBar statistics={[{ label: 'Total', value: () => queue()?.result?.length }]} />
      </div>
      <div class="rounded-md border-2 border-surface-container-high mx-4 mb-4 p-4"></div>
    </div>
  )
}

export default UploadQueue
