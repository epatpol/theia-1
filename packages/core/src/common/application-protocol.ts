/*
 * Copyright (C) 2018 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

export const applicationPath = '/services/application';

export const IApplicationServer = Symbol('IApplicationServer');

export interface IApplicationServer {
    getExtensionsInfos(): Promise<ExtensionInfo[]>;
}

export interface ExtensionInfo {
    name: string;
    version: string;
}
