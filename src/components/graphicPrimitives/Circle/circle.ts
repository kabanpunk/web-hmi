import {fabric} from 'fabric';
import {globalVariableStore} from "@/store/index.js";
import {watch} from "vue";

export class CircleShape extends fabric.Circle {
    private canvas: any;
    private dynamicFunction: Function | null = null;
    private blocklyWorkspace: any = null;


    constructor(canvas: any, x: number, y: number) {
        super({
            radius: 30,
            fill: 'rgba(255, 0, 0, 0)',
            stroke: 'rgba(0, 0, 0, 1)',
            strokeWidth: 1,
            strokeUniform: true,
            left: x,
            top: y,
        });
        this.canvas = canvas;
        this.canvas.add(this);
        this.canvas.requestRenderAll();

        watch(() => globalVariableStore.getters['GET_GLOBAL_VARIABLES'], (newVal, oldVal) => {
            if (this.dynamicFunction) {
                let params = this.simplifyParams(newVal);
                const result = this.dynamicFunction(params);

                for (const key in result) {
                    const value = result[key];
                    if (value) {
                        this.set(key.toLowerCase(), value)
                    }
                }
                this.canvas.requestRenderAll();
            }
        }, {deep: true});
    }

    private simplifyParams(data: { [key: string]: any }): { [key: string]: any } {
        const simplified: { [key: string]: any } = {};
        for (const key in data) {
            simplified[key] = data[key].value;
        }
        return simplified;
    }

    setBlocklyWorkspace(state: any) {
        this.blocklyWorkspace = state;
    }

    getBlocklyWorkspace() {
        return this.blocklyWorkspace;
    }

    setDynamicFunction(funcCode: string) {
        this.dynamicFunction = new Function("params", funcCode);
    }
}


