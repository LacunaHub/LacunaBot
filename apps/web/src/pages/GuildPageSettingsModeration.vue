<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.md_hierarchy_title') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-list class="q-px-none" padding dense>
          <q-item tag="label" v-ripple>
            <q-item-section>
              <q-item-label>
                {{ $t('pages.guild.md_respect_hierarchy_title') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-checkbox v-model="guild.moderation.respect_hierarchy" dense></q-checkbox>
            </q-item-section>
          </q-item>

          <q-item tag="label" v-ripple>
            <q-item-section>
              <q-item-label>
                {{ $t('pages.guild.md_deny_moderate_users_with_mp_title') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-checkbox v-model="guild.moderation.deny_moderate_users_with_mp" dense></q-checkbox>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('pages.guild.md_unmoderated_roles_title') }}
              </div>
              <div class="text--secondary">
                {{ $t('pages.guild.md_unmoderated_roles_description') }}
              </div>

              <q-select
                v-model="guild.moderation.unmoderated_roles"
                :options="guild.roles"
                option-label="name"
                option-value="id"
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
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
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
    </div>

    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.md_log_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('pages.guild.md_log_description') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('pages.guild.md_case_log_channel_title') }}
              </div>

              <div class="text--secondary">
                {{ $t('pages.guild.md_case_log_channel_description') }}
              </div>

              <q-select
                v-model="guild.moderation.case_log.channel_id"
                :options="guild.channelsText"
                option-label="name"
                option-value="id"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
                clearable
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
          </div>
        </q-card-section>

        <q-list class="q-px-none" padding>
          <q-expansion-item
            expand-separator
            :label="$t('pages.guild.md_case_log_types_title')"
            :caption="$t('pages.guild.md_case_log_types_description')"
          >
            <q-card class="rounded-lg bg-dark-grey-2">
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div
                    v-for="caseType of Object.keys(guild.moderation.case_log.types)"
                    :key="caseType"
                    class="col-12 col-sm-6 col-md-4"
                  >
                    <q-btn
                      class="full-width"
                      :label="$t(`common.case_log_keys.${caseType}`)"
                      color="dark-grey-3"
                      align="left"
                      unelevated
                      no-caps
                      @click="caseTypeDialog(caseType, guild.moderation.case_log.types[caseType])"
                    ></q-btn>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-expansion-item
            expand-separator
            :label="$t('pages.guild.md_action_log_title')"
            :caption="$t('pages.guild.md_action_log_description')"
          >
            <q-card class="rounded-lg bg-dark-grey-2">
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div
                    v-for="log in Object.keys(guild.moderation.logs.types).sort()"
                    :key="log"
                    class="col-12 col-sm-6 col-md-4"
                  >
                    <q-card class="rounded-lg bg-dark-grey-3" flat>
                      <q-item class="rounded-t-lg" tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>
                            {{ $t(`common.action_log_keys.${log}`) }}
                          </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <q-toggle v-model="guild.moderation.logs.types[log].active" dense></q-toggle>
                        </q-item-section>
                      </q-item>

                      <q-card-section>
                        <q-select
                          v-model="guild.moderation.logs.types[log].channel_id"
                          :options="guild.channelsText"
                          option-label="name"
                          option-value="id"
                          :disable="!guild.moderation.logs.types[log].active"
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
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.md_mutes_title') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-list class="q-px-none" padding dense>
          <q-item tag="label" v-ripple>
            <q-item-section>
              <q-item-label>
                {{ $t('pages.guild.md_mutes_rar_title') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-checkbox v-model="guild.moderation.mutes.rar" dense></q-checkbox>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('pages.guild.md_mutes_rar_strict_title') }}
              </div>

              <q-select
                v-model="guild.moderation.mutes.rar_strict"
                :options="guild.rolesUnmanaged"
                option-label="name"
                option-value="id"
                :disable="!guild.moderation.mutes.rar"
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
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.md_automoder_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('pages.guild.md_automoder_description') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="autoMod of automoderTypes" :key="autoMod" class="col-12 col-sm-6 col-md-4">
              <q-card class="rounded-lg bg-dark-grey-3" flat>
                <q-item class="rounded-lg" clickable v-ripple @click="autoModDialog(autoMod.name)">
                  <q-item-section>
                    <q-item-label :class="guild.moderation.automoder[autoMod.name].active ? '' : 'text--secondary'">
                      {{ $t(`automoder.titles.${autoMod.name}`) }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side avatar>
                    <q-avatar size="24px" square>
                      <img :src="autoMod.icon" />
                    </q-avatar>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.md_penalties_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('pages.guild.md_penalties_description') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.moderation.warnings.penalties.length }}/100</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="penalty in guild.moderation.warnings.penalties.sort((a, b) => a.penalties - b.penalties)"
              :key="penalty.id"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="rounded-lg bg-dark-grey-3" flat>
                <q-item @click="penaltyDialog(penalty)" class="rounded-lg" clickable v-ripple>
                  <q-item-section>
                    <q-item-label class="ellipsis">
                      {{ $t('mod_warning_penalty.warning_plural', penalty.penalties) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div class="col-12">
              <q-btn
                v-if="guild.moderation.warnings.penalties.length < 100"
                @click="penaltyDialog()"
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
import { defineComponent } from 'vue'
import { useGuildStore } from 'src/stores/guild'
import ModerationCaseType from 'src/components/dialogs/ModerationCaseType.vue'
import AutoModAntiCaps from 'src/components/dialogs/AutoModAntiCaps.vue'
import AutoModLinksFilter from 'src/components/dialogs/AutoModLinksFilter.vue'
import AutoModNewbiesModeration from 'src/components/dialogs/AutoModNewbiesModeration.vue'
import AutoModNicknamesModeration from 'src/components/dialogs/AutoModNicknamesModeration.vue'
import AutoModSwearFilter from 'src/components/dialogs/AutoModSwearFilter.vue'
import AutoModUsersSlowdown from 'src/components/dialogs/AutoModUsersSlowdown.vue'
import ModerationWarningPenalty from 'src/components/dialogs/ModerationWarningPenalty.vue'

export default defineComponent({
  name: 'GuildPageSettingsModeration',

  setup() {
    const guild = useGuildStore()

    return { guild }
  },

  data() {
    return {
      toggle: true,
      select: [],
      automoderTypes: [
        { name: 'anti_caps', icon: '/src/assets/lower-case.svg' },
        { name: 'links_filter', icon: '/src/assets/unlink.svg' },
        { name: 'newbies', icon: '/src/assets/newbie.svg' },
        { name: 'nicknames', icon: '/src/assets/tags.svg' },
        { name: 'swear_filter', icon: '/src/assets/profanity.svg' },
        { name: 'users_slowdown', icon: '/src/assets/slowdown.svg' }
      ]
    }
  },

  methods: {
    caseTypeDialog(name, config) {
      this.$q
        .dialog({
          component: ModerationCaseType,

          componentProps: {
            caseTypeProp: { name, config }
          }
        })
        .onOk(caseType => {
          this.guild.moderation.case_log.types[caseType.name] = { ...caseType.config }
        })
    },
    autoModDialog(name) {
      let component

      if (name === 'anti_caps') component = AutoModAntiCaps
      if (name === 'links_filter') component = AutoModLinksFilter
      if (name === 'newbies') component = AutoModNewbiesModeration
      if (name === 'nicknames') component = AutoModNicknamesModeration
      if (name === 'swear_filter') component = AutoModSwearFilter
      if (name === 'users_slowdown') component = AutoModUsersSlowdown

      if (component) {
        this.$q
          .dialog({
            component,

            componentProps: { name }
          })
          .onOk(autoMod => {
            this.guild.moderation.automoder[autoMod.name] = { ...autoMod.config }
          })
      }
    },
    penaltyDialog(config) {
      this.$q
        .dialog({
          component: ModerationWarningPenalty,

          componentProps: config ? { penaltyProp: config } : null
        })
        .onOk(payload => {
          const { mode, penalty } = payload

          if (mode === 'CREATE') {
            this.guild.moderation.warnings.penalties.push(penalty)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.moderation.warnings.penalties.findIndex(i => i.id === penalty.id)

            this.guild.moderation.warnings.penalties[index] = penalty
          }

          if (mode === 'DELETE') {
            const index = this.guild.moderation.warnings.penalties.findIndex(i => i.id === penalty.id)

            this.guild.moderation.warnings.penalties.splice(index, 1)
          }
        })
    }
  }
})
</script>
