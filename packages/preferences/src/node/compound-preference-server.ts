/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { PreferenceServer, PreferenceClient, PreferenceChangedEvent, WorkspacePreferenceServer, UserPreferenceServer } from '@theia/preferences-api/lib/common/preference-protocol';
import * as os from 'os';
import { FileUri } from '@theia/core/lib/node';

export class CompoundPreferenceServer implements PreferenceServer {

    // protected readonly servers: PreferenceServer[];
    protected client: PreferenceClient | undefined;

    constructor(
        protected wsServer: WorkspacePreferenceServer, protected userServer: UserPreferenceServer
    ) {

        //             server.setClient({
        //                 onDidChangePreference: event => this.onDidChangePreference(event)
        // });
        //         }

        const homeUri = FileUri.create(os.homedir());

        userServer.setRoot(homeUri.toString());
        userServer.setClient({
            onDidChangePreference: event => this.onDidChangePreference(event)
        });
        wsServer.setClient({
            onDidChangePreference: event => this.onDidChangePreference(event)
        });
    }

    // TODO scope management should happen here
    protected onDidChangePreference(event: PreferenceChangedEvent): void {

        // TODO only fire when all pref servers are ready (scope management)
        if (this.client) {
            this.client.onDidChangePreference(event);
        }

    }

    dispose(): void {
        // for (const server of this.servers) {
        //     server.dispose();
        // }
        this.userServer.dispose();

        this.wsServer.dispose();
    }

    setClient(client: PreferenceClient | undefined) {
        this.client = client;
    }

    setRoot(root: string): Promise<void> {
        return this.setRoots(root);
    }

    setRoots(wsRoot: string): Promise<void> {
        const homeUri = FileUri.create(os.homedir());

        this.userServer.setRoot(homeUri.toString());

        return this.wsServer.setRoot(wsRoot);
    }
}
