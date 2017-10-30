/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

// import * as os from 'os';
import { ContainerModule } from 'inversify';
// import URI from "@theia/core/lib/common/uri";
// import { FileUri } from '@theia/core/lib/node';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core/lib/common';
// import { WorkspaceServer } from '@theia/workspace/lib/common';
import { WorkspacePreferenceServer, UserPreferenceServer } from '@theia/preferences-api/lib/common/preference-protocol'
import { PreferenceService, PreferenceClient, PreferenceServer, preferencesPath } from '../common';
import { CompoundPreferenceServer } from './';
import { PreferenceServerImpl, /* JsonPreferenceServer, JsonPreferenceServerImpl *//* , PreferenceUri */ } from './json-preference-server';

// /*
//  * Workspace preference server that watches the current workspace
//  */
// export const WorkspacePreferenceServer = Symbol('WorkspacePreferenceServer');
// export type WorkspacePreferenceServer = PreferenceServerImpl;

// /*
//  * User preference server that watches the home directory of the user
//  */
// export const UserPreferenceServer = Symbol('UserPreferenceServer');
// export type UserPreferenceServer = PreferenceServerImpl;

export default new ContainerModule(bind => {

    // bind<JsonPreferenceServer>(JsonPreferenceServer).to(JsonPreferenceServerImpl);

    bind(PreferenceServerImpl).toSelf();

    bind(UserPreferenceServer).to(PreferenceServerImpl);
    bind(WorkspacePreferenceServer).to(PreferenceServerImpl);

    // bind(JsonPreferenceServer).toDynamicValue(ctx =>
    //     ctx.container.get<JsonPreferenceServer>(JsonPreferenceServer)
    // );

    // bind(UserPreferenceServer).toDynamicValue(ctx => {
    //     // const homeUri = FileUri.create(os.homedir());
    //     // const uri = homeUri.withPath(homeUri.path.join('.theia', 'settings.json'));

    //     const child = ctx.container.createChild();
    //     child.bind(JsonPreferenceServer).toSelf();

    //     // child.bind(PreferenceUri).toConstantValue(uri);
    //     return child.get(PreferenceServerImpl);
    // }).inSingletonScope();

    // bind(WorkspacePreferenceServer).toDynamicValue(ctx => {
    //     // const workspaceServer = ctx.container.get<WorkspaceServer>(WorkspaceServer);
    //     // const uri = workspaceServer.getRoot().then(root => {
    //     //     const rootUri = new URI(root);
    //     //     return rootUri.withPath(rootUri.path.join('.theia', 'settings.json'));
    //     // });
    //     const child = ctx.container.createChild();
    //     child.bind(JsonPreferenceServer).toSelf();
    //     return child.get(PreferenceServerImpl);
    // });

    bind(CompoundPreferenceServer).toSelf();

    bind(PreferenceServer).toDynamicValue(ctx => {
        const userServer = ctx.container.get<UserPreferenceServer>(UserPreferenceServer);
        const workspaceServer = ctx.container.get<WorkspacePreferenceServer>(WorkspacePreferenceServer);
        return new CompoundPreferenceServer(workspaceServer, userServer);
    });

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler<PreferenceClient>(preferencesPath, client => {
            const server = ctx.container.get<PreferenceServer>(PreferenceServer);
            server.setClient(client);
            client.onDidCloseConnection(() => { server.dispose(); });
            return server;
        })
    );

    bind(PreferenceService).toSelf();
});
