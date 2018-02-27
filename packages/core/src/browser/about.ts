/*
 * Copyright (C) 2018 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Message } from '@phosphor/messaging';
import { AbstractDialog } from './dialogs';
import { MenuContribution, MenuModelRegistry, Command, CommandContribution, CommandRegistry } from '@theia/core';
import { injectable } from 'inversify';
import { CommonMenus } from '@theia/core/lib/browser';

export class AboutDialog extends AbstractDialog<void> {

    protected readonly okButton: HTMLButtonElement;

    constructor() {
        super({
            title: `Theia`
        });

        const messageNode = document.createElement("div");
        messageNode.textContent = "FIXME";
        messageNode.setAttribute('style', 'flex: 1 100%; padding-bottom: calc(var(--theia-ui-padding)*3);');
        this.contentNode.appendChild(messageNode);
        this.appendAcceptButton('Ok');
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
    }

    get value(): undefined { return undefined; }
}

export const ABOUT_COMMAND: Command = {
    id: 'core.about',
    label: 'About'
};

@injectable()
export class AboutContribution implements MenuContribution, CommandContribution {
    registerMenus(registry: MenuModelRegistry): void {

        registry.registerMenuAction(CommonMenus.HELP, {
            commandId: ABOUT_COMMAND.id,
            label: 'About',
            order: '9'
        });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(ABOUT_COMMAND, {
            execute: () => {
                const dialog = new AboutDialog();
                dialog.open();
            }
        });
    }

}
