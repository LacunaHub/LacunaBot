<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 1000px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div>
              {{ $t('Pages.GuildPage.GeneralSettings.MessageFormat') }}
            </div>

            <q-select
              v-model="component.action.send_message.format"
              :options="['CURRENT_CHANNEL', 'CHANNEL']"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
            >
              <template #selected-item="{ opt }">
                <span>
                  {{ $t(localeStringsMap.messageFormats[opt]) }}
                </span>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label>
                      {{ $t(localeStringsMap.messageFormats[opt]) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-6">
            <div>
              {{ $t('Pages.GuildPage.GeneralSettings.ChannelForMessages') }}
            </div>

            <q-select
              v-model="component.action.send_message.channel_id"
              :options="guild.channelsText"
              option-label="name"
              option-value="id"
              :disable="component.action.send_message.format !== 'CHANNEL'"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
            >
              <template #selected-item="{ opt }">
                <q-chip color="dark-1" square :label="opt.name ?? opt" :icon="opt.icon" size="sm"></q-chip>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section avatar>
                    <q-icon :name="opt.icon"></q-icon>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ opt.name }}
                    </q-item-label>

                    <q-item-label class="text--secondary">
                      {{ opt.parentName }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('Pages.GuildPage.GeneralSettings.MessageTemplate') }}
            </div>

            <MessageEditor
              :message="component.action.send_message.message"
              hide-replacers
              hide-code-snippets
              :disable-components="false"
              class="q-pt-sm"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              class="full-width"
              :label="$t('Common.Done')"
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { localeStringsMap } from 'src/utils/Constants'
import { defineComponent, ref } from 'vue'
import MessageEditor from '../MessageEditor.vue'

export default defineComponent({
  name: 'ComponentActionSendMessage',

  emits: [...useDialogPluginComponent.emits],

  props: {
    componentProp: {
      type: Object,
      required: true
    }
  },

  components: {
    MessageEditor
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const component = ref(JSON.parse(JSON.stringify(props.componentProp)))

    return {
      guild,
      dialogRef,
      component,
      localeStringsMap,

      onConfirm() {
        onDialogOK({ component: component.value })
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      }
    }
  }
})
</script>
