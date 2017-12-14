import "webdriverio";

export class TopPanel {

    public constructor(protected readonly driver: WebdriverIO.Client<void>) {

    }

    exists(): boolean {
        return this.driver.isExisting('div#theia-top-panel');
    }

    clickOnFileMenu() {
        this.driver.click('ul.p-MenuBar-content > .p-MenuBar-item:nth-child(1)');
        return this.driver.isExisting('.p-MenuBar-item');
    }

    displaysFileSubmenu() {
        this.clickOnFileMenu();
        return this.driver.isExisting('.p-Menu-content');
    }

    openNewTerminal() {
        this.clickMenuTab('File');
        this.clickSubMenu('New Terminal');
    }

    waitForTerminal() {
        this.driver.waitForExist('.p-Widget div.terminal.xterm');
    }

    isTerminalVisible(): boolean {
        return this.driver.isExisting('.p-Widget div.terminal.xterm');
    }

    closeTerminal() {
        this.driver.rightClick('.p-Widget.p-TabBar .p-TabBar-tab[title*=Terminal]');
        this.driver.element(`.p-Widget.p-Menu .p-Menu-content`).click(`div\=Close All`);
    }

    closeNewTerminal() {
        if (this.driver.isExisting('.p-TabBar-content')) {
            this.driver.click('li.p-TabBar-tab.p-mod-closable > .p-TabBar-tabCloseIcon');
        }
        return this.driver.isExisting('#xterm-cursor-layer');
    }

    clickOnOpen() {
        if (!this.driver.isExisting('.p-Menu-content')) {
            this.clickOnFileMenu();
        }
        this.driver.click('li.p-Menu-item:nth-child(5)');
        this.driver.waitForExist('.dialogTitle');
        return this.driver.isExisting('.dialogContent');
    }

    clickOnViewMenu() {
        this.driver.click('ul.p-MenuBar-content > .p-MenuBar-item:nth-child(4)');
        this.driver.isExisting('.p-MenuBar-item');
    }

    displayViewSubmenu() {
        this.clickOnViewMenu();
        return this.driver.isExisting('.p-Menu-content');
    }

    openProblemsView() {
        this.displayViewSubmenu();
        this.driver.click('li.p-Menu-item:nth-child(1)');
        this.driver.waitForExist('ul.p-TabBar-content');
        return (this.driver.getText('ul.p-TabBar-content > li.p-TabBar-tab.theia-mod-current.p-mod-closable.p-mod-current').indexOf('Problems') >= 0);
    }

    displaySubmenu() {
        return this.displaysFileSubmenu();
    }

    fileNewTerminalCloses() {
        return this.closeNewTerminal();
    }

    clickOpen() {
        return this.clickOnOpen();
    }

    clickOpenProblemsView() {
        return this.openProblemsView();
    }

    isSubMenuVisible(): boolean {
        return this.driver.isExisting('div.p-Widget.p-Menu.p-MenuBar-menu');
    }

    clickMenuTab(tab: number | string) {
        if (typeof tab === "string") {
            this.driver.element(`ul.p-MenuBar-content`).click(`div\=${tab}`);
        } else {
            this.driver.click(`ul.p-MenuBar-content > .p-MenuBar-item:nth-child(${tab})`);
        }
    }

    clickSubMenu(subMenuItem: string) {
        this.driver.element(`div.p-Widget.p-Menu.p-MenuBar-menu .p-Menu-content`).click(`div\=${subMenuItem}`);
    }

    hoverMenuTab(tabNumber: number) {
        this.driver.moveToObject(`ul.p-MenuBar-content > .p-MenuBar-item:nth-child(${tabNumber})`);
    }

    isTabActive(tabNumber: number): boolean {
        return this.driver.isExisting(`ul.p-MenuBar-content > .p-mod-active.p-MenuBar-item:nth-child(${tabNumber}`);
    }

    isMenuActive(): boolean {
        return this.driver.isExisting(`#theia\\:menubar.p-mod-active`);
    }

    getxBarTabPosition(tabNumber: number) {
        return this.driver.getLocation(`ul.p-MenuBar-content > .p-MenuBar-item:nth-child(${tabNumber}`, 'x');
    }

    getxSubMenuPosition(): number {
        return this.driver.getLocation(`div.p-Widget.p-Menu.p-MenuBar-menu`, 'x');
    }
}
