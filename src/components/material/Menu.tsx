import type { ParentComponent, VoidComponent } from 'solid-js'

import List, { ListItem, type ListItemProps } from '~/components/material/List'

export const MenuItem: ParentComponent<Omit<ListItemProps, 'variant'>> = (props) => <ListItem variant="menu" {...props} />

export const MenuDivider: VoidComponent = () => <hr class="opacity-20" />

const Menu: ParentComponent = (props) => (
  <List class="py-1 min-w-[112px] max-w-[280px] rounded-xs bg-surface-container elevation-2 text-on-secondary-container">
    {props.children}
  </List>
)

export default Menu
