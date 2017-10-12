/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Container } from 'inversify';
import * as fs from 'fs-extra';
import * as temp from 'temp';
import * as chai from 'chai';

import { UserStorageServer, UserStorageRoot } from './user-storage-server';
import { UserStorageUri } from '../common/user-storage-uri';
import { ChokidarFileSystemWatcherServer } from '@theia/filesystem/lib/node/chokidar-filesystem-watcher';
import { FileSystemWatcherServer } from '@theia/filesystem/lib/common/filesystem-watcher-protocol';
import { FileSystemNode } from '@theia/filesystem/lib/node/node-filesystem';
import { FileSystem } from "@theia/filesystem/lib/common";
import { ILogger } from "@theia/core/lib/common";
import { FileUri } from '@theia/core/lib/node/file-uri';
import { MockLogger } from '@theia/core/lib/common/test/mock-logger';
import URI from '@theia/core/lib/common/uri';


const homeDirectory = '.theia';
let userStorageUri: URI;
let server: UserStorageServer;
let filesystemNode: FileSystemNode;
const track = temp.track();
const expect = chai.expect;
const keymapsFile = 'keymaps.json';


before(() => {
    const testContainer = new Container();
    testContainer.bind(ILogger).toDynamicValue(ctx => {
        const logger = new MockLogger();
        return logger;
    });

    const rootUri = FileUri.create(track.mkdirSync());
    userStorageUri = rootUri.resolve(homeDirectory);
    fs.mkdirSync(FileUri.fsPath(rootUri.resolve('.theia')));

    testContainer.bind(FileSystemNode).toSelf().inSingletonScope();
    testContainer.bind(FileSystem).toDynamicValue(ctx => ctx.container.get(FileSystemNode)).inSingletonScope();

    testContainer.bind(ChokidarFileSystemWatcherServer).toSelf();
    testContainer.bind(FileSystemWatcherServer).toDynamicValue(ctx =>
        ctx.container.get(ChokidarFileSystemWatcherServer)
    );

    testContainer.bind(UserStorageServer).toSelf().inSingletonScope();


    testContainer.bind(UserStorageRoot).toConstantValue(userStorageUri);

    server = testContainer.get(UserStorageServer);
    filesystemNode = testContainer.get(FileSystemNode);
    userStorageUri = userStorageUri.resolve(keymapsFile);
});

after(() => {
    server.dispose();
    track.cleanupSync();
});

describe('User Storage Server', () => {
    beforeEach(() => {

        fs.writeFileSync(FileUri.fsPath(userStorageUri), `[{
                 command: "testCommand",
                 keybinding:"testKeyBinding",
                 context: "testContext"
             }]`);

    });

    describe('Should be able to register a client and receive content notification change', () => {

        it("Keybinding server registers a client and sends an event for a json change", done => {
            server.setClient({
                onDidChangeContent: e => {
                    expect(e).to.not.be.undefined;
                    done();
                }
            });

            setTimeout(() => {
                const ogContent = `[{
                    command: "testCommand",
                    keybinding:"testKeyBinding2",
                    context: "testContext",
                }]`;
                fs.writeFileSync(FileUri.fsPath(userStorageUri), ogContent);
            }, 1000);
        });

    });

    describe('Should be able to read/write to a user storage file with a user storage uri', () => {

        it("Save to a user storage uri and read it", async () => {

            const uri = UserStorageUri.create(keymapsFile);
            await server.saveContents(uri.toString(), 'test');
            const content = await server.readContents(uri.toString());
            expect(content).to.be.equal('test');
        });

    });
});
