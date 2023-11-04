<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg" tag="label">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ command.name }}
          </q-item-label>

          <q-item-label class="text--secondary">
            {{ command.description }}
          </q-item-label>
        </q-item-section>

        <q-item-section side top>
          <q-toggle v-model="command.config.inactive" :true-value="false" :false-value="true" dense></q-toggle>
        </q-item-section>
      </q-item>

      <q-card-section>
        <q-banner class="bg-dark-2 rounded-borders" dense>
          <span>
            {{ $t('command.permissions_now_unavailable') }}
          </span>

          <template #avatar>
            <q-icon name="info" color="info"></q-icon>
          </template>
        </q-banner>
      </q-card-section>

      <div class="q-pa-md">
        <q-list class="bg-dark-2 overflow-hidden rounded-borders">
          <q-expansion-item :disable="command.config.inactive">
            <template #header>
              <q-item-section side>
                <q-checkbox
                  v-model="command.config.options"
                  val="THROTTLING"
                  dense
                  :disable="command.config.inactive"
                  @update:model-value="onSelectOption"
                ></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('command.throttling_title') }}
                </q-item-label>
              </q-item-section>
            </template>

            <q-card class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('command.throttling_scope_title') }}
                    </div>

                    <q-select
                      v-if="command.config.options.includes('THROTTLING')"
                      v-model="command.config.throttling.type"
                      :options="['PER_USER', 'PER_CHANNEL', 'PER_GUILD']"
                      :disable="command.config.inactive"
                      class="q-pt-sm"
                      filled
                      dense
                      hide-bottom-space
                    >
                      <template #selected-item="{ opt }">
                        <span>
                          {{ $t(`command.throttling_scopes.${opt}`) }}
                        </span>
                      </template>

                      <template #option="{ opt, toggleOption, selected }">
                        <q-item
                          clickable
                          @click="toggleOption(opt)"
                          :active="selected"
                          active-class="menu-item--active"
                        >
                          <q-item-section>
                            <q-item-label>
                              {{ $t(`command.throttling_scopes.${opt}`) }}
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>

                    <q-select
                      v-else
                      disable
                      :label="$t('command.throttling_scopes.PER_USER')"
                      class="q-pt-sm"
                      filled
                      dense
                      hide-bottom-space
                    ></q-select>
                  </div>

                  <div class="col-12">
                    <div>
                      {{ $t('command.throttling_max_uses_title') }}
                    </div>

                    <q-slider
                      v-if="command.config.options.includes('THROTTLING')"
                      v-model.number="command.config.throttling.max_uses"
                      class="q-pt-sm q-px-sm"
                      :min="1"
                      :max="10"
                      snap
                      marker-labels
                    ></q-slider>

                    <q-slider
                      v-else
                      disable
                      :model-value="1"
                      class="q-pt-sm q-px-sm"
                      :min="1"
                      :max="10"
                      snap
                      marker-labels
                    ></q-slider>
                  </div>

                  <div class="col-12">
                    <div>
                      {{ $t('command.throttling_timeout_title') }}
                    </div>

                    <q-select
                      v-if="command.config.options.includes('THROTTLING')"
                      v-model.number="command.config.throttling.timeout"
                      :options="[60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400]"
                      :disable="command.config.inactive"
                      class="q-pt-sm"
                      filled
                      dense
                      hide-bottom-space
                    >
                      <template #selected-item="{ opt }">
                        <span>
                          {{
                            $dt
                              .now()
                              .plus({ seconds: opt })
                              .toRelative({ unit: ['hours', 'minutes'], padding: 30000 })
                          }}
                        </span>
                      </template>

                      <template #option="{ opt, toggleOption, selected }">
                        <q-item
                          clickable
                          @click="toggleOption(opt)"
                          :active="selected"
                          active-class="menu-item--active"
                        >
                          <q-item-section>
                            <q-item-label>
                              {{
                                $dt
                                  .now()
                                  .plus({ seconds: opt })
                                  .toRelative({ unit: ['hours', 'minutes'], padding: 30000 })
                              }}
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>

                    <q-select
                      v-else
                      disable
                      :label="
                        $dt
                          .now()
                          .plus({ seconds: 60 })
                          .toRelative({ unit: ['hours', 'minutes'], padding: 30000 })
                      "
                      class="q-pt-sm"
                      filled
                      dense
                      hide-bottom-space
                    ></q-select>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn class="full-width" :label="$t('done')" unelevated no-caps color="primary" @click="onConfirm" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'SystemCommand',

  emits: [...useDialogPluginComponent.emits],

  props: {
    commandProp: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const commandConfig = guild.commands.configuration.find(i => i.name === props.commandProp.name)
    const command = ref(
      JSON.parse(
        JSON.stringify({
          ...props.commandProp,
          config: commandConfig ?? {
            inactive: false,
            options: [],
            permissions: { allowed_channels: [], allowed_roles: [], blocked_channels: [], blocked_roles: [] }
          }
        })
      )
    )

    return {
      guild,

      dialogRef,

      onConfirm() {
        onDialogOK(command.value)
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      command
    }
  },

  methods: {
    onSelectOption(options) {
      if (options.includes('THROTTLING') && !this.command.config.throttling) {
        this.command.config.throttling = {
          type: 'PER_USER',
          max_uses: 1,
          timeout: 60
        }
      }

      if (!options.includes('THROTTLING')) {
        delete this.command.config.throttling
      }
    }
  }
})
</script>
