"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = __importDefault(require("selenium-webdriver/chrome"));
async function runTest() {
    const options = new chrome_1.default.Options();
    // options.addArguments("--headless"); // Uncomment for headless mode
    const driver = await new selenium_webdriver_1.Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    try {
        // Use an existing job number from the dropdown
        const testJobNo = '1234';
        const testQAP = 'QCE74MQAPBEF001'; // Use an existing QAP from the list
        console.log(`Opening stages list page for job ${testJobNo} to get existing stage numbers...`);
        await driver.get(`http://localhost:4200/jobs/${testJobNo}/stages`);
        await driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('table')), 5000);
        // Get all stage number cells from the table
        const stageNoCells = await driver.findElements(selenium_webdriver_1.By.xpath('//table//tr/td[1]'));
        const existingStageNos = [];
        for (const cell of stageNoCells) {
            const text = await cell.getText();
            const num = parseInt(text, 10);
            if (!isNaN(num)) {
                existingStageNos.push(num);
            }
        }
        console.log('Existing stage numbers:', existingStageNos);
        const newStageNo = existingStageNos.length > 0 ? Math.max(...existingStageNos) + 1 : 1;
        console.log('Using new unique stage number:', newStageNo);
        // Navigate to create-stage page
        console.log('Opening create-stage page...');
        await driver.get('http://localhost:4200/jobs/create-stage');
        await driver.wait(selenium_webdriver_1.until.titleContains('JobStageApp'), 5000);
        console.log('Waiting for form...');
        await driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('form')), 5000);
        // Fill the form fields with valid data
        console.log('Filling Job No select...');
        const jobNoSelect = await driver.findElement(selenium_webdriver_1.By.css('#jobNoSelect'));
        await jobNoSelect.click();
        await jobNoSelect.sendKeys(testJobNo, selenium_webdriver_1.Key.RETURN);
        // Wait for other fields to enable
        await driver.sleep(500);
        console.log('Filling Stage No...');
        const stageNoInput = await driver.findElement(selenium_webdriver_1.By.css('#stageNoInput'));
        await stageNoInput.clear();
        await stageNoInput.sendKeys(String(newStageNo));
        console.log('Filling Stage Description...');
        const stageDescInput = await driver.findElement(selenium_webdriver_1.By.css('#stageDescInput'));
        await stageDescInput.clear();
        await stageDescInput.sendKeys('Test Stage');
        console.log('Selecting Preceding Stage...');
        const precedingStageSelect = await driver.findElement(selenium_webdriver_1.By.css('#precedingStageSelect'));
        await precedingStageSelect.click();
        await precedingStageSelect.sendKeys('---', selenium_webdriver_1.Key.RETURN);
        console.log('Filling Start Date...');
        const startDateInput = await driver.findElement(selenium_webdriver_1.By.css('#startDateInput'));
        await startDateInput.clear();
        await startDateInput.sendKeys('2025-06-01');
        console.log('Filling End Date...');
        const endDateInput = await driver.findElement(selenium_webdriver_1.By.css('#endDateInput'));
        await endDateInput.clear();
        await endDateInput.sendKeys('2025-06-10');
        console.log('Selecting QAP...');
        const qapSelect = await driver.findElement(selenium_webdriver_1.By.css('#qapSelect'));
        await qapSelect.click();
        await qapSelect.sendKeys(testQAP, selenium_webdriver_1.Key.RETURN);
        // Submit the form
        console.log('Submitting the form...');
        const submitButton = await driver.findElement(selenium_webdriver_1.By.css('button[type=submit]'));
        await submitButton.click();
        // Handle the expected alert
        try {
            await driver.wait(selenium_webdriver_1.until.alertIsPresent(), 2000);
            const alert = await driver.switchTo().alert();
            console.log('Alert text:', await alert.getText());
            await alert.accept();
        }
        catch (err) {
            console.log('No alert present');
        }
        // Verify stage was created
        console.log(`Opening stages list for job ${testJobNo}...`);
        await driver.get(`http://localhost:4200/jobs/${testJobNo}/stages`);
        await driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('table')), 5000);
        // Verify the stage row exists
        const stageRows = await driver.findElements(selenium_webdriver_1.By.xpath(`//td[text()='${newStageNo}']`));
        if (stageRows.length > 0) {
            console.log('✅ Stage creation verified in list.');
            // Delete the stage
            console.log('Deleting the created stage...');
            const deleteButton = await driver.findElement(selenium_webdriver_1.By.xpath(`//td[text()='${newStageNo}']/following-sibling::td//button[contains(text(), 'Delete')]`));
            await deleteButton.click();
            // Handle delete confirmation alert if present
            try {
                await driver.wait(selenium_webdriver_1.until.alertIsPresent(), 2000);
                const alert = await driver.switchTo().alert();
                await alert.accept();
            }
            catch (err) {
                console.log('No delete confirmation alert present');
            }
            await driver.sleep(1000);
            // Confirm deletion
            const stageRowsAfterDelete = await driver.findElements(selenium_webdriver_1.By.xpath(`//td[text()='${newStageNo}']`));
            if (stageRowsAfterDelete.length === 0) {
                console.log('✅ Stage deleted successfully.');
            }
            else {
                console.error('❌ Stage still present after delete.');
            }
        }
        else {
            console.error('❌ Stage not found in list.');
            throw new Error('Stage verification failed.');
        }
    }
    catch (error) {
        console.error('Test failed:', error);
    }
    finally {
        await driver.quit();
    }
}
runTest();
