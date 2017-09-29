/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from 'inversify';
import { Disposable, DisposableCollection, Emitter, Event } from '@theia/core/lib/common';
import { UserStorageChangeEvent, IUserStorageServer } from '../common/user-storage-protocol';

@injectable()
export class UserStorageService implements Disposable {

    protected readonly toDispose = new DisposableCollection();
    protected readonly onUserStorageChangedEmitter = new Emitter<UserStorageChangeEvent>();

    constructor(
        @inject(IUserStorageServer) protected readonly server: IUserStorageServer) {
        this.toDispose.push(this.onUserStorageChangedEmitter);

        this.toDispose.push(server);
        server.setClient({
            onDidChangeContent: e => this.onDidUserStorageChanged(e)
        });
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    onDidUserStorageChanged(event: UserStorageChangeEvent): void {
        this.onUserStorageChangedEmitter.fire(event);
    }

    readContents(uri: string) {
        return this.server.readContents(uri);
    }

    saveContents(uri: string, content: string) {
        return this.server.saveContents(uri, content);

    }

    get onUserStorageChanged(): Event<UserStorageChangeEvent> {
        return this.onUserStorageChangedEmitter.event;
    }
}