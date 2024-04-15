<template>
  <div ref="blocklyArea" style="width: 100%; height: 100%;">
    <div ref="blocklyDiv" style="width: 100%; height: 450px; min-height:350px;"></div>
  </div>
</template>

<script>
import * as Blockly from 'blockly';
import * as javascript from "blockly/javascript";
import * as Ru from 'blockly/msg/ru';
import {globalVariableStore} from "@/store/index.js";

export default {
  name: 'BlocklyComponent',
  props: {
    shape: {
      type: Object,
      required: true
    },
    internalVariables: {
      type: Array,
      default: () => []
    }
  },
  data () {
  },
  mounted() {
    Blockly.setLocale(Ru);
    Blockly.setParentContainer(this.$refs.blocklyArea);

    Blockly.defineBlocksWithJsonArray([
      {
        "type": "external_variable_get",
        "message0": "%1",
        "args0": [
          {
            "type": "field_variable",
            "name": "VAR",
            "variableTypes": ["external"],
            "defaultType": "external",
            "variable": "undefined"
          }
        ],
        "output": null,
        "colour": "#4CA64C",
        "helpUrl": "%{BKY_VARIABLES_GET_HELPURL}",
        "tooltip": "%{BKY_VARIABLES_GET_TOOLTIP}",
        "extensions": ["contextMenu_variableSetterGetter"]
      },
      {
        "type": "internal_variable_set",
        "message0": "%1 = %2",
        "args0": [
          {
            "type": "field_variable",
            "name": "VAR",
            "variableTypes": ["internal"],
            "defaultType": "internal",
            "variable": "undefined"
          },
          {
            "type": "input_value",
            "name": "VALUE"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#A64C4C",
        "helpUrl": "%{BKY_VARIABLES_SET_HELPURL}",
        "tooltip": "%{BKY_VARIABLES_SET_TOOLTIP}",
        "extensions": ["contextMenu_variableSetterGetter"]
      }
    ]);



    this.workspace = Blockly.inject(this.$refs.blocklyDiv, {
      toolbox: this.createToolbox(),
      scrollbars: true,
      trashcan: true,
    });

    javascript.javascriptGenerator.forBlock['internal_variable_set'] = (block, generator) => {
      const variable_name = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
      const value = generator.valueToCode(block, 'VALUE', javascript.Order.ASSIGNMENT) || '0';
      return `${variable_name} = ${value};\n`;
    };

    javascript.javascriptGenerator.forBlock['external_variable_get'] = (block, generator) => {
      const variable_name = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
      return [`${variable_name}`, javascript.Order.ATOMIC];
    };

    const global_variables = globalVariableStore.getters['GET_GLOBAL_VARIABLES'];

    for (const variableName in global_variables) {
      if (global_variables.hasOwnProperty(variableName)) {
        this.workspace.createVariable(variableName, 'external');
      }
    }

    for (const variable of this.internalVariables) {
      this.workspace.createVariable(variable, 'internal');
    }


    const state = this.shape.getBlocklyWorkspace();
    if (state) {
      Blockly.serialization.workspaces.load(state, this.workspace);
    }
  },
  methods: {
    saveBindings() {
      let code = javascript.javascriptGenerator.workspaceToCode(this.workspace);
      console.log(code);
      console.log("-----")
      let codeLines = code.trim().split("\n");
      codeLines.shift();
      let varsDeclaration = `var ${this.internalVariables.join(" = null, ")} = null;`;
      codeLines.unshift(varsDeclaration);

      const global_variables = globalVariableStore.getters['GET_GLOBAL_VARIABLES'];

      let externalVariables = [];
      for (const variableName in global_variables) {
        if (global_variables.hasOwnProperty(variableName)) {
          externalVariables.push(variableName);
        }
      }
      let destructuring = `const { ${externalVariables.join(", ")} } = params;\n`;
      let returnStatement = `return { ${this.internalVariables.map(varName => `${varName}: ${varName}`).join(", ")} };`;
      let completeCode = [destructuring, ...codeLines, returnStatement].join("\n");


      const state = Blockly.serialization.workspaces.save(this.workspace);
      this.shape.setBlocklyWorkspace(state);
      this.shape.setDynamicFunction(completeCode);
      console.log(code);
      console.log(completeCode)
      return completeCode;
    },

    createToolbox() {
      return `<xml>
          <category name="Логика" colour="%{BKY_LOGIC_HUE}">
            <block type="controls_if"></block>
            <block type="logic_compare"></block>
            <block type="logic_operation"></block>
            <block type="logic_negate"></block>
            <block type="logic_boolean"></block>
          </category>
          <category name="Цвета" colour="#FF5733">
            <block type="colour_picker"></block>
            <block type="colour_rgb">
              <value name="RED">
                <block type="math_number">
                  <field name="NUM">255</field>
                </block>
              </value>
              <value name="GREEN">
                <block type="math_number">
                  <field name="NUM">0</field>
                </block>
              </value>
              <value name="BLUE">
                <block type="math_number">
                  <field name="NUM">0</field>
                </block>
              </value>
            </block>
            <block type="colour_blend">
              <value name="COLOUR1">
                <block type="colour_picker">
                  <mutation colour="#ff0000"></mutation>
                </block>
              </value>
              <value name="COLOUR2">
                <block type="colour_picker">
                  <mutation colour="#3333ff"></mutation>
                </block>
              </value>
              <value name="RATIO">
                <block type="math_number">
                  <field name="NUM">0.5</field>
                </block>
              </value>
            </block>
          </category>


          <category name="Математика" colour="%{BKY_MATH_HUE}">
            <block type="math_number">
              <field name="NUM">123</field>
            </block>
            <block type="math_arithmetic"></block>
            <block type="math_single"></block>
          </category>
          <category name="Текст" colour="%{BKY_TEXTS_HUE}">
            <block type="text"></block>
            <block type="text_length"></block>
            <block type="text_print"></block>
          </category>
          </category>

      <category name="Внешние параметры" colour="#4CA64C">
       <block type="external_variable_get"> </block>
      </category>
      <category name="Внутренние параметры" colour="#A64C4C">
      <block type="internal_variable_set"> </block>
      </category>
        </xml>`;
    }
  }
}
</script>

<style>
.blocklyWidgetDiv, .blocklyDropDownDiv, .blocklyTooltipDiv {
  position: fixed;
}

.blocklyScrollbarVertical {
  z-index: -1;
}
</style>
