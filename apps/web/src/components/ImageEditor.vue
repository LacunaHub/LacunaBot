<template>
  <div v-if="showToggle" class="q-pa-md">
    <q-list class="bg-dark-2 overflow-hidden rounded-borders">
      <q-item tag="label">
        <q-item-section side>
          <q-toggle v-model="image.active" dense></q-toggle>
        </q-item-section>

        <q-item-section>
          <q-item-label>
            {{ $t('Components.ImageEditor.SendImage') }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>

  <q-card-section>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card class="bg-transparent" flat>
          <q-card-section ref="imageCanvasParent" class="flex flex-center q-pa-none">
            <div
              :class="`rounded-borders relative-position image-canvas ${disable ? 'disabled' : ''} bordered-block`"
              :style="{
                height: `${image.height}px`,
                width: `${image.width}px`,
                backgroundColor: image.background.color,
                overflow: 'hidden',
                zoom: Math.min(icpWidth / image.width, 1)
              }"
            >
              <q-img
                v-if="image.background.url"
                class="rounded-borders absolute"
                :src="image.background.url"
                :style="{
                  height: `${image.height}px`,
                  width: `${image.width}px`,
                  maxHeight: '100%',
                  maxWidth: '100%'
                }"
              >
                <template #error>
                  <div class="absolute-full flex flex-center bg-grey-10 text-grey-8 text-center text-italic">
                    Image background
                  </div>
                </template>
              </q-img>

              <VueDragResize
                v-for="(element, i) in image.elements"
                :key="element.id"
                :isDraggable="!disable"
                :isResizable="!disable"
                :x="element.posX"
                :y="element.posY"
                :h="element.height"
                :w="element.width"
                :parentLimitation="false"
                :snap-to-grid="false"
                :gridX="20"
                :gridY="20"
                :id="`image-element-${i}`"
                class="absolute"
                :style="{
                  zIndex: image.elements.length - i,
                  cursor: 'move',
                  textAlign: element.align ?? ''
                }"
                @dragging="data => onDragResize(i, data)"
                @resizing="data => onDragResize(i, data)"
              >
                <div v-if="element.type === 'TEXT'" :style="{ overflow: 'hidden' }">
                  <span
                    :class="`text-${element.size}`"
                    :style="{
                      display: 'inline-block',
                      color: element.color,
                      fontStyle: element.style,
                      textTransform: element.transform,
                      textDecoration: element.decoration,
                      whiteSpace: 'nowrap',
                      lineHeight: 'normal'
                    }"
                  >
                    {{ element.value }}
                  </span>
                </div>

                <q-img
                  v-if="element.type === 'IMAGE'"
                  :src="element.url"
                  :style="{
                    height: `${element.height}px`,
                    width: `${element.width}px`,
                    borderRadius: `${imageBorders[element.border_radius]}`
                  }"
                >
                  <div
                    v-if="!element.url"
                    class="absolute-full flex flex-center bg-grey-8 text-grey-6 text-center text-italic"
                  >
                    Image
                  </div>

                  <template #error>
                    <div class="absolute-full flex flex-center bg-grey-8 text-grey-6 text-center text-italic">
                      Image
                    </div>
                  </template>
                </q-img>
              </VueDragResize>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12">
        <div class="row q-col-gutter-md">
          <div v-if="canvasResizable" class="col-12 col-md-6">
            <div>
              {{ $t('Components.ImageEditor.ImageHeight') }}
            </div>

            <q-select
              v-model.number="image.height"
              :options="[256, 512, 720, 1080, 1920]"
              :disable="disable"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
            ></q-select>
          </div>

          <div v-if="canvasResizable" class="col-12 col-md-6">
            <div>
              {{ $t('Components.ImageEditor.ImageWidth') }}
            </div>

            <q-select
              v-model.number="image.width"
              :options="[256, 512, 720, 1080, 1920]"
              :disable="disable"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
            ></q-select>
          </div>

          <div class="col-12 col-md-6">
            <div>
              {{ $t('Components.ImageEditor.ImageBackgroundColor') }}
            </div>

            <q-input
              :model-value="image.background.color"
              :disable="disable"
              class="q-pt-sm"
              readonly
              filled
              dense
              hide-bottom-space
            >
              <q-popup-proxy>
                <q-color
                  v-model="image.background.color"
                  class="bg-dark-2"
                  no-header
                  flat
                  no-header-tabs
                  format-model="rgba"
                ></q-color>
              </q-popup-proxy>

              <template v-slot:append>
                <q-icon
                  v-if="image.background.color"
                  name="cancel"
                  @click.stop="image.background.color = null"
                  class="cursor-pointer q-field__focusable-action"
                />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <div>
              {{ $t('Components.ImageEditor.ImageBackgroundURL') }}

              <q-icon name="info" class="text--secondary cursor-pointer">
                <q-tooltip
                  class="bg-black text-body2"
                  anchor="top middle"
                  self="bottom middle"
                  transition-show=""
                  transition-hide=""
                >
                  {{ $t('Components.AutoMod.LinksFilterAllowedRegistry') }}

                  <ul class="q-mb-none">
                    <li v-for="host in allowedImageHosts" :key="host">
                      {{ host }}
                    </li>
                  </ul>
                </q-tooltip>
              </q-icon>
            </div>

            <q-input
              v-model.trim="image.background.url"
              :disable="disable"
              type="url"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>
        </div>
      </div>
    </div>
  </q-card-section>

  <div class="q-pa-md">
    <q-list class="bg-dark-2 overflow-hidden rounded-borders">
      <q-expansion-item expand-separator :label="$t('Components.ImageEditor.ImageElements')">
        <q-card class="bg-dark-1 no-border-radius" bordered>
          <div v-if="image.elements.length" class="q-pa-md">
            <q-list class="bg-dark-2 overflow-hidden rounded-borders">
              <q-expansion-item
                v-for="(element, i) in image.elements"
                :key="element.id"
                :label="$t(`Components.ImageEditor.${element.type === 'IMAGE' ? 'Image' : 'Text'}`)"
              >
                <q-card class="bg-dark-1 no-border-radius" bordered>
                  <q-card-section>
                    <div class="row q-col-gutter-md">
                      <div :class="`col-12 col-md-shrink flex ${$q.screen.gt.sm ? 'column' : ''} justify-between`">
                        <q-btn
                          :disable="disable"
                          icon="arrow_upward"
                          flat
                          no-caps
                          unelevated
                          @click="setElementPosition(i)"
                        ></q-btn>

                        <q-btn
                          :disable="disable"
                          icon="close"
                          color="negative"
                          flat
                          no-caps
                          unelevated
                          @click="removeElement(i)"
                        ></q-btn>

                        <q-btn
                          :disable="disable"
                          icon="arrow_downward"
                          flat
                          no-caps
                          unelevated
                          @click="setElementPosition(i, false)"
                        ></q-btn>
                      </div>

                      <div class="col">
                        <div class="row q-col-gutter-md">
                          <div class="col-12 col-md-6">
                            <div>
                              {{ $t('Components.ImageEditor.PositionCoordinate', { XY: 'X' }) }}
                            </div>

                            <q-input
                              v-model.number="element.posX"
                              :disable="disable"
                              class="q-pt-sm"
                              type="number"
                              filled
                              dense
                              hide-bottom-space
                            ></q-input>
                          </div>

                          <div class="col-12 col-md-6">
                            <div>
                              {{ $t('Components.ImageEditor.PositionCoordinate', { XY: 'Y' }) }}
                            </div>

                            <q-input
                              v-model.number="element.posY"
                              :disable="disable"
                              class="q-pt-sm"
                              type="number"
                              filled
                              dense
                              hide-bottom-space
                            ></q-input>
                          </div>

                          <div class="col-12 col-md-6">
                            <div>
                              {{ $t('Components.ImageEditor.Height') }}
                            </div>

                            <q-input
                              v-model.number="element.height"
                              :disable="disable"
                              class="q-pt-sm"
                              type="number"
                              filled
                              dense
                              hide-bottom-space
                            ></q-input>
                          </div>

                          <div class="col-12 col-md-6">
                            <div>
                              {{ $t('Components.ImageEditor.Width') }}
                            </div>

                            <q-input
                              v-model.number="element.width"
                              :disable="disable"
                              class="q-pt-sm"
                              type="number"
                              filled
                              dense
                              hide-bottom-space
                            ></q-input>
                          </div>

                          <div v-if="element.type === 'TEXT'" class="col-12">
                            <div class="row q-col-gutter-md">
                              <div class="col-12">
                                <div>
                                  {{ $t('Components.ImageEditor.Text') }}
                                </div>

                                <q-input
                                  v-model.trim="element.value"
                                  :disable="disable"
                                  class="q-pt-sm"
                                  :maxlength="1024"
                                  filled
                                  dense
                                  hide-bottom-space
                                ></q-input>
                              </div>

                              <div class="col-12 col-md-6">
                                <div>
                                  {{ $t('Components.ImageEditor.TextColor') }}
                                </div>

                                <q-input
                                  :model-value="element.color"
                                  :disable="disable"
                                  class="q-pt-sm"
                                  readonly
                                  filled
                                  dense
                                  hide-bottom-space
                                >
                                  <q-popup-proxy>
                                    <q-color
                                      v-model="element.color"
                                      class="bg-dark-2"
                                      no-header
                                      flat
                                      no-header-tabs
                                      format-model="rgba"
                                    ></q-color>
                                  </q-popup-proxy>
                                </q-input>
                              </div>

                              <div class="col-12 col-md-6">
                                <div>
                                  {{ $t('Components.ImageEditor.TextSize') }}
                                </div>

                                <q-select
                                  v-model="element.size"
                                  :options="Object.keys(localeStringsMap.textSizes)"
                                  :disable="disable"
                                  class="q-pt-sm"
                                  filled
                                  dense
                                  hide-bottom-space
                                >
                                  <template #selected-item="{ opt }">
                                    <span>{{ $t(localeStringsMap.textSizes[opt]) }} ({{ opt }})</span>
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
                                          {{ $t(localeStringsMap.textSizes[opt]) }} ({{ opt }})
                                        </q-item-label>
                                      </q-item-section>
                                    </q-item>
                                  </template>
                                </q-select>
                              </div>

                              <div class="col-12 col-md-6">
                                <div>
                                  {{ $t('Components.ImageEditor.TextStyle') }}
                                </div>

                                <q-select
                                  v-model="element.style"
                                  :options="['normal', 'italic']"
                                  :disable="disable"
                                  class="q-pt-sm"
                                  filled
                                  dense
                                  hide-bottom-space
                                >
                                  <template #selected-item="{ opt }">
                                    <span>
                                      {{ $t(localeStringsMap.textStyles[opt]) }}
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
                                          {{ $t(localeStringsMap.textStyles[opt]) }}
                                        </q-item-label>
                                      </q-item-section>
                                    </q-item>
                                  </template>
                                </q-select>
                              </div>

                              <div class="col-12 col-md-6">
                                <div>
                                  {{ $t('Components.ImageEditor.TextTransform') }}
                                </div>

                                <q-select
                                  v-model="element.transform"
                                  :options="['none', 'capitalize', 'uppercase', 'lowercase']"
                                  :disable="disable"
                                  class="q-pt-sm"
                                  filled
                                  dense
                                  hide-bottom-space
                                >
                                  <template #selected-item="{ opt }">
                                    <span>
                                      {{ $t(localeStringsMap.textTransforms[opt]) }}
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
                                          {{ $t(localeStringsMap.textTransforms[opt]) }}
                                        </q-item-label>
                                      </q-item-section>
                                    </q-item>
                                  </template>
                                </q-select>
                              </div>

                              <div class="col-12 col-md-6">
                                <div>
                                  {{ $t('Components.ImageEditor.TextDecoration') }}
                                </div>

                                <q-select
                                  v-model="element.decoration"
                                  :options="['none', 'underline', 'line-through']"
                                  :disable="disable"
                                  class="q-pt-sm"
                                  filled
                                  dense
                                  hide-bottom-space
                                >
                                  <template #selected-item="{ opt }">
                                    <span>
                                      {{ $t(localeStringsMap.textDecorations[opt]) }}
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
                                          {{ $t(localeStringsMap.textDecorations[opt]) }}
                                        </q-item-label>
                                      </q-item-section>
                                    </q-item>
                                  </template>
                                </q-select>
                              </div>

                              <div class="col-12 col-md-6">
                                <div>
                                  {{ $t('Components.ImageEditor.TextAlign') }}
                                </div>

                                <q-select
                                  v-model="element.align"
                                  :options="['center', 'start', 'end']"
                                  :disable="disable"
                                  class="q-pt-sm"
                                  filled
                                  dense
                                  hide-bottom-space
                                >
                                  <template #selected-item="{ opt }">
                                    <span>
                                      {{ $t(localeStringsMap.textAligns[opt]) }}
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
                                          {{ $t(localeStringsMap.textAligns[opt]) }}
                                        </q-item-label>
                                      </q-item-section>
                                    </q-item>
                                  </template>
                                </q-select>
                              </div>
                            </div>
                          </div>

                          <div v-if="element.type === 'IMAGE'" class="col-12">
                            <div class="row q-col-gutter-md">
                              <div class="col-12 col-md-6">
                                <div>
                                  {{ $t('Components.ImageEditor.ImageURL') }}

                                  <q-icon name="info" class="text--secondary cursor-pointer">
                                    <q-tooltip
                                      class="bg-black text-body2"
                                      anchor="top middle"
                                      self="bottom middle"
                                      transition-show=""
                                      transition-hide=""
                                    >
                                      {{ $t('Components.AutoMod.LinksFilterAllowedRegistry') }}

                                      <ul class="q-mb-none">
                                        <li v-for="host in allowedImageHosts" :key="host">
                                          {{ host }}
                                        </li>
                                      </ul>
                                    </q-tooltip>
                                  </q-icon>
                                </div>

                                <q-input
                                  v-model.trim="element.url"
                                  :disable="disable"
                                  type="url"
                                  class="q-pt-sm"
                                  filled
                                  dense
                                  hide-bottom-space
                                ></q-input>
                              </div>

                              <div class="col-12 col-md-6">
                                <div>
                                  {{ $t('Components.ImageEditor.BorderRadius') }}
                                </div>

                                <q-select
                                  v-model="element.border_radius"
                                  :options="Object.keys(imageBorders)"
                                  :disable="disable"
                                  class="q-pt-sm"
                                  filled
                                  dense
                                  hide-bottom-space
                                >
                                  <template #selected-item="{ opt }">
                                    <span>
                                      {{ $t(localeStringsMap.borderRadiuses[opt]) }}
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
                                          {{ $t(localeStringsMap.borderRadiuses[opt]) }}
                                        </q-item-label>
                                      </q-item-section>
                                    </q-item>
                                  </template>
                                </q-select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </q-list>
          </div>

          <q-card-section v-if="image.elements.length <= 50">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-btn-dropdown class="full-width dashed-border" icon="add" flat :disable="disable">
                  <q-list>
                    <q-item
                      clickable
                      v-close-popup
                      @click="
                        !guild.premium.available && image.elements.length >= 5
                          ? lacunaDiamondDialog()
                          : addElement('IMAGE')
                      "
                    >
                      <q-item-section>
                        <q-item-label>
                          {{ $t('Components.ImageEditor.Image') }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      clickable
                      v-close-popup
                      @click="
                        !guild.premium.available && image.elements.length >= 5
                          ? lacunaDiamondDialog()
                          : addElement('TEXT')
                      "
                    >
                      <q-item-section>
                        <q-item-label>
                          {{ $t('Components.ImageEditor.Text') }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item v-if="image.elements.length === 0" clickable v-close-popup @click="addSampleImageElements">
                      <q-item-section>
                        <q-item-label>
                          {{ $t('Components.ImageEditor.AddSampleImageElements') }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script setup>
import { useElementSize } from '@vueuse/core'
import { useQuasar } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { allowedImageHosts, localeStringsMap } from 'src/utils/Constants'
import { suid } from 'src/utils/Utils'
import { computed, ref, watch } from 'vue'
import VueDragResize from 'vue-drag-resize/src/components/vue-drag-resize.vue'
import LacunaDiamond from './dialogs/LacunaDiamond.vue'

const props = defineProps({
  image: {
    type: Object,
    required: true
  },
  disable: {
    type: Boolean,
    default: false
  },
  showToggle: {
    type: Boolean,
    default: true
  },
  canvasResizable: {
    type: Boolean,
    default: true
  },
  canvasHeight: {
    type: Number,
    default: 256
  },
  canvasWidth: {
    type: Number,
    default: 720
  }
})
const emit = defineEmits(['change'])

const $q = useQuasar()
const guild = useGuildStore()

const imageCanvasParent = ref(null),
  { width: icpWidth } = useElementSize(imageCanvasParent)

const image = ref({
  active: false,
  height: props.canvasHeight,
  width: props.canvasWidth,
  background: {
    color: 'rgba(15,15,18,1)',
    url: null
  },
  elements: [],
  ...JSON.parse(JSON.stringify(props.image))
})

const disable = computed(() => {
  return props.disable || !image.value.active
})

const imageBorders = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '32px',
  circle: '999px'
}

const onDragResize = (index, { left, top, height, width }) => {
  const element = image.value.elements.at(index)

  if (left > 9999 || left < -9999) {
    left = 0
  }

  if (top > 9999 || top < -9999) {
    top = 0
  }

  if (height > 9999 || height < -9999) {
    height = 0
  }

  if (width > 9999 || width < -9999) {
    width = 0
  }

  element.posX = left
  element.posY = top

  if (element.type === 'IMAGE' && element.border_radius === 'circle') {
    const min = Math.min(height, width)

    element.height = min
    element.width = min
  } else {
    element.height = height
    element.width = width
  }
}

const setElementPosition = (from, upward = true) => {
  const element = image.value.elements[from]
  let position = upward ? from - 1 : from + 1

  if (position < 0) position = image.value.elements.length - 1
  else if (position > image.value.elements.length - 1) position = 0

  image.value.elements.splice(from, 1)
  image.value.elements.splice(position, 0, element)
}

const addElement = type => {
    if (image.value.elements.length >= 5 && !guild.premium.available) return null
    if (image.value.elements.length >= 50) return null

    const element = {
      id: suid(6),
      type: type,
      posX: 0,
      posY: 0,
      height: 64,
      width: 64
    }

    if (type === 'IMAGE') {
      element.url = null
      element.border_radius = 'none'
    }

    if (type === 'TEXT') {
      element.value = 'Text'
      element.color = 'rgba(255,255,255,1)'
      element.size = 'body2'
      element.style = 'normal'
      element.transform = 'none'
      element.decoration = 'none'
      element.align = 'center'
    }

    image.value.elements.push(element)
  },
  addSampleImageElements = () => {
    if (image.value.elements.length > 0) return null

    image.value.height = props.canvasHeight
    image.value.width = props.canvasWidth

    image.value.elements.push(
      {
        id: suid(6),
        type: 'IMAGE',
        posX: 310,
        posY: 30,
        height: 100,
        width: 100,
        url: '{member.avatar}',
        border_radius: 'circle'
      },
      {
        id: suid(6),
        type: 'TEXT',
        posX: 275,
        posY: 140,
        height: 50,
        width: 170,
        value: '{member.username}',
        color: 'rgba(0,157,255,1)',
        size: 'body2',
        style: 'normal',
        transform: 'uppercase',
        decoration: 'underline',
        align: 'center'
      },
      {
        id: suid(6),
        type: 'TEXT',
        posX: 140,
        posY: 165,
        height: 50,
        width: 440,
        value: 'Lorem Ipsum',
        color: 'rgba(255,255,255,1)',
        size: 'h5',
        style: 'normal',
        transform: 'uppercase',
        decoration: 'none',
        align: 'center'
      },
      {
        id: suid(6),
        type: 'TEXT',
        posX: 275,
        posY: 195,
        height: 50,
        width: 170,
        value: '{guild.name}',
        color: 'rgba(255,0,0,1)',
        size: 'h6',
        style: 'normal',
        transform: 'uppercase',
        decoration: 'underline',
        align: 'center'
      }
    )
  }

const removeElement = index => {
  image.value.elements.splice(index, 1)
}

const lacunaDiamondDialog = () => {
  return $q.dialog({
    component: LacunaDiamond
  })
}

watch(
  () => image.value,
  value => {
    emit('change', value)
  },
  { deep: true }
)
</script>
