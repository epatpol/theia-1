/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from "inversify";
import { EditorManager } from "./editor-manager";
import { TheiaKeyCodeUtils, Key, Modifier } from "@theia/core/lib/common/keys";
import { KeybindingContext, Keybinding, KeybindingContribution, KeybindingRegistry } from "@theia/core/lib/common/keybinding";

@injectable()
export class EditorKeybindingContext implements KeybindingContext {

    constructor( @inject(EditorManager) protected readonly editorService: EditorManager) { }

    id = 'editor.keybinding.context';

    isEnabled(arg?: Keybinding) {
        return this.editorService && !!this.editorService.activeEditor;
    }

}

@injectable()
export class EditorKeybindingContribution implements KeybindingContribution {

    constructor(
        @inject(EditorKeybindingContext) protected readonly editorKeybindingContext: EditorKeybindingContext
    ) { }

    registerDefaultKeyBindings(registry: KeybindingRegistry): void {
        [
            {
                commandId: 'editor.close',
                context: this.editorKeybindingContext,
                keyCode: TheiaKeyCodeUtils.createKeyCode({ first: Key.KEY_W, modifiers: [Modifier.M3] })
            },
            {
                commandId: 'editor.close.all',
                context: this.editorKeybindingContext,
                keyCode: TheiaKeyCodeUtils.createKeyCode({ first: Key.KEY_W, modifiers: [Modifier.M2, Modifier.M3] })
            }
        ].forEach(binding => {
            registry.registerDefaultKeyBinding(binding);
        });

    }

}
