<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.Moderation.Hierarchy') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="guild.moderation.respect_hierarchy" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Pages.GuildPage.Moderation.RespectHierarchy') }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="guild.moderation.deny_moderate_users_with_mp" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Pages.GuildPage.Moderation.DenyModerateUsersWithModeratorPermissions') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('Pages.GuildPage.Moderation.UnmoderatedRoles') }}
              </div>
              <div class="text--secondary">
                {{ $t('Pages.GuildPage.Moderation.UnmoderatedRolesDescription') }}
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
                    square
                    :label="opt.name ?? opt"
                    size="sm"
                    :style="`background: ${opt.color}`"
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
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.Moderation.Log') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('Pages.GuildPage.Moderation.LogDescription') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('Pages.GuildPage.Moderation.CaseLogChannel') }}
              </div>

              <div class="text--secondary">
                {{ $t('Pages.GuildPage.Moderation.CaseLogChannelDescription') }}
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
          </div>
        </q-card-section>

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-expansion-item
              expand-separator
              :label="$t('Pages.GuildPage.Moderation.CaseLogTypes')"
              :caption="$t('Pages.GuildPage.Moderation.CaseLogTypesDescription')"
            >
              <q-card class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div
                      v-for="caseType of Object.keys(guild.moderation.case_log.types)"
                      :key="caseType"
                      class="col-12 col-sm-6 col-md-4"
                    >
                      <q-btn
                        class="full-width"
                        :label="$t(localeStringsMap.caseLogTypes[caseType])"
                        color="dark-2"
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
              :label="$t('Pages.GuildPage.Moderation.ActionLog')"
              :caption="$t('Pages.GuildPage.Moderation.ActionLogDescription')"
            >
              <q-card class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div
                      v-for="log in Object.keys(guild.moderation.logs.types).sort()"
                      :key="log"
                      class="col-12 col-sm-6 col-md-4"
                    >
                      <q-card class="bg-dark-2" flat>
                        <q-item class="rounded-t-lg" tag="label">
                          <q-item-section>
                            <q-item-label>
                              {{ $t(localeStringsMap.actionLogEvents[log]) }}
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
                                color="dark-1"
                                square
                                :label="opt.name ?? opt"
                                :icon="opt.icon"
                                size="sm"
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
        </div>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.Moderation.Mutes') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="guild.moderation.mutes.rar" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Pages.GuildPage.Moderation.MutesRAR') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('Pages.GuildPage.Moderation.MutesRARStrict') }}
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
                    square
                    :label="opt.name ?? opt"
                    size="sm"
                    :style="`background: ${opt.color}`"
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
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.Moderation.AutoMod') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('Pages.GuildPage.Moderation.AutoModDescription') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="autoMod of automoderTypes" :key="autoMod" class="col-12 col-sm-6 col-md-4">
              <q-card class="bg-dark-2" flat>
                <q-item clickable @click="autoModDialog(autoMod.name)">
                  <q-item-section>
                    <q-item-label :class="guild.moderation.automoder[autoMod.name].active ? '' : 'text--secondary'">
                      {{ $t(localeStringsMap.autoModTypes[autoMod.name]) }}
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
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.Moderation.Penalties') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('Pages.GuildPage.Moderation.PenaltiesDescription') }}
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
              <q-card class="bg-dark-2" flat>
                <q-item @click="penaltyDialog(penalty)" clickable>
                  <q-item-section>
                    <q-item-label class="ellipsis">
                      {{ $t('Components.WarningPenalty.WarningsPlural', penalty.penalties) }}
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
import AutoModAntiCaps from 'src/components/dialogs/AutoModAntiCaps.vue'
import AutoModLinksFilter from 'src/components/dialogs/AutoModLinksFilter.vue'
import AutoModNewbiesModeration from 'src/components/dialogs/AutoModNewbiesModeration.vue'
import AutoModNicknamesModeration from 'src/components/dialogs/AutoModNicknamesModeration.vue'
import AutoModSwearFilter from 'src/components/dialogs/AutoModSwearFilter.vue'
import AutoModUsersSlowdown from 'src/components/dialogs/AutoModUsersSlowdown.vue'
import ModerationCaseType from 'src/components/dialogs/ModerationCaseType.vue'
import ModerationWarningPenalty from 'src/components/dialogs/ModerationWarningPenalty.vue'
import { useGuildStore } from 'src/stores/guild'
import { localeStringsMap } from 'src/utils/Constants'
import { defineComponent } from 'vue'

import lowerCaseImg from 'src/assets/lower-case.svg'
import newbieImg from 'src/assets/newbie.svg'
import profanityImg from 'src/assets/profanity.svg'
import slowdownImg from 'src/assets/slowdown.svg'
import tagsImg from 'src/assets/tags.svg'
import unlinkImg from 'src/assets/unlink.svg'

export default defineComponent({
  name: 'GuildPageSettingsModeration',

  setup() {
    const guild = useGuildStore()

    return { guild, localeStringsMap }
  },

  data() {
    return {
      toggle: true,
      select: [],
      automoderTypes: [
        { name: 'anti_caps', icon: lowerCaseImg },
        { name: 'links_filter', icon: unlinkImg },
        { name: 'newbies', icon: newbieImg },
        { name: 'nicknames', icon: tagsImg },
        { name: 'swear_filter', icon: profanityImg },
        { name: 'users_slowdown', icon: slowdownImg }
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
