<template>
  <div class="bg-gray-200 h-screen p-5">
    <button
        @click="addShape"
        class="block w-full mb-2 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700">
      Добавить фигуру
    </button>
    <button
        @click="removeSelected"
        class="block w-full py-2 bg-red-500 text-white font-bold rounded hover:bg-red-700">
      Удалить выбранное
    </button>
    <button @click="addPolygon" class="block w-full mb-2 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700">
      Добавить полигон
    </button>
    <button @click="$emit('toggleEdit')" class="block w-full mb-2 py-2 bg-purple-500 text-white font-bold rounded hover:bg-purple-700">
      Редактировать полигон
    </button>
    <button @click="$emit('startDrawingPolygon')" class="...">
      Нарисовать полигон
    </button>
  </div>
</template>

<script>

export default {
  name: 'LeftSidebar',
  props: {
    addShape: Function,
    removeSelected: Function,
    addPolygon: Function,
    toggleEdit: Function,
    startDrawingPolygon: Function,
  },
  emits: ['toggleEdit', 'startDrawingPolygon'],
}
</script>
