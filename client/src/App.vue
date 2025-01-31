<script setup lang='ts'>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <router-view />
</template>

<!--
  @todo: The use of the BlackChancery font gives a few warnings/errors, at least in Firefox console, such as:
  "downloadable font: hdmx: the table should not be present when bit 2 and 4 of the head->flags are not set".
  The font itself is rendering satisfactorily.
  Consider an alternative font.
-->

<style>
  @font-face
  {
    font-family: "base font";
    src: url('@/assets/fonts/blackchancery.regular.ttf');
  }
</style>
