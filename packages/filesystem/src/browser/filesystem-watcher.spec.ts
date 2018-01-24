/*
 * Copyright (C) 2018 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Container } from 'inversify';
import * as chai from 'chai';
import { ILogger } from '@theia/core/lib/common/logger';
import { MockLogger } from '@theia/core/lib/common/test/mock-logger';
import { FileSystemPreferences, createFileSystemPreferences } from '@theia/filesystem/lib/browser/';
import { PreferenceService, PreferenceServer } from '@theia/preferences-api/lib/common';
import { MockPreferenceServer } from '@theia/preferences-api/lib/common/test';
import { FileSystemWatcherServer, FileSystemWatcherClient } from '@theia/filesystem/lib/common/filesystem-watcher-protocol';
import { MockFilesystemWatcherServer } from '@theia/filesystem/lib/common/test';
import { FileSystemWatcher } from './filesystem-watcher';

import * as sinon from 'sinon';

const expect = chai.expect;
let testContainer: Container;

let watcher: FileSystemWatcher;
let mockClient: FileSystemWatcherClient;

before(async () => {
    testContainer = new Container();

    /* Preference bindings*/
    testContainer.bind(PreferenceService).toSelf().inSingletonScope();
    testContainer.bind(PreferenceServer).to(MockPreferenceServer).inSingletonScope();

    /* FS mocks and bindings */
    // testContainer.bind(FileSystemWatcherServer).to(MockFilesystemWatcherServer).inSingletonScope();
    testContainer.bind(FileSystemWatcherServer).toDynamicValue(ctx => {
        const mock = new MockFilesystemWatcherServer();

        sinon.stub(mock, 'setClient').callsFake(client =>
            mockClient = client
        );

        return mock;
    });

    testContainer.bind(FileSystemWatcher).toSelf().inSingletonScope();
    testContainer.bind(FileSystemPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get(PreferenceService);
        return createFileSystemPreferences(preferences);
    });

    /* Mock logger binding*/
    testContainer.bind(ILogger).to(MockLogger);
    watcher = testContainer.get(FileSystemWatcher);
});

after(() => {
    watcher.dispose();
});

describe('Frontend Filesystem Watcher', () => {

    describe('Watcher events', () => {
        it("Should receive changes from the server", async function () {
            watcher.onFilesChanged(changes => {

            });
            mockClient.onDidFilesChanged({})
        });
    });

});
