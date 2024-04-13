<template>
  <div class="h-full w-full" ref="canvasWrapper">
    <canvas id="canvas"></canvas>
  </div>
</template>

<script>
import {fabric} from 'fabric';

export default {
  name: 'CanvasComponent',
  data() {
    return {
      isDrawingPolygon: false,
      polygonPoints: [],
      tempLine: null,
      tempPolygon: null,
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initializeCanvas();
    });
  },
  methods: {
    initializeCanvas() {
      const wrapper = this.$refs.canvasWrapper;
      const width = wrapper.offsetWidth;
      const height = wrapper.offsetHeight;

      this.canvas = new fabric.Canvas('canvas', {
        width,
        height,
      });

      this.canvas.on('mouse:down', (options) => this.handleMouseDown(options));
      document.addEventListener('contextmenu', this.handleContextMenu);
    },
    addShape() {
      const circle = new fabric.Circle({
        radius: 20,
        fill: 'green',
        left: 100,
        top: 100,
      });
      this.canvas.add(circle);
    },
    removeSelected() {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject) {
        this.canvas.remove(activeObject);
      }
    },
    addPolygon() {
      // Точки и создание полигона аналогично вашему примеру
      var points = [{
        x: 50, y: 50
      }, {
        x: 50, y: 100
      }, {
        x: 100, y: 100
      }, {
        x: 100, y: 50
      }];

      var polygon = new fabric.Polygon(points, {
        stroke: 'red',
        fill: 'rgba(255,0,0,0.5)',
        objectCaching: false,
        transparentCorners: false,
        cornerColor: 'blue',
      });
      this.canvas.add(polygon);
    },

    editPolygon() {
      const polygon = this.canvas.getActiveObject();
      if (!polygon || polygon.type !== 'polygon') {
        console.error('Не выбран полигон для редактирования');
        return;
      }

      polygon.edit = !polygon.edit;

      if (polygon.edit) {
        const lastControl = polygon.points.length - 1;
        polygon.cornerStyle = 'circle';
        polygon.cornerColor = 'rgba(0,0,255,0.5)';


        polygon.controls = polygon.points.reduce((acc, point, index) => {
          const pointIndex = index;
          acc['p' + pointIndex] = new fabric.Control({
            positionHandler: (dim, finalMatrix, fabricObject) => {
              return this.polygonPositionHandler(pointIndex, dim, finalMatrix, fabricObject);
            },
            actionHandler: this.anchorWrapper(index > 0 ? index - 1 : lastControl, this.actionHandler),
            actionName: 'modifyPolygon',
            pointIndex: pointIndex,
          });
          return acc;
        }, {});
      } else {
        polygon.cornerColor = 'blue';
        polygon.cornerStyle = 'rect';
        polygon.controls = fabric.Object.prototype.controls;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        polygon.points.forEach((point) => {
          if (point.x < minX) minX = point.x;
          if (point.y < minY) minY = point.y;
          if (point.x > maxX) maxX = point.x;
          if (point.y > maxY) maxY = point.y;
        });

        const width = maxX - minX;
        const height = maxY - minY;

        polygon.set({
          width: width,
          height: height,
          pathOffset: new fabric.Point(minX + width / 2, minY + height / 2)
        });

        polygon.setCoords();
        this.canvas.requestRenderAll();
      }
      polygon.hasBorders = !polygon.edit;
      this.canvas.requestRenderAll();
    },

    polygonPositionHandler(pointIndex, dim, finalMatrix, fabricObject) {
      const point = fabricObject.points[pointIndex];
      const x = point.x - fabricObject.pathOffset.x;
      const y = point.y - fabricObject.pathOffset.y;
      return fabric.util.transformPoint(
          {x, y}, fabric.util.multiplyTransformMatrices(
              fabricObject.canvas.viewportTransform,
              fabricObject.calcTransformMatrix()
          )
      );
    },

    actionHandler(eventData, transform, x, y) {
      const polygon = transform.target,
          currentControl = polygon.controls[polygon.__corner],
          mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center'),
          polygonBaseSize = this.getObjectSizeWithStroke(polygon),
          size = polygon._getTransformedDimensions(0, 0),
          finalPointPosition = {
            x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
            y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
          };
      console.log("Действие обработчика для контрола:", currentControl, finalPointPosition);
      polygon.points[currentControl.pointIndex] = finalPointPosition;
      return true;
    },

    anchorWrapper(anchorIndex, fn) {
      return function (eventData, transform, x, y) {
        const fabricObject = transform.target;
        console.log("Обёртка якоря для точки:", anchorIndex);
        const actionPerformed = fn.call(this, eventData, transform, x, y);
        console.log("Действие выполнено:", actionPerformed);
        return actionPerformed;
      }.bind(this);
    },

    getObjectSizeWithStroke(object) {
      const stroke = new fabric.Point(
          object.strokeUniform ? 1 / object.scaleX : 1,
          object.strokeUniform ? 1 / object.scaleY : 1
      ).multiply(object.strokeWidth);
      const sizeWithStroke = new fabric.Point(object.width + stroke.x, object.height + stroke.y);
      console.log("Размер объекта со штрихом:", sizeWithStroke);
      return sizeWithStroke;
    },

    startDrawingPolygon() {
      this.isDrawingPolygon = true;
      this.polygonPoints = [];
      if (this.tempPolygon) {
        this.canvas.remove(this.tempPolygon);
      }
      if (this.tempLine) {
        this.canvas.remove(this.tempLine);
      }
      this.tempPolygon = null;
      this.tempLine = null;
    },
    handleMouseDown(options) {
      if (!this.isDrawingPolygon) return;
      const pointer = this.canvas.getPointer(options.e);
      this.polygonPoints.push({x: pointer.x, y: pointer.y});

      if (this.polygonPoints.length > 1) {
        // Рисуем временную линию между последними двумя точками
        if (this.tempLine) {
          this.canvas.remove(this.tempLine);
        }
        const [lastPoint, secondLastPoint] = this.polygonPoints.slice(-2);
        this.tempLine = new fabric.Line([secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y], {
          stroke: 'red',
          selectable: false,
          evented: false,
        });
        this.canvas.add(this.tempLine);
      }

      // Обновляем временный полигон
      if (this.tempPolygon) {
        this.canvas.remove(this.tempPolygon);
      }
      if (this.polygonPoints.length > 2) {
        this.tempPolygon = new fabric.Polygon(this.polygonPoints, {
          stroke: 'red',
          fill: 'rgba(255,0,0,0.3)',
          selectable: false,
          evented: false,
        });
        this.canvas.add(this.tempPolygon);
      }

      this.canvas.renderAll();
    },
    handleContextMenu(event) {
      event.preventDefault();


      if (this.isDrawingPolygon) {
        if (this.polygonPoints.length < 3) return;

        this.isDrawingPolygon = false;
        this.canvas.remove(this.tempLine);
        this.canvas.remove(this.tempPolygon);

        var polygon = new fabric.Polygon(this.polygonPoints, {
          stroke: 'red',
          fill: 'rgba(255,0,0,0.5)',
          objectCaching: false,
          transparentCorners: false,
          cornerColor: 'blue',
        });
        this.canvas.add(polygon);

        this.polygonPoints = [];
        this.tempLine = null;
        this.tempPolygon = null;
        this.canvas.renderAll();

      } else if (this.canvas.getActiveObject() && this.canvas.getActiveObject().type === 'polygon' && this.canvas.getActiveObject().edit) {
        console.log("Добавление новой точки к активному полигону");
        this.addPointToPolygon(event);
      }
    },

    addPointToPolygon(event) {
      const pointer = this.canvas.getPointer(event);
      const polygon = this.canvas.getActiveObject();

      polygon.points.push({x: pointer.x - polygon.left, y: pointer.y - polygon.top });

      this.canvas.remove(polygon);
      const newPolygon = new fabric.Polygon(polygon.points, {
        ...polygon.toObject(),
        objectCaching: false,
        transparentCorners: false,
      });
      newPolygon.edit = true;

      const lastControl = newPolygon.points.length - 1;
      newPolygon.cornerStyle = 'circle';
      newPolygon.cornerColor = 'rgba(0,0,255,0.5)';


      newPolygon.controls = newPolygon.points.reduce((acc, point, index) => {
        const pointIndex = index;
        acc['p' + pointIndex] = new fabric.Control({
          positionHandler: (dim, finalMatrix, fabricObject) => {
            return this.polygonPositionHandler(pointIndex, dim, finalMatrix, fabricObject);
          },
          actionHandler: this.anchorWrapper(index > 0 ? index - 1 : lastControl, this.actionHandler),
          actionName: 'modifyPolygon',
          pointIndex: pointIndex,
        });
        return acc;
      }, {});


      this.canvas.add(newPolygon);
      this.canvas.setActiveObject(newPolygon);

      this.canvas.requestRenderAll();
    },

    getAbsolutePoint(polygon, point) {
      return {
        x: polygon.left + point.x * polygon.scaleX,
        y: polygon.top + point.y * polygon.scaleY
      };
    },

    distanceToLine(point, lineStart, lineEnd) {
      const A = point.x - lineStart.x;
      const B = point.y - lineStart.y;
      const C = lineEnd.x - lineStart.x;
      const D = lineEnd.y - lineStart.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      const param = lenSq !== 0 ? dot / lenSq : -1;

      let xx, yy;

      if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
      } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
      } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
      }

      const dx = point.x - xx;
      const dy = point.y - yy;
      return Math.sqrt(dx * dx + dy * dy);
    },


  },
  beforeDestroy() {
    document.removeEventListener('contextmenu', this.handleContextMenu);
  },
}
</script>