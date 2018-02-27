/*
 * Copyright (C) 2018 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable } from 'inversify';
import { IApplicationServer, ExtensionInfo } from '../common/application-protocol';
import { ApplicationPackage } from '@theia/application-package/';

@injectable()
export class ApplicationServer implements IApplicationServer {

    applicationPackage: ApplicationPackage;
    constructor() {
        this.applicationPackage = new ApplicationPackage({ projectPath: process.cwd() });
    }

    getExtensionsInfos(): Promise<ExtensionInfo[]> {
        const infos: ExtensionInfo[] = [];
        const extensions = this.applicationPackage.extensionPackages;
        extensions.forEach(extension => {
            infos.push({ name: extension.name, version: extension.version });
        });
        return Promise.resolve(infos);
    }

}
