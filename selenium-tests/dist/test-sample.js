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
            // Step 1: Open the stage creation page
            yield driver.get('http://localhost:4200/jobs/create-stage');
            yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('form')), 5000);
            // Step 2: Fill the form
            const jobNoSelect = yield driver.findElement(selenium_webdriver_1.By.css('#jobNoSelect'));
            yield jobNoSelect.click();
            yield jobNoSelect.sendKeys('1001', selenium_webdriver_1.Key.RETURN);
            yield driver.findElement(selenium_webdriver_1.By.css('#stageNoInput')).sendKeys('1');
            yield driver.findElement(selenium_webdriver_1.By.css('#stageDescInput')).sendKeys('Initial Stage');
            const precedingStageSelect = yield driver.findElement(selenium_webdriver_1.By.css('#precedingStageSelect'));
            yield precedingStageSelect.click();
            yield precedingStageSelect.sendKeys('---', selenium_webdriver_1.Key.RETURN);
            yield driver.findElement(selenium_webdriver_1.By.css('#startDateInput')).sendKeys('2025-06-01');
            yield driver.findElement(selenium_webdriver_1.By.css('#endDateInput')).sendKeys('2025-06-10');
            const qapSelect = yield driver.findElement(selenium_webdriver_1.By.css('#qapSelect'));
            yield qapSelect.click();
            yield qapSelect.sendKeys('QAP123', selenium_webdriver_1.Key.RETURN); // Adjust to valid QAP
            // Step 3: Submit the form
            yield driver.findElement(selenium_webdriver_1.By.css('button[type=submit]')).click();
            // Step 4: Wait for confirmation or redirect
            yield driver.wait(selenium_webdriver_1.until.urlContains('/jobs'), 5000);
            const currentUrl = yield driver.getCurrentUrl();
            console.log('After submit, current URL:', currentUrl);
            // Optional: Print any page message
            try {
                const alertElem = yield driver.findElement(selenium_webdriver_1.By.css('.alert-success, .message, .alert'));
                const alertText = yield alertElem.getText();
                console.log('Page message:', alertText);
            }
            catch (_a) {
                console.log('No success message found on page.');
            }
            // Step 5: Open the stages list
            yield driver.get('http://localhost:4200/jobs/1001/stages');
            yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('table')), 5000);
            yield driver.sleep(1000); // Give time for data to populate
            // Step 6: Print table for debugging
            const tableText = yield driver.findElement(selenium_webdriver_1.By.css('table')).getText();
            console.log('Table content:\n', tableText);
            // Step 7: Verify the stage row exists
            const stageRows = yield driver.findElements(selenium_webdriver_1.By.xpath("//td[text()='1']"));
            if (stageRows.length > 0) {
                console.log('✅ Stage creation verified in list.');
                // Step 8: Delete the stage
                const deleteButton = yield driver.findElement(selenium_webdriver_1.By.xpath("//td[text()='1']/following-sibling::td//button[contains(text(), 'Delete')]"));
                yield deleteButton.click();
                yield driver.sleep(1000);
                // Step 9: Confirm deletion
                const stageRowsAfterDelete = yield driver.findElements(selenium_webdriver_1.By.xpath("//td[text()='1']"));
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
            yield driver.quit();
        }
    });
}
runTest();
