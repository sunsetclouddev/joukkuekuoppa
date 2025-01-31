<script setup lang='ts'>

// inspiration from: https://medium.com/@romanvinnick/vue3-composition-api-creating-a-reusable-modal-component-with-outside-click-handling-43e830d289c1
// and: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_modal

const props = defineProps({ isOpen: Boolean });

const emit = defineEmits(['modal-close']);

</script>

<template>
  <div v-if="isOpen" class='modal-mask'>
    <div class='modal-container'>
      <span class='close' @click.stop="emit('modal-close')">&times;</span>
      <slot name='content'></slot>
    </div>
  </div>
</template>

<style scoped>

.modal-mask { position: fixed; z-index: 1; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); }

.modal-container
{
  width: 650px; margin: 150px auto; padding: 20px 20px; background-color: rgba(255, 255, 255, 1.0); border-radius: 2px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.close { color: rgba(200, 200, 200, 1.0); float: right; font-size: 28px; font-weight: bold; }

.close:hover, .close:focus { color: rgba(0, 0, 0, 1.0); text-decoration: none; cursor: pointer; }

</style>
