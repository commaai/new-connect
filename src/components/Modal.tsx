import { createEffect, createSignal, type ParentComponent } from 'solid-js'

type Props = {
  visible: boolean;
}

const Modal:ParentComponent<Props> = (props) => {
  const [visible, setVisible] = createSignal(false)
  createEffect(() => {
    setVisible(props.visible)
  })
  return <div class={`fixed inset-0 z-40 flex items-center justify-center ${visible() ? '' : 'hidden'} h-screen w-screen bg-neutral-900 opacity-70`}>{props.children}</div>  
}

export default Modal
