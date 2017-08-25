/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable } from 'inversify';
import { Emitter, Disposable, DisposableCollection, CommandRegistry, KeybindingRegistry, KeyCode } from '@theia/core/lib/common';
import { PreferenceServer, KeybindingServer, PreferenceChangedEvent, PreferenceChange } from './preference-protocol';

@injectable()
export class KeybindingService implements Disposable {
    protected prefCache: { [key: string]: any } = {};

    protected readonly toDispose = new DisposableCollection();
    protected readonly onPreferenceChangedEmitter = new Emitter<PreferenceChange>();

    constructor(
        @inject(KeybindingServer) protected readonly server: PreferenceServer,
        @inject(CommandRegistry) protected commandRegistry: CommandRegistry,
        @inject(KeybindingRegistry) protected readonly keybindingRegistry: KeybindingRegistry
    ) {
        server.setClient({
            onDidChangePreference: event => this.onDidChangePreference(event)
        });
        this.toDispose.push(server);
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    protected onDidChangePreference(event: PreferenceChangedEvent): void {
        for (const change of event.changes) {
            const commandId = change.preferenceName;

            // for each change
            // if is the commandId valid
            if (this.keybindingRegistry.getKeybindingForCommand(commandId) !== undefined) {
                this.keybindingRegistry.registerKeyBinding({
                    commandId: commandId,
                    keyCode: {}
                })
            }
        }

        // register keybinding (overriding the value that already exists)
    }
}