/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

const toolboxDef = {
    "kind": "flyoutToolbox",
    "contents": [
      {
        "kind": "block",
        "type": "controls_if"
      },
      {
        "kind": "block",
        "type": "controls_whileUntil"
      },
      {
        "kind": "block",
        "type": "logic_compare"
      },
      {
        "kind": "block",
        "type": "logic_boolean"
      },
    ]
  };

/** Generates JavaScript with disabled blocks commented out. */
class CommentCodeGenerator extends javascript.JavascriptGenerator { 
  
    /**
     * Override super's blockToCode to comment out disabled blocks instead of 
     * skipping them.
     *
     * @param block The block to generate code for.
     * @param opt_thisOnly True to generate code for only this statement.
     * @returns The generated code.
     */
    blockToCode(block, opt_thisOnly){
        if(block && !block.isEnabled()){
            // super's blockToCode will return early if the block is disabled, 
            // so we temporarily enable the block to get the code
            const disabledReasons = block.getDisabledReasons();
            for (const reason of disabledReasons) {
                block.setDisabledReason(false, reason);
            }
            let code = super.blockToCode(block, opt_thisOnly);
            // Assumes block was disabled by user
            block.setDisabledReason(true, "DISABLED_BY_USER");
            
            // blockToCode can return a string or an array
            if (typeof code === 'string'){
                code = super.prefixLines(code, '// ');
            }
            else {
                code[0] = super.prefixLines(code[0], '// ');
            }
            return code;
        }
        else {
            return super.blockToCode(block, opt_thisOnly);
        }
    }
}

/** Initialize the code generator and workspace. Called once DOM is created. */
function init() {
    // Set up custom code generator
    const commentCodeGenerator = new CommentCodeGenerator();
    Object.assign(commentCodeGenerator.forBlock, javascript.javascriptGenerator.forBlock);

    // Set up output div and registers context menu items
    const outputDiv = document.getElementById('output');
    registerDisableItem();
    registerEnableItem();

    const ws = Blockly.inject('blocklyDiv', {toolbox: toolboxDef, media: '../lib/blockly/media/',}); 

    // Add generated code to the output div on change
    ws.addChangeListener((event) => {
        if (event.type !== Blockly.Events.UI) {
            const code = commentCodeGenerator.workspaceToCode(ws);
            outputDiv.innerText = code;
        }
    });
}

/** Create and register a context menu item for disabling blocks. */
function registerDisableItem() {
    const disableItem = {
        displayText: 'Disable Block',
        preconditionFn: function (scope) {
        if (
            scope.focusedNode instanceof Blockly.BlockSvg
            && scope.focusedNode.isEnabled()
        ) {
            return 'enabled';
        }
        else return 'hidden';
        },
        callback: function (scope) {
            scope.focusedNode.setDisabledReason(true, 'DISABLED_BY_USER');
        },
        id: 'disable_block',
        weight: 100,
    };
    Blockly.ContextMenuRegistry.registry.register(disableItem);
}

/** Create and register a context menu item for enabling blocks. */
function registerEnableItem() {
    const enableItem = {
        displayText: 'Enable Block',
        preconditionFn: function (scope) {
            if (
                scope.focusedNode instanceof Blockly.BlockSvg 
                && !scope.focusedNode.isEnabled()
            ) {
                return 'enabled';
            }
            else return 'hidden';
        },
        callback: function (scope) {
            scope.focusedNode.setDisabledReason(false, 'DISABLED_BY_USER');
        },
        id: 'enable_block',
        weight: 100,
    };
    Blockly.ContextMenuRegistry.registry.register(enableItem);
}
