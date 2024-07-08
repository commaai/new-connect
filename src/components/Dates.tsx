import { VoidComponent, createEffect, createSignal, onMount, useContext } from 'solid-js'
import Button from './material/Button'
import Avatar from './material/Avatar'
import Icon from './material/Icon'
import Modal from './Modal'
import { DashboardContext, generateContextType } from '~/pages/dashboard/Dashboard'

type Props = {
  start: Date | null,
  end: Date | null,
  visible: boolean,
  onSelect: (start: Date, end: Date) => void
}

type InputProps = {
  value: Date
  onSelect: (value: Date) => void
}
const Input: VoidComponent<InputProps> = (props) => {
  return <input 
    type="date" 
    class="m-1 w-4/5 bg-transparent md:w-3/5"
    value={props.value.toISOString().split('T')[0]}
    onChange={event => {
      const value = event.target.value
      props.onSelect(value ? new Date(value) : props.value)
    }} 
  />
}

const DatePicker: VoidComponent<Props> = (props) => {

  const [visible, setVisible] = createSignal(false)
  const [start, setStart] = createSignal(new Date())
  const [end, setEnd] = createSignal(new Date())

  createEffect(() => setVisible(props.visible))
  onMount(() => {
    if(props.start) setStart(props.start)
    if(props.end) setEnd(props.end)
  })

  return <Modal visible={visible()}>
    <div class="flex h-1/5 w-4/5 flex-col rounded-md bg-secondary-container opacity-100 md:w-2/5 xl:w-1/5">
      <div class="flex basis-2/6 items-center justify-center">
        <h2>select a date range</h2>
      </div>
      <div class="flex basis-3/6 items-center justify-center">
        <div class="flex basis-1/6 flex-col items-end justify-center md:basis-2/6">
          <p>From</p>
          <p>To</p>
        </div>
        <div class="flex basis-4/6 flex-col p-2">
          <Input value={start()} onSelect={value => setStart(value)} />
          <Input value={end()} onSelect={value => setEnd(value)} />
        </div>
      </div>
      <div class="flex basis-2/6 items-center justify-center">
        <Button onClick={() => props.onSelect(start(), end())} >
          <p>Set dates</p>
        </Button>
      </div>
    </div>
  </Modal>
}

type DisplayProps = {
  value: Date,
  isEnd?: boolean,
  onClick: () => void
}

const DateDisplay: VoidComponent<DisplayProps> = (props) => {
  const { isDesktop } = useContext(DashboardContext) ?? generateContextType()
  return <div onClick={() => props.onClick()} class={`flex basis-1/2 flex-col ${props.isEnd && 'items-end'} justify-center`}>
    <p class="text-sm text-on-secondary-container">{props.isEnd ? 'To' : 'From'}</p>
    <h2 class="text-lg">{props.value.toLocaleDateString('en-US', { year: 'numeric', month: isDesktop() ? 'long' : 'numeric', day: 'numeric' })}</h2>
  </div>
}

const Dates: VoidComponent = () => {

  const [selector, openSelector] = createSignal(false)
  const [dates, setDates] = createSignal({start: new Date(), end: new Date()})

  return <div class="flex size-11/12 rounded-md">
    <DatePicker 
      visible={selector()}
      start={new Date()}
      end={new Date()}
      onSelect={(start, end) => {
        setDates({ start, end })
        openSelector(false)
      }}
    />
    <DateDisplay onClick={() => openSelector(true)} value={dates().start} />
    <div class="flex basis-1/5 items-center justify-center">
      <Avatar onClick={() => openSelector(true)}>
        <Icon>calendar_month</Icon>
      </Avatar>
    </div>
    <DateDisplay onClick={() => openSelector(true)} value={dates().end} isEnd />
  </div>
}

export default Dates
