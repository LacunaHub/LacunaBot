<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="guild.web_page.public_leaderboard" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ 'Публичная таблица лидеров' }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useGuildStore } from 'src/stores/guild'

const $q = useQuasar()

const guild = useGuildStore()
</script>
