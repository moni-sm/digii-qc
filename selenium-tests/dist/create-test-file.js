"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = __importDefault(require("selenium-webdriver/chrome"));
async function runErrorTests() {
    const options = new chrome_1.default.Options();
    // options.addArguments("--headless");
    const driver = await new selenium_webdriver_1.Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    // Configuration
    const TEST_JOB_NO = '1234';
    const TEST_QAP = 'QCE74MQAPBEF001';
    const EXISTING_STAGE = '1';
    const NEW_STAGE_1 = '9991'; // Unique for Stage 1 tests
    const NEW_STAGE_2 = '9992'; // Unique for Stage 2 tests
    // Enhanced error detection
    async function getVisibleErrors() {
        await driver.sleep(1000);
        const errors = new Set();
        const errorSelectors = [
            '[class*="error"]',
            '[class*="invalid"]',
            '.text-red-500',
            '.text-red-600',
            '[role="alert"]',
            '[id*="Error"]',
            'form .invalid-feedback'
        ];
        for (const selector of errorSelectors) {
            try {
                const elements = await driver.findElements(selenium_webdriver_1.By.css(selector));
                for (const element of elements) {
                    if (await element.isDisplayed()) {
                        const text = (await element.getText()).trim();
                        if (text)
                            errors.add(text);
                    }
                }
            }
            catch { }
        }
        return errors;
    }
    // Improved error verification
    async function verifyError(expected) {
        const errors = await getVisibleErrors();
        const found = Array.from(errors).some(error => error.toLowerCase().includes(expected.toLowerCase()));
        console.log(found ? `✅ Found: "${expected}"` : `❌ Missing: "${expected}"`);
        return found;
    }
    // Helper to select from preceding stage dropdown
    async function selectPrecedingStage(optionValue) {
        const select = await driver.findElement(selenium_webdriver_1.By.css('#precedingStageSelect'));
        await select.click();
        await select.sendKeys(optionValue, selenium_webdriver_1.Key.RETURN);
        await driver.sleep(300); // Allow time for selection to apply
    }
    try {
        await driver.get('http://localhost:4200/jobs/create-stage');
        await driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('form')), 10000);
        const submitButton = await driver.findElement(selenium_webdriver_1.By.css('button[type="submit"]'));
        // ===== TEST 1: Empty form validation =====
        console.log('\n=== Testing empty form validation ===');
        await submitButton.click();
        if (!(await verifyError('Job No is required'))) {
            throw new Error('Job No required validation failed');
        }
        // ===== TEST 2: Fill Job No only =====
        console.log('\n=== Testing Job No only ===');
        const jobNoSelect = await driver.findElement(selenium_webdriver_1.By.css('#jobNoSelect'));
        await jobNoSelect.sendKeys(TEST_JOB_NO, selenium_webdriver_1.Key.RETURN);
        await driver.sleep(500);
        await submitButton.click();
        const requiredErrors = [
            'Stage No is required',
            'Description is required',
            'Start date is required',
            'End date is required',
            'QAP is required'
        ];
        for (const error of requiredErrors) {
            if (!(await verifyError(error))) {
                console.warn(`Warning: ${error} not found`);
            }
        }
        // ===== TEST 3: Duplicate stage number =====
        console.log('\n=== Testing duplicate stage ===');
        await (await driver.findElement(selenium_webdriver_1.By.css('#stageNoInput'))).sendKeys(EXISTING_STAGE);
        await (await driver.findElement(selenium_webdriver_1.By.css('#stageDescInput'))).sendKeys('Test Description');
        await submitButton.click();
        if (!(await verifyError('Stage number already exists'))) {
            throw new Error('Duplicate stage validation failed');
        }
        // Reset form
        await (await driver.findElement(selenium_webdriver_1.By.css('#stageNoInput'))).clear();
        await (await driver.findElement(selenium_webdriver_1.By.css('#stageDescInput'))).clear();
        // ===== TEST 4: Stage 1 Preceding Stage Validation =====
        console.log('\n=== Stage 1 Preceding Stage Validation ===');
        // Wait for preceding stage dropdown
        const precedingStageSelect = await driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('#precedingStageSelect')), 5000);
        // Generate a unique stage number for testing
        const uniqueStageNo = Date.now().toString().slice(-4); // Creates a 4-digit number
        // Fill required fields with unique stage number
        await (await driver.findElement(selenium_webdriver_1.By.css('#stageNoInput'))).clear();
        await (await driver.findElement(selenium_webdriver_1.By.css('#stageNoInput'))).sendKeys(uniqueStageNo);
        await (await driver.findElement(selenium_webdriver_1.By.css('#stageDescInput'))).sendKeys('Test Stage');
        await (await driver.findElement(selenium_webdriver_1.By.css('#startDateInput'))).sendKeys('2025-06-01');
        await (await driver.findElement(selenium_webdriver_1.By.css('#endDateInput'))).sendKeys('2025-06-10');
        await (await driver.findElement(selenium_webdriver_1.By.css('#qapSelect'))).sendKeys(TEST_QAP, selenium_webdriver_1.Key.RETURN);
        // Test with empty/--- preceding stage (should be valid)
        await precedingStageSelect.click();
        await precedingStageSelect.sendKeys('---', selenium_webdriver_1.Key.RETURN);
        await driver.sleep(500); // Wait for selection to apply
        // Submit and check for errors
        await submitButton.click();
        await driver.sleep(1000); // Wait for validation
        // Get all visible errors
        const errors = await getVisibleErrors();
        // Filter out just the error messages (ignore form labels and other text)
        const errorMessages = Array.from(errors).filter(msg => !msg.includes('Create Stage for Job') &&
            !msg.includes('Job No') &&
            !msg.includes('Stage No') &&
            !msg.includes('Stage Description') &&
            !msg.includes('Preceding Stage') &&
            !msg.includes('Start Date') &&
            !msg.includes('End Date') &&
            !msg.includes('QAP') &&
            !msg.includes('Select') &&
            !msg.includes('Add Stage'));
        if (errorMessages.length > 0) {
            console.error('❌ Errors found with empty/--- preceding stage:', errorMessages);
            throw new Error('Stage 1 should accept empty/--- preceding stage without errors');
        }
        console.log('✅ Stage 1 properly accepts empty/--- preceding stage');
        console.log('\n🎉 Stage 1 validation passed!');
        console.log('\n=== Test 5: QAP Validation ===');
        // Refresh the page to reset the form
        await driver.navigate().refresh();
        await driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('form')), 5000);
        // Fill Job No
        const jobNoSelectQAP = await driver.findElement(selenium_webdriver_1.By.css('#jobNoSelect'));
        await jobNoSelectQAP.click();
        await jobNoSelectQAP.sendKeys(TEST_JOB_NO, selenium_webdriver_1.Key.RETURN);
        await driver.sleep(500);
        // Fill required fields except QAP
        const stageNoInput = await driver.findElement(selenium_webdriver_1.By.css('#stageNoInput'));
        await stageNoInput.clear();
        await stageNoInput.sendKeys('9999');
        await (await driver.findElement(selenium_webdriver_1.By.css('#stageDescInput'))).sendKeys('Test Stage');
        await (await driver.findElement(selenium_webdriver_1.By.css('#startDateInput'))).sendKeys('2025-06-01');
        await (await driver.findElement(selenium_webdriver_1.By.css('#endDateInput'))).sendKeys('2025-06-10');
        await (await driver.findElement(selenium_webdriver_1.By.css('#precedingStageSelect'))).sendKeys('---', selenium_webdriver_1.Key.RETURN);
        // Submit the form without QAP
        const submitButtonQAP = await driver.findElement(selenium_webdriver_1.By.css('button[type="submit"]'));
        await submitButtonQAP.click();
        await driver.sleep(500); // wait for validation
        // Verify QAP error
        const qapError = await verifyError('QAP is required');
        if (!qapError)
            throw new Error('❌ QAP validation failed (missing error for empty QAP)');
        console.log('✅ QAP validation failure correctly shown when QAP is not selected');
        // === Now select QAP and submit successfully ===
        console.log('\n=== Retesting with QAP selected ===');
        // Select QAP
        const qapSelect = await driver.findElement(selenium_webdriver_1.By.css('#qapSelect'));
        await qapSelect.click();
        await qapSelect.sendKeys(TEST_QAP, selenium_webdriver_1.Key.RETURN);
        await driver.sleep(300);
        // Submit again
        await submitButtonQAP.click();
        // Handle alert (if success uses alert)
        try {
            await driver.wait(selenium_webdriver_1.until.alertIsPresent(), 2000);
            const alert = await driver.switchTo().alert();
            console.log('✅ Alert:', await alert.getText());
            await alert.accept();
        }
        catch {
            console.log('⚠️ No alert shown after submission');
        }
        // Confirm stage creation by going to list
        await driver.get(`http://localhost:4200/jobs/${TEST_JOB_NO}/stages`);
        await driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('table')), 5000);
        // Verify the new stage is present
        const newStageRow = await driver.findElements(selenium_webdriver_1.By.xpath(`//td[text()='9999']`));
        if (newStageRow.length > 0) {
            console.log('✅ Stage with QAP created successfully and listed.');
        }
        else {
            throw new Error('❌ Stage not found after QAP selection and submit.');
        }
        console.log('\n🎉 All validation tests passed!');
    }
    finally {
        await driver.quit();
    }
}
runErrorTests().catch(() => {
    console.error('Test execution failed');
    process.exit(1);
});
