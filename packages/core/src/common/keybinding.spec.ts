/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as chai from 'chai';
import { ContributionProvider } from './contribution-provider';
import { ILogger, Logger } from './logger';
import { KeybindingRegistry, KeybindingContext, KeybindingContextRegistry, Keybinding, KeybindingContribution, RawKeybinding } from './keybinding';
import { KeyCode, } from './keys';
import { CommandRegistry, CommandContribution, Command } from './command';

const expect = chai.expect;
chai.config.showDiff = true;
chai.config.includeStack = true;

let keybindingRegistry: KeybindingRegistry;

describe('keybindings', () => {
    beforeEach(() => {
        keybindingRegistry = new KeybindingRegistry(createCommandRegistry(), createKeybindingContextRegistry(), createKeybindingContributionProvider(), createLogger());
        keybindingRegistry.onStart();
    });

    it("should register the default keybindings", () => {
        const keybinding = keybindingRegistry.getKeybindingsForCommand('test.command', { active: false });
        expect(keybinding).is.not.undefined;

        const keybinding2 = keybindingRegistry.getKeybindingsForCommand('undefined.command', { active: false });
        expect(keybinding2).is.undefined;
    });

    it("should set a keymap", () => {
        const rawKeybindings: RawKeybinding[] = [{
            command: "test.command",
            keybinding: "ControlLeft+KeyC"
        }];

        keybindingRegistry.setKeymap(rawKeybindings);

        const bindings = keybindingRegistry.getKeybindingsForCommand('test.command', { active: false });
        if (bindings) {
            expect(bindings[0].keyCode.keystroke).to.be.equal("ControlLeft+KeyC");
        }

    });

    it("should reset to default in case of invalid keybinding", () => {
        const rawKeybindings: RawKeybinding[] = [{
            command: "test.command",
            keybinding: "ControlLeft+invalid"
        }];

        keybindingRegistry.setKeymap(rawKeybindings);

        const bindings = keybindingRegistry.getKeybindingsForCommand('test.command', { active: false });
        if (bindings) {
            expect(bindings[0].keyCode.keystroke).to.be.equal("ControlLeft+KeyA");
        }
    });

    it("should remove all keybindings from a command that has multiple keybindings", () => {
        const rawKeybindings: RawKeybinding[] = [{
            command: "test.command2",
            keybinding: "F3"
        }];

        keybindingRegistry.setKeymap(rawKeybindings);

        const bindings = keybindingRegistry.getKeybindingsForCommand('test.command2', { active: false });
        if (bindings) {
            expect(bindings.length).to.be.equal(1);
            expect(bindings[0].keyCode.keystroke).to.be.equal("F3");
        }
    });

    it("should register a correct keybinding, then default back to the original for a wrong one after", () => {
        let rawKeybindings: RawKeybinding[] = [{
            command: "test.command",
            keybinding: "ControlLeft+KeyC"
        }];
        // Get default binding
        const keystroke = keybindingRegistry.getKeybindingsForCommand('test.command', { active: false });

        // Set correct new binding
        keybindingRegistry.setKeymap(rawKeybindings);
        const bindings = keybindingRegistry.getKeybindingsForCommand('test.command', { active: false });
        if (bindings) {
            expect(bindings[0].keyCode.keystroke).to.be.equal("ControlLeft+KeyC");
        }

        // Set invalid binding
        rawKeybindings = [{
            command: "test.command",
            keybinding: "ControlLeft+Invalid"
        }];
        keybindingRegistry.setKeymap(rawKeybindings);
        const defaultBindings = keybindingRegistry.getKeybindingsForCommand('test.command', { active: false });
        if (defaultBindings) {
            if (keystroke) {
                expect(defaultBindings[0].keyCode.keystroke).to.be.equal(keystroke[0].keyCode.keystroke);
            }
        }
    });
});

describe("keys api", () => {
    it("parses a keystroke correctly", () => {
        let keycode = KeyCode.parseKeystroke("ControlLeft+KeyB");
        expect(keycode).is.not.undefined;

        // Invalid keystroke string
        keycode = KeyCode.parseKeystroke("onTrolLeft+keYB");
        expect(keycode).is.undefined;
    });
})

function createKeybindingContextRegistry(): KeybindingContextRegistry {
    const keybindingContextProviderStub = {
        getContributions(): KeybindingContext[] {
            return [{
                id: 'testContext',

                isEnabled(arg?: Keybinding): boolean {
                    return true;
                }
            }];
        }
    };
    const registry = new KeybindingContextRegistry(keybindingContextProviderStub);
    registry.initialize();
    return registry;
}

const TEST_COMMAND: Command = {
    id: 'test.command'
};

const TEST_COMMAND2: Command = {
    id: 'test.command2'
};

function createCommandRegistry(): CommandRegistry {

    const commandProviderStub = {
        getContributions(): CommandContribution[] {
            return [{
                registerCommands(commands: CommandRegistry): void {
                    commands.registerCommand(TEST_COMMAND);
                    commands.registerCommand(TEST_COMMAND2);
                }
            }]
        }
    }

    const registry = new CommandRegistry(commandProviderStub);
    registry.onStart();
    return registry;
}

function createKeybindingContributionProvider(): ContributionProvider<KeybindingContribution> {
    return {
        getContributions(): KeybindingContribution[] {
            return [{
                registerDefaultKeyBindings(keybindings: KeybindingRegistry): void {
                    [
                        {
                            commandId: TEST_COMMAND.id,
                            context: {
                                id: 'testContext',
                                isEnabled(arg?: Keybinding): boolean {
                                    return true;
                                }
                            },
                            keyCode: new KeyCode('ControlLeft+KeyA')

                        },
                        {
                            commandId: TEST_COMMAND2.id,
                            context: {
                                id: 'testContext',
                                isEnabled(arg?: Keybinding): boolean {
                                    return true;
                                }
                            },
                            keyCode: new KeyCode('F1')

                        },
                        {
                            commandId: TEST_COMMAND2.id,
                            context: {
                                id: 'testContext',
                                isEnabled(arg?: Keybinding): boolean {
                                    return true;
                                }
                            },
                            keyCode: new KeyCode('F2')

                        },
                    ].forEach(binding => {
                        keybindings.registerDefaultKeyBinding(binding);
                    });
                }
            }];
        }
    };
}

function createLogger(): ILogger {
    return new Proxy<Logger>({} as any, {
        get: (target, name) => () => {
            if (name.toString().startsWith('is')) {
                return Promise.resolve(false);
            }
            if (name.toString().startsWith('if')) {
                return new Promise(resolve => { });
            }
        }
    });
}
