"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = __importDefault(require("selenium-webdriver/chrome"));
function runTest() {
    return __awaiter(this, void 0, void 0, function* () {
        const options = new chrome_1.default.Options();
        // options.addArguments("--headless"); // Uncomment for headless mode
        const driver = yield new selenium_webdriver_1.Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        try {
            // Use an existing job number from the dropdown
            const testJobNo = '1234';
            const testQAP = 'QCE74MQAPBEF001'; // Use an existing QAP from the list
            console.log(`Opening stages list page for job ${testJobNo} to get existing stage numbers...`);
            yield driver.get(`http://localhost:4200/jobs/${testJobNo}/stages`);
            yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('table')), 5000);
            // Get all stage number cells from the table
            const stageNoCells = yield driver.findElements(selenium_webdriver_1.By.xpath('//table//tr/td[1]'));
            const existingStageNos = [];
            for (const cell of stageNoCells) {
                const text = yield cell.getText();
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
            yield driver.get('http://localhost:4200/jobs/create-stage');
            yield driver.wait(selenium_webdriver_1.until.titleContains('JobStageApp'), 5000);
            console.log('Waiting for form...');
            yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('form')), 5000);
            // Fill the form fields with valid data
            console.log('Filling Job No select...');
            const jobNoSelect = yield driver.findElement(selenium_webdriver_1.By.css('#jobNoSelect'));
            yield jobNoSelect.click();
            yield jobNoSelect.sendKeys(testJobNo, selenium_webdriver_1.Key.RETURN);
            // Wait for other fields to enable
            yield driver.sleep(500);
            console.log('Filling Stage No...');
            const stageNoInput = yield driver.findElement(selenium_webdriver_1.By.css('#stageNoInput'));
            yield stageNoInput.clear();
            yield stageNoInput.sendKeys(String(newStageNo));
            console.log('Filling Stage Description...');
            const stageDescInput = yield driver.findElement(selenium_webdriver_1.By.css('#stageDescInput'));
            yield stageDescInput.clear();
            yield stageDescInput.sendKeys('Test Stage');
            console.log('Selecting Preceding Stage...');
            const precedingStageSelect = yield driver.findElement(selenium_webdriver_1.By.css('#precedingStageSelect'));
            yield precedingStageSelect.click();
            yield precedingStageSelect.sendKeys('---', selenium_webdriver_1.Key.RETURN);
            console.log('Filling Start Date...');
            const startDateInput = yield driver.findElement(selenium_webdriver_1.By.css('#startDateInput'));
            yield startDateInput.clear();
            yield startDateInput.sendKeys('2025-06-01');
            console.log('Filling End Date...');
            const endDateInput = yield driver.findElement(selenium_webdriver_1.By.css('#endDateInput'));
            yield endDateInput.clear();
            yield endDateInput.sendKeys('2025-06-10');
            console.log('Selecting QAP...');
            const qapSelect = yield driver.findElement(selenium_webdriver_1.By.css('#qapSelect'));
            yield qapSelect.click();
            yield qapSelect.sendKeys(testQAP, selenium_webdriver_1.Key.RETURN);
            // Submit the form
            console.log('Submitting the form...');
            const submitButton = yield driver.findElement(selenium_webdriver_1.By.css('button[type=submit]'));
            yield submitButton.click();
            // Handle the expected alert
            try {
                yield driver.wait(selenium_webdriver_1.until.alertIsPresent(), 2000);
                const alert = yield driver.switchTo().alert();
                console.log('Alert text:', yield alert.getText());
                yield alert.accept();
            }
            catch (err) {
                console.log('No alert present');
            }
            // Verify stage was created
            console.log(`Opening stages list for job ${testJobNo}...`);
            yield driver.get(`http://localhost:4200/jobs/${testJobNo}/stages`);
            yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('table')), 5000);
            // Verify the stage row exists
            const stageRows = yield driver.findElements(selenium_webdriver_1.By.xpath(`//td[text()='${newStageNo}']`));
            if (stageRows.length > 0) {
                console.log('✅ Stage creation verified in list.');
                // Delete the stage
                console.log('Deleting the created stage...');
                const deleteButton = yield driver.findElement(selenium_webdriver_1.By.xpath(`//td[text()='${newStageNo}']/following-sibling::td//button[contains(text(), 'Delete')]`));
                yield deleteButton.click();
                // Handle delete confirmation alert if present
                try {
                    yield driver.wait(selenium_webdriver_1.until.alertIsPresent(), 2000);
                    const alert = yield driver.switchTo().alert();
                    yield alert.accept();
                }
                catch (err) {
                    console.log('No delete confirmation alert present');
                }
                yield driver.sleep(1000);
                // Confirm deletion
                const stageRowsAfterDelete = yield driver.findElements(selenium_webdriver_1.By.xpath(`//td[text()='${newStageNo}']`));
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
            // Take screenshot for debugging
            const screenshot = yield driver.takeScreenshot();
            require('fs').writeFileSync('error.png', screenshot, 'base64');
            console.log('Screenshot saved as error.png');
        }
        finally {
            yield driver.quit();
        }
    });
}
runTest();
