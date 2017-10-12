/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { JsonRpcServer } from "@theia/core";

export const keybindingsPath = '/services/keybindings';

export const KeybindingServer = Symbol("KeybindingServer");
export interface KeybindingServer extends JsonRpcServer<KeybindingClient> {
}

export interface KeybindingClient {
    onDidChangeKeymap(keymap: KeymapChangeEvent): void;
}

export interface RawKeybinding {
    command: string;
    keybinding: string;
    context?: string;
    args?: string[];
}

export interface KeymapChangeEvent {
    changes: RawKeybinding[]
}

// export interface JsonChange {
//     readonly property: string;
//     readonly newValue?: any;
//     readonly oldValue?: any;
// }
