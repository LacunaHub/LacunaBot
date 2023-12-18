<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.GeneralSettings.Title') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('Pages.GuildPage.GeneralSettings.Locale') }}
              </div>

              <q-select
                v-model="guild.locale"
                :options="languages"
                option-label="name"
                option-value="code"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
              >
                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label>
                        {{ opt.name }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>

                <template #after-options>
                  <q-separator></q-separator>

                  <q-item clickable href="https://crowdin.com/project/lacuna" target="_blank">
                    <q-item-section>
                      <q-item-label>
                        {{ $t('Pages.GuildPage.GeneralSettings.Translate') }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-icon name="open_in_new"></q-icon>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12">
              <div>
                {{ $t('Pages.GuildPage.GeneralSettings.ExpertRoles') }}
              </div>
              <div class="text--secondary">
                {{ $t('Pages.GuildPage.GeneralSettings.ExpertRolesDescription') }}
              </div>

              <q-select
                v-model="guild.server.bot_expert_roles"
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
        <q-item class="q-py-md rounded-t-lg" tag="label">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.GeneralSettings.Greeting') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-toggle v-model="guild.modules.welcome.active" dense></q-toggle>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div>
                {{ $t('Pages.GuildPage.GeneralSettings.MessageFormat') }}
              </div>

              <q-select
                v-model="guild.modules.welcome.format"
                :options="['DM', 'CHANNEL']"
                :disable="!guild.modules.welcome.active"
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
                v-model="guild.modules.welcome.channel_id"
                :options="guild.channelsText"
                option-label="name"
                option-value="id"
                :disable="!guild.modules.welcome.active || guild.modules.welcome.format !== 'CHANNEL'"
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
                class="q-pt-sm"
                :message="guild.modules.welcome.message"
                :disable="!guild.modules.welcome.active"
                :disable-image="false"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md rounded-t-lg" tag="label">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.GeneralSettings.InitialRoles') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-toggle v-model="guild.modules.welcome.initial_roles.active" dense></q-toggle>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-select
                v-model="guild.modules.welcome.initial_roles.roles"
                :options="guild.rolesUnmanaged"
                option-label="name"
                option-value="id"
                :disable="!guild.modules.welcome.initial_roles.active"
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
                    :disable="opt.higher"
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
    </div>

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.GeneralSettings.Restoring') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('Pages.GuildPage.GeneralSettings.RestoringDescription') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="guild.modules.restoring.restore_roles" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Pages.GuildPage.GeneralSettings.RestoreRoles') }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="guild.modules.restoring.restore_nicknames" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Pages.GuildPage.GeneralSettings.RestoreNickname') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('Pages.GuildPage.GeneralSettings.RestoreStrictRoles') }}
              </div>
              <div class="text--secondary">
                {{ $t('Pages.GuildPage.GeneralSettings.RestoreStrictRolesDescription') }}
              </div>

              <q-select
                v-model="guild.modules.restoring.strict_roles"
                :options="guild.rolesUnmanaged"
                option-label="name"
                option-value="id"
                :disable="!guild.modules.restoring.restore_roles"
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
                    :disable="opt.higher"
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
    </div>

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md rounded-t-lg" tag="label">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.GeneralSettings.Farewell') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side avatar>
            <q-toggle v-model="guild.modules.farewell.active" dense></q-toggle>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div>
                {{ $t('Pages.GuildPage.GeneralSettings.MessageFormat') }}
              </div>

              <q-select
                v-model="guild.modules.farewell.format"
                :options="['DM', 'CHANNEL']"
                :disable="!guild.modules.farewell.active"
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
                v-model="guild.modules.farewell.channel_id"
                :options="guild.channelsText"
                option-label="name"
                option-value="id"
                :disable="!guild.modules.farewell.active || guild.modules.farewell.format !== 'CHANNEL'"
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
                class="q-pt-sm"
                :message="guild.modules.farewell.message"
                :disable="!guild.modules.farewell.active"
                :disable-image="false"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import { languages } from 'lacuna-locale'
import MessageEditor from 'src/components/MessageEditor.vue'
import { useGuildStore } from 'src/stores/guild'
import { localeStringsMap } from 'src/utils/Constants'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GuildPageSettingsGeneral',

  setup() {
    const guild = useGuildStore()

    return { guild, languages, localeStringsMap }
  },

  components: { MessageEditor },

  data() {
    return {
      input: null,
      toggle: false
    }
  }
})
</script>
