import { expect } from "chai";
import { TopPanel } from "./top-panel";
import { MainPage } from '../main-page/main-page';

let topPanelComponent: TopPanel;

before(() => {
    const driver = browser;
    const url = '/';

    driver.url(url);
    topPanelComponent = new TopPanel(driver);
    const mainPage = new MainPage(driver);
    /* Make sure that the application shell is loaded */
    expect(mainPage.applicationShellExists()).to.be.true;
});

describe('theia top panel (menubar)', () => {
    it('should show the top panel', () => {
        expect(topPanelComponent.exists()).to.be.true;
    });

    it('should set a menu item active when hovered', () => {
        topPanelComponent.hoverMenuTab(1);
        expect(topPanelComponent.isTabActive(1)).to.be.true;

        topPanelComponent.hoverMenuTab(2);
        expect(topPanelComponent.isTabActive(1)).to.be.false;
        expect(topPanelComponent.isTabActive(2)).to.be.true;
    });

    it('should show menu correctly when clicked on a tab', () => {
        /* No menu at the start */
        expect(topPanelComponent.isSubMenuVisible()).to.be.false;

        /* Click on the first child */
        topPanelComponent.clickMenuTab(1);
        expect(topPanelComponent.isSubMenuVisible()).to.be.true;

        /* Click again to make the menu disappear */
        topPanelComponent.clickMenuTab(1);
        expect(topPanelComponent.isSubMenuVisible()).to.be.false;

        /* Make sure the menu location is directly under the bar tab */
        topPanelComponent.clickMenuTab(1);
        let tabX = topPanelComponent.getxBarTabPosition(1);
        let menuX = topPanelComponent.getxSubMenuPosition();
        expect(tabX).to.be.equal(menuX);

        /* Test with the second tab by hovering to the second one */
        topPanelComponent.hoverMenuTab(2);
        tabX = topPanelComponent.getxBarTabPosition(2);
        menuX = topPanelComponent.getxSubMenuPosition();
        expect(tabX).to.be.equal(menuX);

        topPanelComponent.clickMenuTab(2);
        expect(topPanelComponent.isSubMenuVisible()).to.be.false;
    });

    // it('File -> Open New Terminal', () => {
    //     expect(topPanelComponent.fileNewTerminalOpens()).to.be.true;
    // });

    // it('File -> Close New Terminal', () => {
    //     expect(topPanelComponent.fileNewTerminalCloses()).to.be.false;
    // });

    // it('File -> Click on View an then Open Problem View', () => {
    //     expect(topPanelComponent.clickOpenProblemsView()).to.be.true;
    // });

    // it('File -> Click on Open...', () => {
    //     expect(topPanelComponent.clickOpen()).to.be.true;
    // });
    describe('terminal ui tests', () => {
        it('should open a new terminal', () => {
            topPanelComponent.openNewTerminal();
            topPanelComponent.waitForTerminal();
            expect(topPanelComponent.isTerminalVisible()).to.be.true;

            topPanelComponent.closeTerminal();
            expect(topPanelComponent.isTerminalVisible()).to.be.false;
        });
    });
});
