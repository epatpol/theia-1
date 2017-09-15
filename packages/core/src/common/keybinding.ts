/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject, named } from 'inversify';
import { CommandRegistry } from './command';
import { KeyCode, Accelerator } from './keys';
import { ContributionProvider } from './contribution-provider';
import { ILogger } from "./logger";
import * as mousetrap from 'mousetrap';

export interface Keybinding {
    readonly commandId: string;
    readonly keystroke: string;
    /**
     * The optional keybinding context where this binding belongs to.
     * If not specified, then this keybinding context belongs to the NOOP
     * keybinding context.
     */
    readonly context?: KeybindingContext;
    /**
     * Sugar for showing the keybindings in the menus.
     */
    readonly accelerator?: Accelerator;
}

export const KeybindingContribution = Symbol("KeybindingContribution");
export interface KeybindingContribution {
    registerKeyBindings(keybindings: KeybindingRegistry): void;
}

export const KeybindingContext = Symbol("KeybindingContextExtension");
export interface KeybindingContext {
    /**
     * The unique ID of the current context.
     */
    readonly id: string;

    isEnabled(arg?: Keybinding): boolean;
}
export namespace KeybindingContexts {

    export const NOOP_CONTEXT: KeybindingContext = {
        id: 'noop.keybinding.context',
        isEnabled: () => true
    };

    export const DEFAULT_CONTEXT: KeybindingContext = {
        id: 'default.keybinding.context',
        isEnabled: () => false
    };
}


@injectable()
export class KeybindingContextRegistry {

    protected readonly contexts: { [id: string]: KeybindingContext } = {};

    constructor(
        @inject(ContributionProvider) @named(KeybindingContext)
        protected readonly contextProvider: ContributionProvider<KeybindingContext>
    ) {
        this.registerContext(KeybindingContexts.NOOP_CONTEXT);
        this.registerContext(KeybindingContexts.DEFAULT_CONTEXT);
    }

    initialize(): void {
        this.contextProvider.getContributions().forEach(context => this.registerContext(context));
    }

    /**
     * Registers the keybinding context arguments into the application. Fails when an already registered
     * context is being registered.
     *
     * @param contexts the keybinding contexts to register into the application.
     */
    registerContext(...contexts: KeybindingContext[]) {
        for (const context of contexts) {
            const { id } = context;
            if (this.contexts[id]) {
                throw new Error(`A keybinding context with ID ${id} is already registered.`);
            }
            this.contexts[id] = context;
        }
    }

    getContext(contextId: string): KeybindingContext | undefined {
        return this.contexts[contextId];
    }

}

@injectable()
export class KeybindingRegistry {

    protected readonly keybindings: { [index: string]: Keybinding[] } = {};
    protected readonly commands: { [commandId: string]: Keybinding[] } = {};

    constructor(
        @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry,
        @inject(KeybindingContextRegistry) protected readonly contextRegistry: KeybindingContextRegistry,
        @inject(ContributionProvider) @named(KeybindingContribution)
        protected readonly contributions: ContributionProvider<KeybindingContribution>,
        @inject(ILogger) protected readonly logger: ILogger
    ) { }

    onStart(): void {
        for (const contribution of this.contributions.getContributions()) {
            contribution.registerKeyBindings(this);
        }
    }

    registerKeybindings(...bindings: Keybinding[]): void {
        for (const binding of bindings) {
            this.registerKeyBinding(binding);
        }
    }

    /**
     * Adds a keybinding to the registry.
     *
     * @param binding
     */
    registerKeyBinding(binding: Keybinding) {

        const handler = this.commandRegistry.getActiveHandler(binding.commandId);
        const context = binding.context ? this.contextRegistry.getContext(binding.context.id) : undefined;

        if (handler) {
            const contextHandler = function () {
                if (context) {
                    if (context.isEnabled(binding)) {
                        handler.execute();
                    }
                } else {
                    handler.execute();
                }

            };
            mousetrap.bind(binding.keystroke, contextHandler);

        }

        // TODO log colliding keybinding


        // const existing = this.keybindings[binding.keystroke.keystroke];
        // if (existing) {
        //     const collided = existing.filter(b => b.context === binding.context);
        //     if (collided.length > 0) {
        //         this.logger.warn(`Collided keybinding is ignored; `, binding, ' collided with ', collided.join(', '));
        //         return;
        //     }
        // }
        // const { keystroke, commandId } = binding;
        // const bindings = this.keybindings[keystroke.keystroke] || [];
        // bindings.push(binding);
        // this.keybindings[keystroke.keystroke] = bindings;

        // const commands = this.commands[commandId] || [];
        // commands.push(binding);
        // this.commands[commandId] = bindings;
    }

    /**
     * The `active` flag with `false` could come handy when we do not want to check whether the command is currently active or not.
     * For instance, when building the main menu, it could easily happen that the command is not yet active (no active editors and so on)
     * but still, we have to build the key accelerator.
     *
     * @param commandId the unique ID of the command for we the associated ke binding are looking for.
     * @param options if `active` is false` then the availability of the command will not be checked. Default is `true`
     */
    getKeybindingForCommand(commandId: string, options: { active: boolean } = ({ active: true })): Keybinding | undefined {
        const bindings = this.commands[commandId];
        if (!bindings) {
            return undefined;
        }
        if (!options.active) {
            return bindings[0];
        }
        return bindings.find(this.isActive.bind(this));
    }

    /**
     * @param keyCode the key code of the binding we are searching.
     */
    getKeybindingForKeyCode(keyCode: KeyCode, options: { active: boolean } = ({ active: true })): Keybinding | undefined {
        const bindings = this.keybindings[keyCode.keystroke];
        if (!bindings) {
            return undefined;
        }
        if (!options.active) {
            return bindings[0];
        }
        return bindings.find(this.isActive.bind(this));
    }

    protected isActive(binding: Keybinding): boolean {
        const command = this.commandRegistry.getCommand(binding.commandId);
        return !!command && !!this.commandRegistry.getActiveHandler(command.id);
    }

    /**
     * Run the command matching to the given keyboard event.
     */
    // run(event: KeyboardEvent): void {
    //     if (event.defaultPrevented) {
    //         return;
    //     }
    //     const keyCode = KeyCode.createKeyCode(event);
    //     const binding = this.getKeybindingForKeyCode(keyCode);
    //     if (!binding) {
    //         return;
    //     }
    //     const context = binding.context || KeybindingContexts.NOOP_CONTEXT;
    //     if (context && context.isEnabled(binding)) {
    //         const handler = this.commandRegistry.getActiveHandler(binding.commandId);
    //         if (handler) {
    //             event.preventDefault();
    //             event.stopPropagation();
    //             handler.execute();
    //         }
    //     }
    // }

}

export const MONACO_TO_MOUSETRAP: { [label: string]: number } = {
/* Unknown =  */'undefined': 0,
/* Backspace =  */'backspace': 1,
/* 		Tab */'tab': 2,
/* 		Enter */'enter': 3,
/* 		Shift */'shift': 4,
/* 		Ctrl */'ctrl': 5,
/* 		Alt */'alt': 6,
/* 		PauseBreak */'pausebreak': 7,
/* 		CapsLock */'capslock': 8,
/* 		Escape */'escape': 9,
/* 		Space */'space': 10,
/* 		PageUp */'pageup': 11,
/* 		PageDown */'pagedown': 12,
/* 		End */'end': 13,
/* 		Home */'home': 14,
/* 		LeftArrow */'left': 15,
/* 		UpArrow */'up': 16,
/* 		RightArrow */'right': 17,
/* 		DownArrow */'down': 18,
/* 		Insert */'insert': 19,
/* 		Delete */'delete': 20,
/* 		KEY_0 */'0': 21,
/* 		KEY_1 */'1': 22,
/* 		KEY_2 */'2': 23,
/* 		KEY_3 */'3': 24,
/* 		KEY_4 */'4': 25,
/* 		KEY_5 */'5': 26,
/* 		KEY_6 */'6': 27,
/* 		KEY_7 */'7': 28,
/* 		KEY_8 */'8': 29,
/* 		KEY_9 */'9': 30,
/* 		KEY_A */'a': 31,
/* 		KEY_B */'b': 32,
/* 		KEY_C */'c': 33,
/* 		KEY_D */'d': 34,
/* 		KEY_E */'e': 35,
/* 		KEY_F */'f': 36,
/* 		KEY_G */'g': 37,
/* 		KEY_H */'h': 38,
/* 		KEY_I */'i': 39,
/* 		KEY_J */'j': 40,
/* 		KEY_K */'k': 41,
/* 		KEY_L */'l': 42,
/* 		KEY_M */'m': 43,
/* 		KEY_N */'n': 44,
/* 		KEY_O */'o': 45,
/* 		KEY_P */'p': 46,
/* 		KEY_Q */'q': 47,
/* 		KEY_R */'r': 48,
/* 		KEY_S */'s': 49,
/* 		KEY_T */'t': 50,
/* 		KEY_U */'u': 51,
/* 		KEY_V */'v': 52,
/* 		KEY_W */'w': 53,
/* 		KEY_X */'x': 54,
/* 		KEY_Y */'y': 55,
/* 		KEY_Z */'z': 56,
/* 		Meta */'meta': 57,
/* 		ContextMenu */'': 58,
/* 		F1 */'f1': 59,
/* 		F2 */'f2': 60,
/* 		F3 */'f3': 61,
/* 		F4 */'f4': 62,
/* 		F5 */'f5': 63,
/* 		F6 */'f6': 64,
/* 		F7 */'f7': 65,
/* 		F8 */'f8': 66,
/* 		F9 */'f9': 67,
/* 		F10 */'f10': 68,
/* 		F11 */'f11': 69,
/* 		F12 */'f12': 70,
/* 		F13 */'f13': 71,
/* 		F14 */'f14': 72,
/* 		F15 */'f15': 73,
/* 		F16 */'f16': 74,
/* 		F17 */'f17': 75,
/* 		F18 */'f18': 76,
/* 		F19 */'f19': 77,
/* 		NumLock */'numlock': 78,
/* 		ScrollLock */'scrolllock': 79,
    /**
	 * Used for miscellaneous characters; it can vary by keyboard.
	 * For the US standard keyboard, the ';:' key
	 */
/* 	US_SEMICOLON */';': 80,
    /**
     * For any country/region, the '+' key
     * For the US standard keyboard, the '=+' key
     */
/*     US_EQUAL */'=': 81,
    /**
     * For any country/region, the ',' key
     * For the US standard keyboard, the ',<' key
     */
/*     US_COMMA */',': 82,
    /**
     * For any country/region, the '-' key
     * For the US standard keyboard, the '-_' key
     */
/*     US_MINUS */'-': 83,
    /**
     * For any country/region, the '.' key
     * For the US standard keyboard, the '.>' key
     */
/*     US_DOT */'.': 84,
    /**
     * Used for miscellaneous characters; it can vary by keyboard.
     * For the US standard keyboard, the '/?' key
     */
/*     US_SLASH */'/': 85,
    /**
     * Used for miscellaneous characters; it can vary by keyboard.
     * For the US standard keyboard, the '`~' key
     */
/*     US_BACKTICK */'`': 86,
    /**
     * Used for miscellaneous characters; it can vary by keyboard.
     * For the US standard keyboard, the '[{' key
     */
/*     US_OPEN_SQUARE_BRACKET */'[': 87,
    /**
     * Used for miscellaneous characters; it can vary by keyboard.
     * For the US standard keyboard, the '\|' key
     */
/*     US_BACKSLASH */'\\': 88,
    /**
     * Used for miscellaneous characters; it can vary by keyboard.
     * For the US standard keyboard, the ']}' key
     */
/*     US_CLOSE_SQUARE_BRACKET */']': 89,
    /**
     * Used for miscellaneous characters; it can vary by keyboard.
     * For the US standard keyboard, the ''"' key
     */
/*     US_QUOTE */'\'': 90,
    /**
     * Used for miscellaneous characters; it can vary by keyboard.
     */

}
