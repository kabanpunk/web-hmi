<template>
  <div class="flex h-screen">
    <LeftSidebar
        class="w-64"
        :addShape="addShape"
        :removeSelected="removeSelected"
        :addPolygon="addPolygon"
        @toggleEdit="toggleEdit"
        @startDrawingPolygon="startDrawingPolygon"
    />
    <CanvasComponent class="flex-grow" ref="canvasComponent" />
    <RightSidebar class="w-64"/>
  </div>
</template>

<script>
import LeftSidebar from './components/LeftSidebar.vue';
import CanvasComponent from './components/CanvasComponent.vue';
import RightSidebar from './components/RightSidebar.vue';

export default {
  name: 'App',
  components: {
    LeftSidebar,
    CanvasComponent,
    RightSidebar
  },
  methods: {
    addShape() {
      this.$refs.canvasComponent.addShape();
    },
    removeSelected() {
      this.$refs.canvasComponent.removeSelected();
    },
    addPolygon() {
      this.$refs.canvasComponent.addPolygon();
    },
    toggleEdit() {
      this.$refs.canvasComponent.editPolygon();
    },
    startDrawingPolygon() {
      this.$refs.canvasComponent.startDrawingPolygon();
    },
  }
}
</script>
