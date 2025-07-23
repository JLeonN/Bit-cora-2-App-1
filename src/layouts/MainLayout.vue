<template>
  <div class="fondo-app texto-principal">
    <q-layout view="lHh Lpr lff">
      <q-header elevated class="bg-primario-oscuro texto-principal">
        <q-toolbar>
          <q-toolbar-title>Bitácora 2</q-toolbar-title>
          <q-btn flat @click="drawer = !drawer" round dense icon="menu" />
        </q-toolbar>
      </q-header>

      <q-drawer
        v-model="drawer"
        show-if-above
        :width="200"
        :breakpoint="400"
        class="bg-superficie texto-principal"
      >
        <q-scroll-area
          style="
            height: calc(100% - 150px);
            margin-top: 150px;
            border-right: 1px solid var(--color-borde);
          "
        >
          <q-list padding>
            <!-- Inicio -->
            <q-item clickable v-ripple to="/">
              <q-item-section avatar>
                <q-icon name="inbox" />
              </q-item-section>
              <q-item-section> Inicio </q-item-section>
            </q-item>
            <!-- Otro -->
            <q-item clickable v-ripple to="/Inicio">
              <q-item-section avatar>
                <q-icon name="send" />
              </q-item-section>
              <q-item-section> Inicio </q-item-section>
            </q-item>
            <!-- Otro 1 -->
            <q-item clickable v-ripple to="/Otro_1">
              <q-item-section avatar>
                <q-icon name="send" />
              </q-item-section>
              <q-item-section> Otro 1 </q-item-section>
            </q-item>
            <!-- Otro 2 -->
            <q-item clickable v-ripple to="/Otro_2">
              <q-item-section avatar>
                <q-icon name="drafts" />
              </q-item-section>
              <q-item-section> Otro 2 </q-item-section>
            </q-item>
            <!-- Otro 3 -->
            <q-item clickable v-ripple to="/Otro_3">
              <q-item-section avatar>
                <IconCar :stroke="1.25" size="24" />
              </q-item-section>
              <q-item-section> Otro 3 </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
        <q-img
          class="absolute-top"
          src="https://cdn.quasar.dev/img/material.png"
          style="height: 150px"
        >
          <div class="absolute-bottom bg-transparent texto-secundario">
            <q-avatar size="56px" class="q-mb-sm">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png" />
            </q-avatar>
            <div class="text-weight-bold">Bitácora 2</div>
            <div>@Bitácora 2</div>
          </div>
        </q-img>
      </q-drawer>

      <q-page-container class="fondo-app texto-principal">
        <router-view></router-view>
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IconCar } from '@tabler/icons-vue'

const drawer = ref(false)
</script>
