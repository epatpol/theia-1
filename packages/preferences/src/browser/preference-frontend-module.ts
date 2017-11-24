/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { ContainerModule, } from 'inversify';
import { PreferenceService, PreferenceServiceImpl } from "@theia/preferences-api/lib/browser/";
import { PreferenceProviderUser } from './preference-provider-user';
import { PreferenceProviderWorkspace } from './preference-provider-workspace';

export default new ContainerModule(bind => {

    bind(PreferenceProviderUser).toSelf().inSingletonScope();
    bind(PreferenceProviderWorkspace).toSelf().inSingletonScope();

    bind(PreferenceService).toDynamicValue(ctx => {
        const userProvider = ctx.container.get<PreferenceProviderUser>(PreferenceProviderUser);
        const workspaceProvider = ctx.container.get<PreferenceProviderWorkspace>(PreferenceProviderWorkspace);

        return new PreferenceServiceImpl([userProvider, workspaceProvider]);
    }).inSingletonScope();
});
