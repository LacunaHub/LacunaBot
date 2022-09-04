<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 1000px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg" tag="label" v-ripple>
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(`automoder.titles.${name}`) }}
          </q-item-label>
        </q-item-section>

        <q-item-section side top>
          <q-toggle v-model="config.active" dense></q-toggle>
        </q-item-section>
      </q-item>

      <q-tabs
        v-model="currentTab"
        class="bg-dark-2"
        align="justify"
        active-bg-color="secondary"
        indicator-color="transparent"
        no-caps
      >
        <q-tab name="general" :label="$t('pages.guild.nav_names.GENERAL')" style="width: 50%"></q-tab>

        <q-tab name="actions" :label="$t('common.actions')" style="width: 50%"></q-tab>
      </q-tabs>

      <q-tab-panels v-model="currentTab" class="bg-dark-1" animated>
        <q-tab-panel name="general" class="q-pa-none" style="overflow-y: hidden">
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <div>
                  {{ $t('automoder.nm_minimum_account_age_title') }}
                </div>
                <div class="text--secondary">
                  {{ $t('automoder.nm_minimum_account_age_description') }}
                </div>

                <q-input
                  v-model.number="config.minimum_account_age.value"
                  :disable="!config.active"
                  class="q-pt-sm"
                  type="number"
                  filled
                  dense
                  hide-bottom-space
                  @update:model-value="onChangeAge"
                >
                  <template #after>
                    <q-select
                      v-model="config.minimum_account_age.measure"
                      :options="['MINUTES', 'HOURS', 'DAYS']"
                      filled
                      dense
                      hide-bottom-space
                      emit-value
                      map-options
                    >
                      <template #selected-item="{ opt }">
                        <span>
                          {{ $t(`automoder.nm_age_measures.${opt}`) }}
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
                              {{ $t(`automoder.nm_age_measures.${opt}`) }}
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>
                  </template>
                </q-input>
              </div>
            </div>
          </q-card-section>
        </q-tab-panel>

        <q-tab-panel name="actions" class="q-pa-none" style="overflow-y: hidden">
          <q-list class="q-px-none q-py-md" dense>
            <q-item
              v-for="action in actions"
              :key="action"
              tag="label"
              :disable="!config.active || config.options.some(i => action.exclusive.includes(i))"
              v-ripple="config.active && !config.options.some(i => action.exclusive.includes(i))"
            >
              <q-item-section>
                <q-item-label>
                  {{ $t(`common.actions_keys.${action.name}`) }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-checkbox
                  v-model="config.options"
                  :val="action.name"
                  :disable="!config.active || config.options.some(i => action.exclusive.includes(i))"
                  dense
                  @update:model-value="onSelectOption"
                ></q-checkbox>
              </q-item-section>
            </q-item>
          </q-list>

          <transition enter-active-class="animated fadeInUp">
            <q-card-section v-if="config.options.includes('ACTION_BAN')">
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <div>
                    {{ $t('automoder.penalty_timeout') }}
                  </div>

                  <q-select
                    v-model.number="config.ban_timeout"
                    :options="[
                      0, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400, 172800, 259200, 604800, 1209600
                    ]"
                    :disable="!config.active"
                    class="q-pt-sm"
                    filled
                    dense
                    hide-bottom-space
                  >
                    <template #selected-item="{ opt }">
                      <span v-if="opt === 0" class="text-lowercase">
                        {{ $t('automoder.indefinitely') }}
                      </span>
                      <span v-else>
                        {{
                          $dt
                            .now()
                            .plus({ seconds: opt })
                            .toRelative({ unit: ['days', 'hours', 'minutes'], padding: 30000 })
                        }}
                      </span>
                    </template>

                    <template #option="{ opt, toggleOption, selected }">
                      <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                        <q-item-section>
                          <q-item-label v-if="opt === 0" class="text-lowercase">
                            {{ $t('automoder.indefinitely') }}
                          </q-item-label>
                          <q-item-label v-else>
                            {{
                              $dt
                                .now()
                                .plus({ seconds: opt })
                                .toRelative({ unit: ['days', 'hours', 'minutes'], padding: 30000 })
                            }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
              </div>
            </q-card-section>
          </transition>

          <transition enter-active-class="animated fadeInUp">
            <q-card-section v-if="config.options.includes('ACTION_MUTE')">
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <div>
                    {{ $t('automoder.penalty_timeout') }}
                  </div>

                  <q-select
                    v-model.number="config.mute_timeout"
                    :options="[
                      60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400, 172800, 259200, 604800,
                      1209600
                    ]"
                    :disable="!config.active"
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
                            .toRelative({ unit: ['days', 'hours', 'minutes'], padding: 30000 })
                        }}
                      </span>
                    </template>

                    <template #option="{ opt, toggleOption, selected }">
                      <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                        <q-item-section>
                          <q-item-label>
                            {{
                              $dt
                                .now()
                                .plus({ seconds: opt })
                                .toRelative({ unit: ['days', 'hours', 'minutes'], padding: 30000 })
                            }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
              </div>
            </q-card-section>
          </transition>

          <transition enter-active-class="animated fadeInUp">
            <q-card-section v-if="config.options.includes('ACTION_MODIFY_ROLES')">
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <div>
                    {{ $t('common.add_roles') }}
                  </div>

                  <q-select
                    v-model="config.modify_roles.add"
                    :options="guild.rolesUnmanaged"
                    option-label="name"
                    option-value="id"
                    :disable="!config.active"
                    use-chips
                    class="q-pt-sm"
                    multiple
                    filled
                    dense
                    hide-bottom-space
                    emit-value
                    map-options
                  >
                    <template #selected-item="{ opt, index, removeAtIndex }">
                      <q-chip
                        class="rounded-lg"
                        square
                        :label="opt.name ?? opt"
                        size="sm"
                        :style="`background: ${opt.color}`"
                        :ripple="false"
                        removable
                        @remove="removeAtIndex(index)"
                      ></q-chip>
                    </template>

                    <template #option="{ opt, toggleOption, selected }">
                      <q-item
                        clickable
                        @click="toggleOption(opt)"
                        :active="selected"
                        :disable="opt.higher"
                        active-class="menu-item--active"
                      >
                        <q-item-section>
                          <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>

                <div class="col-12">
                  <div>
                    {{ $t('common.remove_roles') }}
                  </div>

                  <q-select
                    v-model="config.modify_roles.remove"
                    :options="guild.rolesUnmanaged"
                    option-label="name"
                    option-value="id"
                    :disable="!config.active"
                    use-chips
                    class="q-pt-sm"
                    multiple
                    filled
                    dense
                    hide-bottom-space
                    emit-value
                    map-options
                  >
                    <template #selected-item="{ opt, index, removeAtIndex }">
                      <q-chip
                        class="rounded-lg"
                        square
                        :label="opt.name ?? opt"
                        size="sm"
                        :style="`background: ${opt.color}`"
                        :ripple="false"
                        removable
                        @remove="removeAtIndex(index)"
                      ></q-chip>
                    </template>

                    <template #option="{ opt, toggleOption, selected }">
                      <q-item
                        clickable
                        @click="toggleOption(opt)"
                        :active="selected"
                        :disable="opt.higher"
                        active-class="menu-item--active"
                      >
                        <q-item-section>
                          <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
              </div>
            </q-card-section>
          </transition>
        </q-tab-panel>
      </q-tab-panels>

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
import { defineComponent, ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'

export default defineComponent({
  name: 'AutoModNewbiesModeration',

  emits: [...useDialogPluginComponent.emits],

  props: {
    name: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const config = ref(JSON.parse(JSON.stringify(guild.moderation.automoder.newbies)))

    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
    const currentTab = ref('general')

    return {
      guild,
      config,
      dialogRef,
      currentTab,
      console(v) {
        console.log(v)
      },

      onConfirm() {
        onDialogOK({ name: props.name, config: { ...config.value } })
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      }
    }
  },

  data() {
    return {
      actions: [
        { name: 'ACTION_BAN', exclusive: ['ACTION_MUTE', 'ACTION_KICK', 'ACTION_MODIFY_ROLES'] },
        { name: 'ACTION_MUTE', exclusive: ['ACTION_BAN', 'ACTION_KICK'] },
        { name: 'ACTION_KICK', exclusive: ['ACTION_BAN', 'ACTION_MUTE', 'ACTION_MODIFY_ROLES'] },
        { name: 'ACTION_MODIFY_ROLES', exclusive: ['ACTION_BAN', 'ACTION_KICK'] }
      ]
    }
  },

  methods: {
    onSelectOption(options) {
      if (options.includes('ACTION_BAN') && !this.config.ban_timeout) {
        this.config.ban_timeout = 300
      }

      if (options.includes('ACTION_MUTE') && !this.config.mute_timeout) {
        this.config.mute_timeout = 60
      }

      if (!options.includes('ACTION_BAN')) {
        delete this.config.ban_timeout
      }

      if (!options.includes('ACTION_MUTE')) {
        delete this.config.mute_timeout
      }
    },
    onChangeAge(value) {
      if (!value || value < 1) value = 1
      if (value > Math.pow(2, 14)) value = Math.pow(2, 14)

      this.config.minimum_account_age.value = value
    }
  }
})
</script>
