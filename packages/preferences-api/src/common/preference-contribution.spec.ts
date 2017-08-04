/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { PreferenceSchemaProvider } from './preference-contribution';
import { ContributionProvider, Logger } from '@theia/core/lib/common';
import { PreferenceContribution } from './preference-contribution'
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';


const expect = chai.expect;
let preferenceSchemaProvider: PreferenceSchemaProvider;

before(() => {
    chai.config.showDiff = true;
    chai.config.includeStack = true;
    chai.should();
    chai.use(chaiAsPromised);

    const prefProvider: ContributionProvider<PreferenceContribution> = {
        getContributions(): PreferenceContribution[] {
            return [
                {
                    schema: {
                        "type": "object",
                        "properties": {
                            "test": {
                                "type": "number",
                                "minimum": 1
                            },
                        }
                    }
                },
                {
                    schema: {
                        "type": "object",
                        "properties": {
                            "test2": {
                                "type": "boolean"
                            },
                        }
                    }
                }
            ]
        }
    }

    const logger = new Proxy<Logger>({} as any, {
        get: (target, name) => () => {
            if (name.toString().startsWith('is')) {
                return Promise.resolve(false);
            }
            if (name.toString().startsWith('if')) {
                return new Promise(resolve => { });
            }
        }
    });

    preferenceSchemaProvider = new PreferenceSchemaProvider(logger, prefProvider);
});

describe('PreferenceSchemaProvider', () => {
    it('The two different schemas are merged as one', () => {
        const mergedSchema = preferenceSchemaProvider.getSchema();
        expect(mergedSchema.properties["schema"]).to.be.equal({});

        console.log(mergedSchema);
    });

});