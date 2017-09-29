/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from 'inversify';
import { FileSystem } from '@theia/filesystem/lib/common';
import { Disposable, DisposableCollection, ILogger, } from '@theia/core/lib/common';
import { FileSystemWatcherServer, DidFilesChangedParams } from '@theia/filesystem/lib/common/filesystem-watcher-protocol';
import { IUserStorageServer, UserStorageClient } from '../common/user-storage-protocol';
import * as jsoncparser from 'jsonc-parser';
import URI from '@theia/core/lib/common/uri';
import { UserStorageUri } from '../common/user-storage-uri';

export const UserStorageRoot = Symbol('UserStorageRoot');

@injectable()
export class UserStorageServer implements IUserStorageServer {

    protected client: UserStorageClient | undefined;
    protected readonly toDispose = new DisposableCollection();

    constructor(
        @inject(FileSystem) protected readonly fileSystem: FileSystem,
        @inject(FileSystemWatcherServer) protected readonly watcherServer: FileSystemWatcherServer,
        @inject(ILogger) protected readonly logger: ILogger,
        @inject(UserStorageRoot) protected readonly rootURI: URI

    ) {

        watcherServer.setClient({
            onDidFilesChanged: p => this.onDidFilesChanged(p)
        });

        watcherServer.watchFileChanges(this.rootURI.toString()).then(id => {
            this.toDispose.push(Disposable.create(() =>
                watcherServer.unwatchFileChanges(id))
            );
        });


        this.toDispose.push(watcherServer);
    }

    readContents(uri: string): Promise<string> {
        const fsUri = UserStorageUri.toFsUri(this.rootURI, new URI(uri));

        return this.fileSystem.resolveContent(fsUri.toString()).then(({ stat, content }) => jsoncparser.stripComments(content));

    }

    saveContents(uri: string, content: string): Promise<void> {
        const fsUri = UserStorageUri.toFsUri(this.rootURI, new URI(uri));

        return this.fileSystem.getFileStat(fsUri.toString()).then(fileStat => {
            this.fileSystem.setContent(fileStat, content);
        });
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    protected onDidFilesChanged(params: DidFilesChangedParams): void {
        const uris: string[] = [];
        for (const change of params.changes) {
            uris.push(UserStorageUri.create(change.uri).toString());
        }
        if (this.client) {
            this.client.onDidChangeContent({ uris });
        }
    }

    setClient(client: UserStorageClient | undefined) {
        this.client = client;
    }
}
