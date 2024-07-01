import type { ParentComponent } from 'solid-js'
import clsx from 'clsx'

type AvatarProps = {
  class?: string
  color?: string
  onClick?: () => void
}

const Avatar: ParentComponent<AvatarProps> = (props) => {
  const color = () => props.color || 'primary'
  const colorClasses = () =>
    ({
      primary: 'bg-primary-container text-on-primary-container',
      secondary: 'bg-secondary-container text-on-secondary-container',
      tertiary: 'bg-tertiary-container text-on-tertiary-container',
      error: 'bg-error-container text-on-error-container',
      surface: 'bg-surface text-on-surface',
    }[color()])

  return (
    <div
      class={clsx(
        'flex size-10 items-center justify-center rounded-full transition-colors',
        colorClasses(),
        props.class,
      )}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  )
}

export default Avatar
