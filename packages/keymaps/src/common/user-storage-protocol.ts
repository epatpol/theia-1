/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { JsonRpcServer } from '@theia/core';
export const userStoragePath = '/services/storage';
export const IUserStorageServer = Symbol('IUserStorageServer');
export interface IUserStorageServer extends JsonRpcServer<UserStorageClient> {
    readContents(uri: string): Promise<string>;
    saveContents(uri: string, content: string): Promise<void>;
}

export interface UserStorageClient {
    onDidChangeContent(contentChange: UserStorageChangeEvent): void;
}

export interface UserStorageChangeEvent {
    uris: string[];
}