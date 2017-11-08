/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { DisposableCollection, ILogger, Emitter, Event } from '@theia/core/lib/common';
import { UserStorageChangeEvent, UserStorageService, THEIA_USER_STORAGE_FOLDER } from './user-storage-service';
import { injectable, inject } from 'inversify';
import { FileSystem, FileChange } from '@theia/filesystem/lib/common';
import { FileSystemWatcher } from "@theia/filesystem/lib/common";

import * as jsoncparser from 'jsonc-parser';
import URI from '@theia/core/lib/common/uri';
import { UserStorageUri } from './user-storage-uri';

@injectable()
export class UserStorageServiceFilesystemImpl implements UserStorageService {

    protected readonly toDispose = new DisposableCollection();
    protected readonly onUserStorageChangedEmitter = new Emitter<UserStorageChangeEvent>();
    protected userStorageFolder: URI;

    constructor(
        @inject(FileSystem) protected readonly fileSystem: FileSystem,
        @inject(FileSystemWatcher) protected readonly watcher: FileSystemWatcher,
        @inject(ILogger) protected readonly logger: ILogger

    ) {
        this.fileSystem.getCurrentUserHome().then(home => {
            const homeUri = new URI(home.uri);
            this.userStorageFolder = homeUri.resolve(THEIA_USER_STORAGE_FOLDER);

            watcher.watchFileChanges(this.userStorageFolder).then(disposable =>
                this.toDispose.push(disposable)
            );
            this.toDispose.push(this.watcher.onFilesChanged(changes => this.onDidFilesChanged(changes)));
        });
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    onDidFilesChanged(fileChanges: FileChange[]): void {
        const uris: string[] = [];
        for (const change of fileChanges) {
            uris.push(UserStorageUri.create(change.uri.toString()).toString());
        }
        this.onUserStorageChangedEmitter.fire({ uris });
    }

    readContents(uri: string) {
        const fsUri = UserStorageUri.toFsUri(this.userStorageFolder, new URI(uri));

        return this.fileSystem.resolveContent(fsUri.toString()).then(({ stat, content }) => jsoncparser.stripComments(content));

    }

    saveContents(uri: string, content: string) {
        const fsUri = UserStorageUri.toFsUri(this.userStorageFolder, new URI(uri));

        return this.fileSystem.getFileStat(fsUri.toString()).then(fileStat => {
            this.fileSystem.setContent(fileStat, content);
        });

    }

    get onUserStorageChanged(): Event<UserStorageChangeEvent> {
        return this.onUserStorageChangedEmitter.event;
    }
}
