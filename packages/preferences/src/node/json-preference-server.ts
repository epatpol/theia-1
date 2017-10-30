/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { JSONExt } from '@phosphor/coreutils';
import { inject, injectable } from 'inversify';
import URI from "@theia/core/lib/common/uri";
import { Disposable, DisposableCollection, ILogger/* , MaybePromise */ } from '@theia/core/lib/common';
import { FileSystem } from '@theia/filesystem/lib/common';
import { FileSystemWatcherServer, DidFilesChangedParams, FileChange } from '@theia/filesystem/lib/common/filesystem-watcher-protocol';
import { PreferenceChangedEvent, PreferenceClient, PreferenceServer, PreferenceChange } from '../common';
import * as jsoncparser from "jsonc-parser";
import { ParseError } from "jsonc-parser";

// export const PreferenceUri = Symbol("PreferencePath");
// export type PreferenceUri = MaybePromise<URI>;

@injectable()
export class PreferenceServerImpl implements PreferenceServer {

    protected preferences: { [key: string]: any } | undefined;
    protected client: PreferenceClient | undefined;
    protected readonly preferenceUri: Promise<string>;
    protected prefServer: JsonPreferenceServer;

    protected readonly toDispose = new DisposableCollection();
    protected ready: Promise<void>;

    constructor(
        @inject(FileSystem) protected readonly fileSystem: FileSystem,
        @inject(FileSystemWatcherServer) protected readonly watcherServer: FileSystemWatcherServer,
        @inject(ILogger) protected readonly logger: ILogger,
    ) {

        this.prefServer = new JsonPreferenceServerImpl(fileSystem, watcherServer, logger);

        this.toDispose.push(this.prefServer);
        this.prefServer.setClient({
            onDidChangePreferences: p => this.doReconcilePreferences(p)
        });

    }

    setRoot(root: string): Promise<void> {
        const rootUri = new URI(root);
        const uri = rootUri.withPath(rootUri.path.join('.theia', 'settings.json'));
        this.prefServer.watchPreferenceFile(uri.toString());
        this.ready = this.reconcilePreferences();

        return this.ready;
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    protected reconcilePreferences(): Promise<void> {
        return this.prefServer.readPreferences().then(prefs => {
            this.doReconcilePreferences(prefs);
        });
    }

    protected doReconcilePreferences(preferences: any | undefined) {
        if (preferences) {
            if (this.preferences) {
                this.fireChanged(this.preferences, preferences);
            } else {
                this.fireNew(preferences);
            }
        } else if (this.preferences) {
            this.fireRemoved(this.preferences);
        }
        this.preferences = preferences;
    }

    protected fireNew(preferences: any): void {
        const changes: PreferenceChange[] = [];

        // tslint:disable-next-line:forin
        for (const preferenceName in preferences) {
            const newValue = preferences[preferenceName];
            changes.push({
                preferenceName, newValue
            });
        }
        this.fireEvent({ changes });
    }

    protected fireRemoved(preferences: any): void {

        const changes: PreferenceChange[] = [];
        // tslint:disable-next-line:forin
        for (const preferenceName in preferences) {
            const oldValue = preferences[preferenceName];
            changes.push({
                preferenceName, oldValue
            });
        }
        this.fireEvent({ changes });
    }

    protected fireChanged(target: any, source: any): void {
        const deleted = new Set(Object.keys(target));
        const changes: PreferenceChange[] = [];

        // tslint:disable-next-line:forin
        for (const preferenceName in source) {
            deleted.delete(preferenceName);
            const newValue = source[preferenceName];
            if (preferenceName in target) {
                const oldValue = target[preferenceName];
                if (!JSONExt.deepEqual(oldValue, newValue)) {
                    changes.push({ preferenceName, newValue, oldValue });
                }
            } else {
                changes.push({ preferenceName, newValue });
            }
        }
        for (const preferenceName of deleted) {
            const oldValue = target[preferenceName];
            changes.push({ preferenceName, oldValue });
        }

        if (changes.length > 0) {
            this.fireEvent({ changes });
        }

    }

    protected fireEvent(event: PreferenceChangedEvent) {
        this.logger.debug(log =>
            log('onDidChangePreference:', event)
        );
        if (this.client) {
            this.client.onDidChangePreference(event);
        }
    }

    has(preferenceName: string): Promise<boolean> {
        return this.ready.then(() => {
            return !!this.preferences && (preferenceName in this.preferences);
        });
    }

    get<T>(preferenceName: string): Promise<T | undefined> {
        return this.ready.then(() =>
            !!this.preferences ? this.preferences[preferenceName] : undefined
        );
    }

    setClient(client: PreferenceClient | undefined) {
        this.client = client;
    }
}

// export const JsonPreferenceServer = Symbol("JsonPreferenceServer");

export interface JsonPreferenceServer extends Disposable {

    watchPreferenceFile(uri: string): void;
    onDidFilesChanged(event: DidFilesChangedParams): void;
    readPreferences(): Promise<any | undefined>;
    setClient(client: JsonClient | undefined): void;
}

@injectable()
export class JsonPreferenceServerImpl implements JsonPreferenceServer {

    private uri: string;

    constructor(
        protected readonly fileSystem: FileSystem,
        protected readonly watcherServer: FileSystemWatcherServer,
        protected readonly logger: ILogger,
    ) {

    }
    protected client: JsonClient | undefined;

    protected readonly toDispose = new DisposableCollection();

    watchPreferenceFile(uri: string) {

        this.uri = uri;
        this.watcherServer.watchFileChanges(uri).then(id => {
            this.toDispose.push(Disposable.create(() =>
                this.watcherServer.unwatchFileChanges(id))
            );
        });

        this.watcherServer.setClient({
            onDidFilesChanged: p => this.onDidFilesChanged(p)
        });
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    onDidFilesChanged(event: DidFilesChangedParams): void {
        if (this.arePreferencesAffected(event.changes)) {
            this.reconcilePreferences();
        }
    }

    protected arePreferencesAffected(changes: FileChange[]): boolean {
        return changes.some(c => c.uri === this.uri);
    }

    protected reconcilePreferences(): Promise<void> {
        return this.readPreferences().then(preferences =>
            this.doReconcilePreferences(preferences)
        );
    }

    protected doReconcilePreferences(preferences: any | undefined) {

        if (this.client) {
            this.client.onDidChangePreferences(preferences);
        }
    }

    readPreferences(): Promise<any | undefined> {

        return this.fileSystem.exists(this.uri).then(exists => {
            if (!exists) {
                return undefined;
            }
            return this.fileSystem.resolveContent(this.uri).then(({ stat, content }) => {
                const strippedContent = jsoncparser.stripComments(content);
                const errors: ParseError[] = [];
                const preferences = jsoncparser.parse(strippedContent, errors);
                if (errors.length) {
                    for (const error of errors) {
                        this.logger.error("JSON parsing error", error);
                    }
                }

                return preferences;
            });
        }).catch(reason => {
            if (reason) {
                this.logger.error(`Failed to read preferences ${this.uri}:`, reason);
            }
            return undefined;
        });
    }

    setClient(client: JsonClient | undefined) {
        this.client = client;
    }

}

export interface JsonClient {
    onDidChangePreferences(prefs: any): void
}
