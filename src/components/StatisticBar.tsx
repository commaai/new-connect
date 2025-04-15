import { For, Suspense, VoidComponent } from 'solid-js'
import { cn } from '~/utils/style'

const StatisticBar: VoidComponent<{ class?: string; statistics: { label: string; value: () => unknown }[] }> = (props) => {
  return (
    <div class="flex flex-col">
      <div class={cn('flex h-auto w-full justify-between gap-8', props.class)}>
        <For each={props.statistics}>
          {(statistic) => (
            <div class="flex basis-0 grow flex-col justify-between">
              <span class="text-xs text-on-surface-variant">{statistic.label}</span>
              <Suspense fallback={<div class="h-[20px] w-auto skeleton-loader rounded-xs" />}>
                <span class="font-mono text-sm">{statistic.value()?.toString() ?? '—'}</span>
              </Suspense>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

export default StatisticBar
