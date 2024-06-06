import type { ParentComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import clsx from 'clsx'

export type TypographyProps = {
  class?: string
  color?:
    | 'inherit'
    | 'on-surface'
    | 'on-surface-variant'
    | 'on-primary'
    | 'on-secondary'
    | 'on-tertiary'
  variant?:
    | 'display-lg'
    | 'display-md'
    | 'display-sm'
    | 'headline-lg'
    | 'headline-md'
    | 'headline-sm'
    | 'title-lg'
    | 'title-md'
    | 'title-sm'
    | 'label-lg'
    | 'label-md'
    | 'label-sm'
    | 'body-lg'
    | 'body-md'
    | 'body-sm'
  weight?:
    | 'thin'
    | 'extra-light'
    | 'light'
    | 'regular'
    | 'medium'
    | 'semi-bold'
    | 'bold'
    | 'extra-bold'
    | 'black'
  as?: string
}

const Typography: ParentComponent<TypographyProps> = (props) => {
  // TODO: letter spacing
  const variant = () => props.variant || 'body-md'
  const styles = () =>
    ({
      'display-lg': 'font-sans text-[57px] leading-[64px]',
      'display-md': 'font-sans text-[45px] leading-[52px]',
      'display-sm': 'font-sans text-[36px] leading-[44px]',
      'headline-lg': 'font-sans text-[32px] leading-[40px]',
      'headline-md': 'font-sans text-[28px] leading-[36px]',
      'headline-sm': 'font-sans text-[24px] leading-[32px]',
      'title-lg': 'font-sans text-[22px] leading-[28px]',
      'title-md': 'font-sans text-[16px] leading-[24px]',
      'title-sm': 'font-sans text-[14px] leading-[20px]',
      'label-lg': 'font-mono text-[14px] leading-[20px] uppercase',
      'label-md': 'font-mono text-[12px] leading-[16px] uppercase',
      'label-sm': 'font-mono text-[11px] leading-[16px] uppercase',
      'body-lg': 'font-sans text-[16px] leading-[24px]',
      'body-md': 'font-sans text-[14px] leading-[20px]',
      'body-sm': 'font-sans text-[12px] leading-[16px]',
    }[variant()])

  const variantWeight = () =>
    ({
      'display-lg': 'regular',
      'display-md': 'regular',
      'display-sm': 'regular',
      'headline-lg': 'regular',
      'headline-md': 'regular',
      'headline-sm': 'regular',
      'title-lg': 'regular',
      'title-md': 'medium',
      'title-sm': 'medium',
      'label-lg': 'medium',
      'label-md': 'medium',
      'label-sm': 'medium',
      'body-lg': 'regular',
      'body-md': 'regular',
      'body-sm': 'regular',
    }[variant()])

  const weight = () => props.weight || variantWeight()
  const weightStyles = () =>
    ({
      light: 'font-light',
      regular: 'font-regular',
      medium: 'font-medium',
      'semi-bold': 'font-semibold',
      bold: 'font-bold',
      'extra-bold': 'font-extrabold',
    }[weight() || variantWeight()])

  const color = () => props.color || 'inherit'
  const colorStyles = () =>
    ({
      inherit: '',
      'on-surface': 'text-on-surface',
      'on-surface-variant': 'text-on-surface-variant',
      'on-primary': 'text-on-primary',
      'on-secondary': 'text-on-secondary',
      'on-tertiary': 'text-on-tertiary',
    }[color()])

  return (
    <Dynamic
      class={clsx(
        'transition-typography',
        styles(),
        weightStyles(),
        colorStyles(),
        props.class,
      )}
      component={props.as || 'span'}
    >
      {props.children}
    </Dynamic>
  )
}

export default Typography
