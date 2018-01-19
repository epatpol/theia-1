/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { JSONExt } from '@phosphor/coreutils';
import { injectable } from 'inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { Event, Emitter, DisposableCollection } from '@theia/core/lib/common';
import { PreferenceService, PreferenceChange } from './preference-protocol';
import { PreferenceProvider, NewPreferencesEvent } from './preference-protocol';

@injectable()
export class PreferenceServiceImpl implements PreferenceService, FrontendApplicationContribution {
    protected prefCache: { [key: string]: any }
        = {};

    protected readonly toDispose = new DisposableCollection();
    protected readonly onPreferenceChangedEmitter = new Emitter<PreferenceChange>();
    protected resolveReady: () => void;

    readonly ready = new Promise<void>(resolve => {
        this.resolveReady = resolve;
    });

    protected isReady: boolean = false;

    initialize() {
        this.preferenceProviders.forEach(async preferenceProvider => {
            preferenceProvider.init();
        });

        this.getPreferencesFromProviders();

        this.resolveReady();
        this.isReady = true;
    }

    constructor(protected readonly preferenceProviders: PreferenceProvider[]) {
        this.preferenceProviders.forEach(preferenceProvider => {
            preferenceProvider.setClient({
                onNewPreferences: event => this.onNewPreferences(event)
            });

            this.toDispose.push(preferenceProvider);
            // preferenceProvider.ready.then(() => {
            //     this.readyProviders.push(preferenceProvider);
            // });
        });
        /* Sorted so that providers with more priority i.e workspace > user override user settings if found */

        this.preferenceProviders.sort((provider1, provider2) =>
            provider1.priority - provider2.priority
        );
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    protected getPreferencesFromProviders() {

        const preferenceChanges: { [preferenceName: string]: PreferenceChange } = {};
        const deleted = new Set(Object.keys(this.prefCache));

        this.preferenceProviders.forEach(provider => {
            const prefs = provider.getPreferences();
            // tslint:disable-next-line:forin
            for (const preferenceName in prefs) {
                deleted.delete(preferenceName);
                const oldValue = this.prefCache[preferenceName];
                const newValue = prefs[preferenceName];
                if (oldValue) {
                    /* Value changed */
                    if (!JSONExt.deepEqual(oldValue, newValue)) {
                        preferenceChanges[preferenceName] = { preferenceName, newValue, oldValue };
                        this.prefCache[preferenceName] = newValue;
                    }
                    /* Value didn't change - Do nothing */
                } else {
                    /* New value without old value */
                    preferenceChanges[preferenceName] = { preferenceName, newValue };
                    this.prefCache[preferenceName] = newValue;
                }
            }
        });

        /* Deleted values */
        for (const preferenceName of deleted) {
            const oldValue = this.prefCache[preferenceName];
            preferenceChanges[preferenceName] = { preferenceName, oldValue };
            this.prefCache[preferenceName] = undefined;
        }
        // tslint:disable-next-line:forin
        for (const preferenceName in preferenceChanges) {
            this.onPreferenceChangedEmitter.fire(preferenceChanges[preferenceName]);
        }
    }

    protected onNewPreferences(event: NewPreferencesEvent): void {
        this.getPreferencesFromProviders();
    }

    get onPreferenceChanged(): Event<PreferenceChange> {
        return this.onPreferenceChangedEmitter.event;
    }

    has(preferenceName: string): boolean {
        // if (!this.isReady) {
        //     this.init();
        //     this.resolveReady();
        //     this.isReady = true;
        // }
        return this.prefCache[preferenceName] !== undefined;
    }

    get<T>(preferenceName: string): T | undefined;
    get<T>(preferenceName: string, defaultValue: T): T;
    get<T>(preferenceName: string, defaultValue?: T): T | undefined {
        // if (!this.isReady) {
        //     this.init();
        //     this.resolveReady();
        //     this.isReady = true;
        // }
        const value = this.prefCache[preferenceName];
        return value !== null && value !== undefined ? value : defaultValue;
    }

    getBoolean(preferenceName: string): boolean | undefined;
    getBoolean(preferenceName: string, defaultValue: boolean): boolean;
    getBoolean(preferenceName: string, defaultValue?: boolean): boolean | undefined {
        // if (!this.isReady) {
        //     this.init();
        //     this.resolveReady();
        //     this.isReady = true;
        // }
        const value = this.prefCache[preferenceName];
        return value !== null && value !== undefined ? !!value : defaultValue;
    }

    getString(preferenceName: string): string | undefined;
    getString(preferenceName: string, defaultValue: string): string;
    getString(preferenceName: string, defaultValue?: string): string | undefined {
        // if (!this.isReady) {
        //     this.init();
        //     this.resolveReady();
        //     this.isReady = true;
        // }
        const value = this.prefCache[preferenceName];
        if (value === null || value === undefined) {
            return defaultValue;
        }
        if (typeof value === "string") {
            return value;
        }
        return value.toString();
    }

    getNumber(preferenceName: string): number | undefined;
    getNumber(preferenceName: string, defaultValue: number): number;
    getNumber(preferenceName: string, defaultValue?: number): number | undefined {
        // if (!this.isReady) {
        //     this.init();
        //     this.resolveReady();
        //     this.isReady = true;
        // }
        const value = this.prefCache[preferenceName];

        if (value === null || value === undefined) {
            return defaultValue;
        }
        if (typeof value === "number") {
            return value;
        }
        return Number(value);
    }
}
