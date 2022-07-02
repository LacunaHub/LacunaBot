<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.ac_levels_title') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-list class="q-px-none" padding dense>
          <q-item tag="label" v-ripple>
            <q-item-section>
              <q-item-label>
                {{ $t('pages.guild.ac_levels_text_exp_title') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-toggle v-model="guild.modules.levels.active" dense></q-toggle>
            </q-item-section>
          </q-item>

          <q-item tag="label" v-ripple>
            <q-item-section>
              <q-item-label>
                {{ $t('pages.guild.ac_levels_voice_exp_title') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-toggle v-model="guild.modules.levels.voice" dense></q-toggle>
            </q-item-section>
          </q-item>
        </q-list>

        <q-list class="q-px-none" padding dense>
          <q-item
            tag="label"
            :disable="!guild.modules.levels.active && !guild.modules.levels.voice"
            v-ripple="guild.modules.levels.active || guild.modules.levels.voice"
          >
            <q-item-section>
              <q-item-label>
                {{ $t('pages.guild.ac_levels_reset_on_leave_title') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-checkbox
                v-model="guild.modules.levels.reset_on_leave"
                :disable="!guild.modules.levels.active && !guild.modules.levels.voice"
                dense
              ></q-checkbox>
            </q-item-section>
          </q-item>
        </q-list>

        <q-list class="q-px-none">
          <q-expansion-item expand-separator :label="$t('common.permissions')">
            <q-card class="rounded-lg bg-dark-grey-2">
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('common.allowed_channels') }}
                    </div>

                    <q-select
                      v-model="guild.modules.levels.allowed.channels"
                      :options="guild.channelsText"
                      option-label="name"
                      option-value="id"
                      :disable="!guild.modules.levels.active && !guild.modules.levels.voice"
                      class="q-pt-sm"
                      filled
                      dense
                      hide-bottom-space
                      emit-value
                      map-options
                      multiple
                    >
                      <template #selected-item="{ opt, index, removeAtIndex }">
                        <q-chip
                          class="rounded-lg"
                          color="dark-grey-1"
                          square
                          :label="opt.name ?? opt"
                          :icon="opt.icon"
                          size="sm"
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
                          active-class="menu-item--active"
                        >
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
                      {{ $t('common.blocked_channels') }}
                    </div>

                    <q-select
                      v-model="guild.modules.levels.blocked.channels"
                      :options="guild.channelsText"
                      option-label="name"
                      option-value="id"
                      :disable="!guild.modules.levels.active && !guild.modules.levels.voice"
                      class="q-pt-sm"
                      filled
                      dense
                      hide-bottom-space
                      emit-value
                      map-options
                      multiple
                    >
                      <template #selected-item="{ opt, index, removeAtIndex }">
                        <q-chip
                          class="rounded-lg"
                          color="dark-grey-1"
                          square
                          :label="opt.name ?? opt"
                          :icon="opt.icon"
                          size="sm"
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
                          active-class="menu-item--active"
                        >
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
                </div>
              </q-card-section>

              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('common.allowed_roles') }}
                    </div>

                    <q-select
                      v-model="guild.modules.levels.allowed.roles"
                      :options="guild.roles"
                      option-label="name"
                      option-value="id"
                      :disable="!guild.modules.levels.active && !guild.modules.levels.voice"
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
                      {{ $t('common.blocked_roles') }}
                    </div>

                    <q-select
                      v-model="guild.modules.levels.blocked.roles"
                      :options="guild.roles"
                      option-label="name"
                      option-value="id"
                      :disable="!guild.modules.levels.active && !guild.modules.levels.voice"
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
            </q-card>
          </q-expansion-item>
        </q-list>

        <q-item
          class="q-py-md"
          tag="label"
          :disable="!guild.modules.levels.active && !guild.modules.levels.voice"
          v-ripple="guild.modules.levels.active || guild.modules.levels.voice"
        >
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.ac_levels_alerts_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-toggle
              v-model="guild.modules.levels.level_up_alerts.active"
              :disable="!guild.modules.levels.active && !guild.modules.levels.voice"
              dense
            ></q-toggle>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div>
                {{ $t('pages.guild.gs_message_format_title') }}
              </div>

              <q-select
                v-model="guild.modules.levels.level_up_alerts.format"
                :options="['DM', 'CHANNEL', 'CURRENT_CHANNEL']"
                :disable="
                  (!guild.modules.levels.active && !guild.modules.levels.voice) ||
                  !guild.modules.levels.level_up_alerts.active
                "
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
              >
                <template #selected-item="{ opt }">
                  <span>
                    {{ $t(`pages.guild.gs_message_formats.${opt}`) }}
                  </span>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label>
                        {{ $t(`pages.guild.gs_message_formats.${opt}`) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-6">
              <div>
                {{ $t('pages.guild.gs_message_channel_title') }}
              </div>

              <q-select
                v-model="guild.modules.levels.level_up_alerts.channel_id"
                :options="guild.channelsText"
                option-label="name"
                option-value="id"
                :disable="
                  (!guild.modules.levels.active && !guild.modules.levels.voice) ||
                  !guild.modules.levels.level_up_alerts.active ||
                  guild.modules.levels.level_up_alerts.format !== 'CHANNEL'
                "
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
              >
                <template #selected-item="{ opt }">
                  <q-chip
                    class="rounded-lg"
                    color="dark-grey-1"
                    square
                    :label="opt.name ?? opt"
                    :icon="opt.icon"
                    size="sm"
                    :ripple="false"
                  ></q-chip>
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
                {{ $t('pages.guild.gs_message_template_title') }}
              </div>

              <MessageEditor
                class="q-pt-sm"
                :message="guild.modules.levels.level_up_alerts.message"
                :disable="
                  (!guild.modules.levels.active && !guild.modules.levels.voice) ||
                  !guild.modules.levels.level_up_alerts.active
                "
              />
            </div>
          </div>
        </q-card-section>

        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.ac_levels_awards_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('pages.guild.ac_levels_awards_description') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.levels.awards.length }}/{{ guild.premium.available ? '200' : '50' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="award in guild.modules.levels.awards.sort((a, b) => a.level - b.level)"
              :key="award.id"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="rounded-lg bg-dark-grey-3" flat>
                <q-item
                  @click="awardDialog(award)"
                  :disable="!guild.modules.levels.active && !guild.modules.levels.voice"
                  class="rounded-lg"
                  clickable
                  v-ripple
                >
                  <q-item-section side>
                    <q-item-label>Lv. {{ award.level }}</q-item-label>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="ellipsis">
                      {{ award.references.map(i => guild.roles.find(j => i === j.id)?.name ?? i).join(', ') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.levels.awards.length < 200" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.levels.awards.length >= 50
                    ? lacunaDiamondDialog()
                    : awardDialog()
                "
                :disable="!guild.modules.levels.active && !guild.modules.levels.voice"
                class="full-width dashed-border"
                icon="add"
                flat
              ></q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md rounded-t-lg" tag="label" v-ripple>
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.ac_economy_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-toggle v-model="guild.modules.economy.active" dense></q-toggle>
          </q-item-section>
        </q-item>

        <q-list class="q-px-none" padding dense>
          <q-item tag="label" :disable="!guild.modules.economy.active" v-ripple="guild.modules.economy.active">
            <q-item-section>
              <q-item-label>
                {{ $t('pages.guild.ac_economy_reset_on_leave_title') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-checkbox
                v-model="guild.modules.economy.reset_wallet_on_leave"
                :disable="!guild.modules.economy.active"
                dense
              ></q-checkbox>
            </q-item-section>
          </q-item>
        </q-list>

        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.ac_economy_currencies_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.economy.currencies.length }}/2</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="currency in guild.modules.economy.currencies"
              :key="currency.id"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="rounded-lg bg-dark-grey-3" flat>
                <q-item
                  @click="currencyDialog(currency)"
                  :disable="!guild.modules.economy.active"
                  class="rounded-lg"
                  clickable
                  v-ripple
                >
                  <q-item-section>
                    <q-item-label>{{ currency.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.economy.currencies.length < 2" class="col-12">
              <q-btn
                @click="currencyDialog()"
                :disable="!guild.modules.economy.active"
                class="full-width dashed-border"
                icon="add"
                flat
              ></q-btn>
            </div>
          </div>
        </q-card-section>

        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.ac_economy_store_items_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.economy.store.items.length }}/{{ guild.premium.available ? '200' : '50' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="item in guild.modules.economy.store.items" :key="item.id" class="col-12 col-sm-6 col-md-4">
              <q-card class="rounded-lg bg-dark-grey-3" flat>
                <q-item
                  @click="storeItemDialog(item)"
                  :disable="!guild.modules.economy.active"
                  class="rounded-lg"
                  clickable
                  v-ripple
                >
                  <q-item-section>
                    <q-item-label>{{ item.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.economy.store.items.length < 200" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.economy.store.items.length >= 50
                    ? lacunaDiamondDialog()
                    : storeItemDialog()
                "
                :disable="!guild.modules.economy.active"
                class="full-width dashed-border"
                icon="add"
                flat
              ></q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import { useGuildStore } from 'src/stores/guild'
import { defineComponent } from 'vue'
import MessageEditor from 'src/components/MessageEditor.vue'
import LacunaDiamond from 'src/components/dialogs/LacunaDiamond.vue'
import ActivitiesLevelAward from 'src/components/dialogs/ActivitiesLevelAward.vue'
import ActivitiesEconomyCurrency from 'src/components/dialogs/ActivitiesEconomyCurrency.vue'
import ActivitiesEconomyStoreItem from 'src/components/dialogs/ActivitiesEconomyStoreItem.vue'

export default defineComponent({
  name: 'GuildPageSettingsActivities',

  components: {
    MessageEditor
  },

  setup() {
    const guild = useGuildStore()

    return { guild }
  },

  methods: {
    lacunaDiamondDialog() {
      this.$q.dialog({
        component: LacunaDiamond
      })
    },
    awardDialog(config) {
      this.$q
        .dialog({
          component: ActivitiesLevelAward,

          componentProps: config ? { awardProp: config } : null
        })
        .onOk(payload => {
          const { mode, award } = payload

          if (mode === 'CREATE') {
            this.guild.modules.levels.awards.push(award)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.levels.awards.findIndex(i => i.id === award.id)

            this.guild.modules.levels.awards[index] = award
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.levels.awards.findIndex(i => i.id === award.id)

            this.guild.modules.levels.awards.splice(index, 1)
          }
        })
    },
    currencyDialog(config) {
      this.$q
        .dialog({
          component: ActivitiesEconomyCurrency,

          componentProps: config ? { currencyProp: config } : null
        })
        .onOk(payload => {
          const { mode, currency } = payload

          if (mode === 'CREATE') {
            this.guild.modules.economy.currencies.push(currency)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.economy.currencies.findIndex(i => i.id === currency.id)

            this.guild.modules.economy.currencies[index] = currency
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.economy.currencies.findIndex(i => i.id === currency.id)

            this.guild.modules.economy.currencies.splice(index, 1)

            for (const item of this.guild.modules.economy.store.items.filter(i => i.currency_id == currency.id)) {
              item.currency_id = 'DEFAULT'
            }
          }
        })
    },
    storeItemDialog(config) {
      this.$q
        .dialog({
          component: ActivitiesEconomyStoreItem,

          componentProps: config ? { itemProp: config } : null
        })
        .onOk(payload => {
          const { mode, item } = payload

          if (mode === 'CREATE') {
            this.guild.modules.economy.store.items.push(item)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.economy.store.items.findIndex(i => i.id === item.id)

            this.guild.modules.economy.store.items[index] = item
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.economy.store.items.findIndex(i => i.id === item.id)

            this.guild.modules.economy.store.items.splice(index, 1)
          }
        })
    }
  }
})
</script>
