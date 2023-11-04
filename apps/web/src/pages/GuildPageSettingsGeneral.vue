<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.gs_title') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('pages.guild.gs_locale_title') }}
              </div>

              <q-select
                v-model="guild.locale"
                :options="locales"
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
                        {{ opt.label }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>

                <template #after-options>
                  <q-separator></q-separator>

                  <q-item clickable href="https://crowdin.com/project/lacuna" target="_blank">
                    <q-item-section>
                      <q-item-label>
                        {{ $t('pages.guild.gs_translate_title') }}
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
                {{ $t('pages.guild.gs_expert_roles_title') }}
              </div>
              <div class="text--secondary">
                {{ $t('pages.guild.gs_expert_roles_description') }}
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
              {{ $t('pages.guild.gs_welcome_title') }}
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
                {{ $t('pages.guild.gs_message_format_title') }}
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
                {{ $t('pages.guild.gs_message_template_title') }}
              </div>

              <MessageEditor
                class="q-pt-sm"
                :message="guild.modules.welcome.message"
                :disable="!guild.modules.welcome.active"
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
              {{ $t('pages.guild.gs_init_roles_title') }}
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
              {{ $t('pages.guild.gs_restore_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('pages.guild.gs_restore_description') }}
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
                  {{ $t('pages.guild.gs_restore_roles_title') }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="guild.modules.restoring.restore_nicknames" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('pages.guild.gs_restore_nicknames_title') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('pages.guild.gs_restore_strict_roles_title') }}
              </div>
              <div class="text--secondary">
                {{ $t('pages.guild.gs_restore_strict_roles_description') }}
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
              {{ $t('pages.guild.gs_farewell_title') }}
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
                {{ $t('pages.guild.gs_message_format_title') }}
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
                {{ $t('pages.guild.gs_message_template_title') }}
              </div>

              <MessageEditor
                class="q-pt-sm"
                :message="guild.modules.farewell.message"
                :disable="!guild.modules.farewell.active"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import MessageEditor from 'src/components/MessageEditor.vue'
import { useGuildStore } from 'src/stores/guild'
import { availableLocales } from 'src/utils/Constants'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GuildPageSettingsGeneral',

  setup() {
    const guild = useGuildStore()

    return { guild }
  },

  components: { MessageEditor },

  data() {
    return {
      input: null,
      toggle: false,
      locales: availableLocales
    }
  }
})
</script>
