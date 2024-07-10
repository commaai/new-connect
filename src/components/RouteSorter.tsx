import { For } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { Component } from 'solid-js'
import { SortKey, SortOption, SortOrder } from '~/utils/sorting'

const GRADIENT = 'from-cyan-700 via-blue-800 to-purple-900'

interface RouteSorterProps {
  onSortChange: (key: SortKey, order: SortOrder) => void
  currentSort: SortOption
}

export const RouteSorter: Component<RouteSorterProps> = (props) => {
  const [sortOptions] = createStore<SortOption[]>([
    { label: 'Date', key: 'date', order: null },
    { label: 'Duration', key: 'duration', order: null },
    { label: 'Miles', key: 'miles', order: null },
    { label: 'Engaged', key: 'engaged', order: null },
    { label: 'User Flags', key: 'userFlags', order: null },
  ])

  const handleScroll = (e: WheelEvent) => {
    const container = e.currentTarget as HTMLDivElement
    container.scrollLeft += e.deltaY
  }

  const handleClick = (clickedOption: SortOption) => {
    let newOrder: SortOrder
    if (props.currentSort.key === clickedOption.key) {
      // If the same button is clicked, toggle between asc and desc
      newOrder = props.currentSort.order === 'desc' ? 'asc' : 'desc'
    } else {
      // If a new button is clicked, always start with descending order
      newOrder = 'desc'
    }
    props.onSortChange(clickedOption.key, newOrder)
  }

  return (
    <div class="max-w-md pt-2.5">
      <div 
        class="hide-scrollbar flex overflow-x-auto pb-1" 
        style={{ 'scroll-behavior': 'smooth' }}
        onWheel={handleScroll}
      >
        <For each={sortOptions}>
          {(option) => (
            <button
              class="relative mr-2 flex items-center justify-center overflow-hidden whitespace-nowrap rounded-sm px-5 py-3 text-sm transition-all duration-500 ease-in-out first:ml-1"
              style={{ 'min-width': 'fit-content' }}
              onClick={() => handleClick(option)}
            >
              <div 
                class={`absolute inset-0 bg-gradient-to-r ${GRADIENT} transition-all duration-300 ease-in-out`}
                style={{ 
                  opacity: props.currentSort.key === option.key ? 1 : 0,
                  'background-size': '200% 100%',
                  'background-position': props.currentSort.order === 'asc' ? 'right bottom' : 'left bottom',
                }}
              />
              <div 
                class="absolute inset-0 bg-black transition-opacity duration-300 ease-in-out"
                style={{ opacity: props.currentSort.key === option.key ? 0.4 : 0 }}
              />
              <div 
                class="absolute inset-0 bg-surface-container transition-opacity duration-500 ease-in"
                style={{ opacity: props.currentSort.key === option.key ? 0 : 1 }}
              />
              <span class={`relative z-10 antialiased transition-colors duration-300 ${props.currentSort.key === option.key ? 'font-semibold text-white' : 'font-regular text-gray-400'}`}>
                {option.label}
              </span>
              {props.currentSort.key === option.key && (
                <span class="relative z-10 ml-3 inline-block w-4 text-white transition-transform duration-300">
                  {props.currentSort.order === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}

export default RouteSorter
