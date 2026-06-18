<template>
  <div class="row" :class="{ fullscreen: scriptEditorFullscreen }">
    <div class="col-12">
      <q-toolbar class="bg-dark-2 rounded-t-lg bordered-block q-pl-none">
        <q-tabs
          v-model="scriptEditorIndex"
          class="bg-dark-2"
          active-class="script--active"
          no-caps
          indicator-color="transparent"
          mobile-arrows
          shrink
          stretch
          align="left"
        >
          <q-tab v-for="(script, i) in scripts" :key="i" :label="script.name || ('00' + (i + 1)).slice(-3)" :name="i">
            <q-badge v-if="i > 0 && !guild.premium.available" floating color="warning">
              <q-tooltip class="bg-black text-body2" transition-show="" transition-hide="">
                {{ i18n.t('Components.ScriptEditor.MaxNumberOfScriptsReached') }}
              </q-tooltip>
            </q-badge>
          </q-tab>
        </q-tabs>

        <q-space></q-space>

        <!-- <q-btn-toggle
          v-model="scripts[scriptEditorIndex].language"
          class="bordered-block"
          toggle-color="primary"
          :options="[
            { icon: 'r_javascript', value: 1, slot: 'js' },
            { icon: 'r_bolt', value: 2, slot: 'lig' }
          ]"
          unelevated
          dense
        >
          <template v-slot:js>
            <q-tooltip class="bg-black text-body2" transition-show="" transition-hide="">JavaScript</q-tooltip>
          </template>

          <template v-slot:lig>
            <q-tooltip class="bg-black text-body2" transition-show="" transition-hide="">Lighthon</q-tooltip>
          </template>
        </q-btn-toggle>

        <q-separator class="q-mx-sm" vertical inset></q-separator> -->

        <q-btn
          v-if="scripts.length < MAX_SCRIPTS_PREMIUM"
          icon="r_note_add"
          unelevated
          dense
          @click="addScript"
        ></q-btn>

        <q-btn
          :disable="scripts.length < 2"
          icon="r_delete"
          color="negative"
          flat
          unelevated
          dense
          @click="deleteScript"
        ></q-btn>

        <q-separator class="q-mx-sm" vertical inset></q-separator>

        <q-btn
          :icon="scriptEditorFullscreen ? 'fullscreen_exit' : 'r_fullscreen'"
          unelevated
          dense
          @click="scriptEditorFullscreen = !scriptEditorFullscreen"
        ></q-btn>
      </q-toolbar>
    </div>

    <div class="col-12">
      <vue-monaco-editor
        v-model:value="scripts[scriptEditorIndex].code"
        theme="vs-dark"
        :height="scriptEditorFullscreen ? '100%' : '300px'"
        :language="scriptEditorLanguage"
        :options="{
          fixedOverflowWidgets: true,
          tabSize: 2,
          minimap: {
            enabled: false
          },
          padding: {
            top: 16
          },
          value: scripts[scriptEditorIndex].code
        }"
      ></vue-monaco-editor>
    </div>

    <div class="col-12">
      <q-toolbar class="bg-dark-2 rounded-b-lg bordered-block">
        <q-space></q-space>

        <span class="text-caption text--secondary">
          <span :class="{ 'text-negative': scriptEditorScriptSizeExceeded }">
            {{ numbro(scripts[scriptEditorIndex].code.length).format({ thousandSeparated: true }) }}
          </span>
          <span class="q-mx-xs">/</span>
          <span>
            {{ numbro(scriptEditorMaxScriptSize).format({ thousandSeparated: true }) }}
          </span>
        </span>
      </q-toolbar>
    </div>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { numbro } from 'src/boot/numbro'
import { useGuildStore } from 'src/stores/guild'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LacunaDiamond from '../dialogs/LacunaDiamond.vue'

const props = defineProps({
  scriptsProp: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['change'])

const $q = useQuasar(),
  i18n = useI18n()
const guild = useGuildStore()
const scripts = ref([...props.scriptsProp])

const MAX_SCRIPTS = 1,
  MAX_SCRIPTS_PREMIUM = 10
const MAX_SCRIPT_SIZE = 2000,
  MAX_SCRIPT_SIZE_PREMIUM = 20_000

const scriptEditorIndex = ref(0),
  scriptEditorFullscreen = ref(false),
  scriptEditorLanguage = computed(() => {
    const lang = scripts.value[scriptEditorIndex.value].language

    if (lang === 2) return 'lighthon'
    return 'javascript'
  }),
  scriptEditorMaxScripts = computed(() => {
    return guild.premium.available ? MAX_SCRIPTS_PREMIUM : MAX_SCRIPTS
  }),
  scriptEditorMaxScriptSize = computed(() => {
    return guild.premium.available ? MAX_SCRIPT_SIZE_PREMIUM : MAX_SCRIPT_SIZE
  }),
  scriptEditorScriptSizeExceeded = computed(() => {
    const scriptSize = scripts.value[scriptEditorIndex.value].code.length
    return scriptSize > scriptEditorMaxScriptSize.value
  })

const addScript = () => {
    if (scripts.value.length >= MAX_SCRIPTS && !guild.premium.available) return lacunaDiamondDialog()
    if (scripts.value.length >= scriptEditorMaxScripts.value) return null

    return $q
      .dialog({
        class: 'bg-dark-1 no-shadow',
        transitionShow: 'jump-down',
        transitionHide: 'jump-up',
        message: i18n.t('Components.ScriptEditor.ScriptName'),
        isValid: val => val.length <= 100,
        prompt: {
          filled: true,
          dense: true,
          hideBottomSpace: true,
          color: 'transparent'
        },
        ok: {
          color: 'primary',
          unelevated: true,
          label: i18n.t('Common.Add'),
          noCaps: true
        },
        cancel: {
          color: 'dark-1',
          unelevated: true,
          label: i18n.t('Common.Close'),
          noCaps: true
        }
      })
      .onOk(data => {
        scripts.value.push({ name: data?.slice(0, 100) || null, language: 1, code: '' })
        scriptEditorIndex.value = scripts.value.length - 1
      })
  },
  deleteScript = () => {
    if (scripts.value.length < 2) return null

    return $q
      .dialog({
        class: 'bg-dark-1 no-shadow',
        transitionShow: 'jump-down',
        transitionHide: 'jump-up',
        message: i18n.t('Components.ScriptEditor.ScriptDeleteConfirmation'),
        ok: {
          color: 'primary',
          unelevated: true,
          label: i18n.t('Common.Yes'),
          noCaps: true
        },
        cancel: {
          color: 'dark-1',
          unelevated: true,
          label: i18n.t('Common.No'),
          noCaps: true
        }
      })
      .onOk(() => {
        scripts.value.splice(scriptEditorIndex.value, 1)
        scriptEditorIndex.value = scripts.value.length - 1
      })
  }

const lacunaDiamondDialog = () => {
  return $q.dialog({
    component: LacunaDiamond
  })
}

watch(
  () => scripts.value,
  value => {
    emit('change', value)
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.script--active {
  color: $almost-white-1;
  background: $dark-3;
}

.script-size {
  margin: 30px 36px;
}
</style>
