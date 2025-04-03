import clsx from 'clsx'
import { For, VoidComponent } from 'solid-js'

const StatisticBar: VoidComponent<{ class?: string; statistics: { label: string; value: () => unknown }[] }> = (props) => {
  return (
    <div class="flex flex-col">
      <div class={clsx('flex h-auto w-full justify-between gap-8', props.class)}>
        <For each={props.statistics}>
          {(statistic) => (
            <div class="flex basis-0 grow flex-col justify-between">
              <span class="text-body-sm text-on-surface-variant">{statistic.label}</span>
                <span class="font-mono text-label-lg uppercase">{statistic.value()?.toString() ?? '—'}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

export default StatisticBar
