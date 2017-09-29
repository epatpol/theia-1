/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core/lib/common';
import { userStoragePath, IUserStorageServer, UserStorageClient } from '../common/user-storage-protocol';
import { ContainerModule } from 'inversify';
import { UserStorageServer, UserStorageRoot } from './user-storage-server';
import { FileUri } from '@theia/core/lib/node';
import URI from '@theia/core/lib/common/uri';
import * as os from 'os';

export default new ContainerModule(bind => {

    const homeUri = FileUri.create(os.homedir());
    const userStorageUri: URI = homeUri.withPath(homeUri.path.join('.theia'));

    bind(UserStorageRoot).toConstantValue(userStorageUri);
    bind(UserStorageServer).toSelf().inSingletonScope();
    bind(IUserStorageServer).to(UserStorageServer);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler<UserStorageClient>(userStoragePath, client => {
            const server = ctx.container.get<UserStorageServer>(UserStorageServer);
            server.setClient(client);
            client.onDidCloseConnection(() => server.dispose());
            return server;
        })
    ).inSingletonScope();

});
