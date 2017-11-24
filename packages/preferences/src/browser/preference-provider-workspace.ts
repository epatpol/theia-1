/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable } from 'inversify';
import { ResourceProvider, Resource } from "@theia/core/lib/common";
import { ILogger } from "@theia/core/lib/common";
import { FileSystem } from '@theia/filesystem/lib/common/filesystem';
import { FileSystemWatcher, FileChangeType } from '@theia/filesystem/lib/common/filesystem-watcher';
import URI from '@theia/core/lib/common/uri';
import { DisposableCollection } from '@theia/core/lib/common';
import { PreferenceProvider, PreferenceProviderClient, PreferenceProviderPriority } from '@theia/preferences-api/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import * as jsoncparser from "jsonc-parser";
import { ParseError } from "jsonc-parser";

@injectable()
export class PreferenceProviderWorkspace implements PreferenceProvider {
    protected preferencesCache: { [key: string]: any } = {};

    protected client: PreferenceProviderClient | undefined;

    protected readonly toDispose = new DisposableCollection();

    protected resolveReady: () => void;

    readonly ready = new Promise<void>(resolve => {
        this.resolveReady = resolve;
    });

    public readonly priority: PreferenceProviderPriority = PreferenceProviderPriority.WORKSPACE;

    protected preferenceResource: Promise<Resource>;

    constructor(
        @inject(ResourceProvider) protected readonly provider: ResourceProvider,
        @inject(FileSystem) protected readonly filesystem: FileSystem,
        @inject(FileSystemWatcher) protected readonly watcher: FileSystemWatcher,
        @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService,
        @inject(ILogger) protected readonly logger: ILogger,
    ) { }

    async init(): Promise<void> {
        this.workspaceService.root.then(async root => {
            if (root) {
                const rootUri = new URI(root.uri);
                const settingsUri = rootUri.resolve('.theia').resolve('settings.json');

                this.watcher.watchFileChanges(settingsUri);
                this.watcher.onFilesChanged(changes => {
                    changes.forEach(change => {
                        if (change.uri.toString() === settingsUri.toString()) {
                            switch (change.type) {
                                case FileChangeType.UPDATED:
                                    this.readPreferences();
                                    break;
                                case FileChangeType.ADDED:
                                    this.registerResource(settingsUri);
                                    this.readPreferences();
                                    break;
                                case FileChangeType.DELETED:
                                    this.preferencesCache = {};
                                    if (this.client) {
                                        this.client.onNewPreferences({});
                                    }
                            }
                        }
                    });
                });

                if (await this.filesystem.exists(settingsUri.toString())) {
                    this.registerResource(settingsUri);
                }
            }
        });
    }

    registerResource(uri: URI) {
        this.preferenceResource = this.provider(uri);

        this.preferenceResource.then(resource => {
            this.resolveReady();

            if (resource.onDidChangeContents) {
                resource.onDidChangeContents(content => this.readPreferences());
            }
            this.toDispose.push(resource);
        });
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    protected async readPreferences(): Promise<void> {
        const resource = await this.preferenceResource;
        const newContent = await resource.readContents();
        const strippedContent = jsoncparser.stripComments(newContent);
        const errors: ParseError[] = [];
        const preferences = jsoncparser.parse(strippedContent, errors);
        if (errors.length) {
            for (const error of errors) {
                this.logger.error("JSON parsing error", error);
            }
        }
        this.preferencesCache = preferences;
        if (this.client) {
            /* Tell the service to recalculate the preferences with scopes */
            this.client.onNewPreferences({});
        }
    }

    has(preferenceName: string): boolean {
        return this.preferencesCache[preferenceName] !== undefined;
    }

    getPreferences(): { [key: string]: any } {
        return this.preferencesCache;
    }

    setClient(client: PreferenceProviderClient) {
        this.client = client;
    }
}
