import { VoidComponent, createSignal, useContext, onMount, Show } from 'solid-js'
import { createShortcut } from '@solid-primitives/keyboard'
import Icon from '~/components/material/Icon'
import { DashboardContext, generateContextType } from '../Dashboard'

type Props = {
  onSearch: (query: string) => void
}

const Search: VoidComponent<Props> = (props) => {

  const { width, isDesktop } = useContext(DashboardContext) ?? generateContextType()

  const onSearch = (searchQuery: string) => props.onSearch(searchQuery)

  const [placeholder, setPlaceHolder] = createSignal('connect')
  const [focused, setFocus] = createSignal(false)
  const [query, setQuery] = createSignal('')

  createShortcut(
    ['Control', 'K'],
    () => setFocus(true),
    { preventDefault: true },
  )

  onMount(() => {
    setTimeout(() => setPlaceHolder('type to search'), 5000)
  })

  return <div 
    style={{ width: !isDesktop() ? '95%' : `${width() - 3}%` }}
    class="absolute left-3 top-6 z-20 flex h-14 animate-load-bounce rounded-full bg-secondary-container sm:left-5 sm:top-10"
  >

    <div class="flex w-20 items-center justify-center">
      <Icon class="text-on-secondary-container">account_circle</Icon>
    </div>
    <div class="flex w-10/12 items-center justify-center">
      <Show 
        when={query() || focused()}
        fallback={<h2 onClick={() => setFocus(true)} class="text-xl text-on-secondary-container">{placeholder()}</h2>}
      >
        <input
          value={query()}
          onInput={ev => {
            setQuery(ev.target.value)
            onSearch(ev.target.value)
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          autofocus
          class="size-full border-0 bg-transparent outline-none"
        />
      </Show>
    </div>
    <div onClick={() => {
      setQuery('')
      onSearch('')
    }} class="flex w-20 items-center justify-center">
      <Icon class="text-on-secondary-container">{query() ? 'close' : 'search'}</Icon>
    </div>
  </div>
}

export default Search
