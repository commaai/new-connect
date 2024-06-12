import { onCleanup, createSignal, ParentComponent, JSX } from 'solid-js';
import clsx from 'clsx'
import Typography from '~/components/material/Typography'

interface TopAppBarProps {
  leading?: JSX.Element;
  as?: string;
  trailing?: JSX.Element;
}

const TopAppBar: ParentComponent<TopAppBarProps> = (props) => {
  const [isLargeScreen, setIsLargeScreen] = createSignal(false);

  const mql = window.matchMedia('(min-width: 1024px)');
  setIsLargeScreen(mql.matches);
  mql.addEventListener('change', (e) => setIsLargeScreen(e.matches));

  onCleanup(() => mql.removeEventListener('change', (e) => setIsLargeScreen(e.matches)));

  return (
    <div
      class={clsx(
        'inset-x-0 top-0 flex h-16 items-center gap-4 px-4 py-5 text-on-surface',
        props.class,
      )}
    >
      {!isLargeScreen() && props.leading}
      <Typography class="grow" as={props.as || 'h2'} variant="title-lg">
        {props.children}
      </Typography>
      {props.trailing}
    </div>
  );
};

export default TopAppBar;