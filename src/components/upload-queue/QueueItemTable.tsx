import { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import { Transition, TransitionGroup } from 'solid-transition-group'

import Icon from '~/components/material/Icon'
import { UploadItem } from '~/types'

import QueueItem from './QueueItem'

const QueueItemTable: Component<{ loading: boolean; items: () => UploadItem[]; error?: string; offline?: boolean }> = (props) => {
  return (
    <div class="relative h-[calc(4*3rem)] sm:h-[calc(6*3rem)]">
      <Transition
        appear
        enterActiveClass="transition-all duration-250 ease-in-out"
        exitActiveClass="transition-all duration-250 ease-in-out"
        enterClass="opacity-0"
        enterToClass="opacity-100"
        exitClass="opacity-100"
        exitToClass="opacity-0"
      >
        <Show
          when={!props.loading}
          fallback={
            <div class="flex justify-center items-center h-full animate-spin absolute inset-0">
              <Icon name="progress_activity" />
            </div>
          }
        >
          <Show
            when={!(props.offline && props.items().length === 0)}
            fallback={
              <div class="flex items-center justify-center h-full gap-2 text-on-surface-variant absolute inset-0">
                <Icon name="signal_disconnected" />
                <span>{props.error}</span>
              </div>
            }
          >
            <Show
              when={props.items().length > 0}
              fallback={
                <div class="flex items-center justify-center h-full gap-2 text-on-surface-variant absolute inset-0">
                  <Icon name="cloud_done" />
                  <span>No files in queue</span>
                </div>
              }
            >
              <div class="absolute inset-0 overflow-y-auto hide-scrollbar">
                <TransitionGroup
                  name="list"
                  enterActiveClass="transition-all duration-300 ease-in-out"
                  exitActiveClass="transition-all duration-300 ease-in-out"
                  enterClass="opacity-0 transform translate-x-4"
                  enterToClass="opacity-100 transform translate-x-0"
                  exitClass="opacity-100 transform translate-x-0"
                  exitToClass="opacity-0 transform -translate-x-4"
                  moveClass="transition-transform duration-300"
                >
                  <For each={props.items()}>
                    {(item) => (
                      <div class="bg-surface-container-lowest rounded-md pb-1 sm:pb-2">
                        <QueueItem item={item} />
                      </div>
                    )}
                  </For>
                </TransitionGroup>
              </div>
            </Show>
          </Show>
        </Show>
      </Transition>
    </div>
  )
}

export default QueueItemTable
