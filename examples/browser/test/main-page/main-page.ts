import "webdriverio";
import { TopPanel } from '../top-panel/top-panel';
import { LeftPanel } from '../left-panel/left-panel';

export class MainPage {

    protected readonly topPanel: TopPanel;
    protected readonly leftPanel: LeftPanel;

    constructor(protected readonly driver: WebdriverIO.Client<void>) {
        this.topPanel = new TopPanel(driver);
        this.leftPanel = new LeftPanel(driver);
    }

    mainContentPanelExists(): boolean {
        return this.driver.waitForExist('#theia-main-content-panel');
    }

    applicationShellExists(): boolean {
        return this.driver.waitForExist('#theia-main-content-panel');
    }

    theiaTopPanelExists(): boolean {
        return this.driver.waitForExist('#theia-top-panel');
    }

    rightSideBarExists(): boolean {
        return this.driver.waitForExist('div.theia-SideBar.theia-mod-right');
    }

    leftSideBarExists(): boolean {
        return this.driver.waitForExist('div.theia-SideBar.theia-mod-left');
    }

    statusBarExists(): boolean {
        return this.driver.waitForExist('div#theia-statusBar');
    }

    closeAll() {

    }

    // isFileNavigatorClosed() {
    //     this.mainContentPanelExists();
    //     if (this.driver.element('#files').getAttribute('class').split(' ').indexOf('p-mod-hidden') !== -1) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    // isFileNavigatorOpenOnClickingFiles() {
    //     if (this.isFileNavigatorClosed()) {
    //         this.driver.click('.p-TabBar-tab');
    //         return (!this.isFileNavigatorClosed());
    //     } else {
    //         return this.isFileNavigatorClosed();
    //     }
    // }

    // leftPanelMenuTabActive(tabNumber: Number) {
    //     this.driver.element(`ul.p-TabBar-content > .p-TabBar-tab:nth-child(${tabNumber})`);

    //     if (this.driver.element(`ul.p-TabBar-content > .p-TabBar-tab:nth-child(${tabNumber})`).getAttribute('class')
    //         .split(' ').indexOf('p-mod-current') !== -1) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    // leftPanelMenuExists(tabNumber: Number) {
    //     this.driver.click(`ul.p-TabBar-content > .p-TabBar-tab:nth-child(${tabNumber})`);
    //     return this.leftPanelMenuTabActive(tabNumber);
    // }

    // workspaceExists() {
    //     this.isFileNavigatorOpenOnClickingFiles();
    //     return this.driver.isVisible('#files');
    // }

    // gitContainerExists() {
    //     this.driver.click('ul.p-TabBar-content > .p-TabBar-tab:nth-child(2)');
    //     this.driver.element('ul.p-TabBar-content');
    //     return this.driver.isVisible('#theia-gitContainer');
    // }

    // extensionsContainerExists() {
    //     this.driver.click('ul.p-TabBar-content > .p-TabBar-tab:nth-child(3)');
    //     return this.driver.isVisible('#extensions');
    // }

    // waitForLoadingMenu() {
    //     browser.waitForExist('.p-Widget.p-Menu.p-MenuBar-menu');
    // }

    // topPanelMenuExists(tabNumber: Number) {
    //     this.driver.click(`ul.p-MenuBar-content > .p-MenuBar-item:nth-child(${tabNumber})`);
    //     return this.topPanelMenuTabActive(tabNumber);
    // }

    // topPanelMenuTabActive(tabNumber: Number) {
    //     if (this.driver.element(`ul.p-MenuBar-content > .p-MenuBar-item:nth-child(${tabNumber})`).getAttribute('class')
    //         .split(' ').indexOf('p-mod-active') !== -1) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    // loadFilePanels() {
    //     if (this.isFileNavigatorClosed()) {
    //         return this.isFileNavigatorOpenOnClickingFiles();
    //     } else {
    //         return this.isFileNavigatorOpenOnClickingFiles();
    //     }
    // }

    // leftMenuTabShows(number: any) {
    //     return this.leftPanelMenuTabActive(number);
    // }

    // leftMenuShowing(number: any) {
    //     return this.leftPanelMenuExists(number);
    // }

    // filesWorkspace() {
    //     return this.workspaceExists();
    // }

    // gitContainer() {
    //     return this.gitContainerExists();
    // }

    // extensionsContainer() {
    //     return this.extensionsContainerExists();
    // }

    // /*
    // * Tests for top menu
    // */
    // loadTopPanel() {
    //     this.topPanelExists();
    // }

    // topMenuTabShows(number: any) {
    //     return this.topPanelMenuTabActive(number);
    // }

    // topMenuShowing(number: any) {
    //     return this.topPanelMenuExists(number);
    // }

    // hoverMenuTab(tabNumber: number) {
    //     this.driver.moveToObject(`ul.p-MenuBar-content > .p-MenuBar-item:nth-child(${tabNumber})`);
    // }

    // /**
    //  * Selects one of the side tabs.
    //  * @param index the (0 based) index of the tab. If not present, the first tab (with 0 index) will be selected.
    //  */
    // clickSideTab(index: number = 0) {
    //     this.driver.click(`ul.p-TabBar-content > .p-TabBar-tab:nth-child(${index})`);
    // }

    // clickFilesSideTab() {
    //     this.clickSideTab(1);
    // }

    // isFileNavigatorOpen(): Boolean {
    //     return this.isSideTabActive(1);
    // }

    // isSideTabActive(index: number = 0): Boolean {
    //     return this.driver.element(`.p-TabBar-content > .p-TabBar-tab:nth-child(${index})`).getAttribute('class').split(' ').indexOf('p-mod-current') === 1;
    // }

    // isTabActive(tabNumber: number) {
    //     return this.driver.element(`ul.p-MenuBar-content > .p-MenuBar-item:nth-child(${tabNumber})`).getAttribute('class').split(' ').indexOf('p-mod-active') !== -1;
    // }

    // waitForLoadingPanels() {
    //     this.driver.waitForExist('#theia-top-panel');
    //     this.driver.waitForVisible('#theia-main-content-panel');
    // }

    // isMainContentPanelLoaded(): boolean {
    //     return this.driver.element('#theia-main-content-panel').state === 'success';
    // }
}
