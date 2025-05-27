import { Builder, By, until, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function runTest() {
  const options = new chrome.Options();
  // options.addArguments("--headless"); // Uncomment for headless mode

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // Step 1: Open the stage creation page
    await driver.get('http://localhost:4200/jobs/create-stage');
    await driver.wait(until.elementLocated(By.css('form')), 5000);

    // Step 2: Fill the form
    const jobNoSelect = await driver.findElement(By.css('#jobNoSelect'));
    await jobNoSelect.click();
    await jobNoSelect.sendKeys('1001', Key.RETURN);

    await driver.findElement(By.css('#stageNoInput')).sendKeys('1');
    await driver.findElement(By.css('#stageDescInput')).sendKeys('Initial Stage');

    const precedingStageSelect = await driver.findElement(By.css('#precedingStageSelect'));
    await precedingStageSelect.click();
    await precedingStageSelect.sendKeys('---', Key.RETURN);

    await driver.findElement(By.css('#startDateInput')).sendKeys('2025-06-01');
    await driver.findElement(By.css('#endDateInput')).sendKeys('2025-06-10');

    const qapSelect = await driver.findElement(By.css('#qapSelect'));
    await qapSelect.click();
    await qapSelect.sendKeys('QAP123', Key.RETURN); // Adjust to valid QAP

    // Step 3: Submit the form
    await driver.findElement(By.css('button[type=submit]')).click();

    // Step 4: Wait for confirmation or redirect
    await driver.wait(until.urlContains('/jobs'), 5000);
    const currentUrl = await driver.getCurrentUrl();
    console.log('After submit, current URL:', currentUrl);

    // Optional: Print any page message
    try {
      const alertElem = await driver.findElement(By.css('.alert-success, .message, .alert'));
      const alertText = await alertElem.getText();
      console.log('Page message:', alertText);
    } catch {
      console.log('No success message found on page.');
    }

    // Step 5: Open the stages list
    await driver.get('http://localhost:4200/jobs/1001/stages');
    await driver.wait(until.elementLocated(By.css('table')), 5000);
    await driver.sleep(1000); // Give time for data to populate

    // Step 6: Print table for debugging
    const tableText = await driver.findElement(By.css('table')).getText();
    console.log('Table content:\n', tableText);

    // Step 7: Verify the stage row exists
    const stageRows = await driver.findElements(By.xpath("//td[text()='1']"));
    if (stageRows.length > 0) {
      console.log('✅ Stage creation verified in list.');

      // Step 8: Delete the stage
      const deleteButton = await driver.findElement(
        By.xpath("//td[text()='1']/following-sibling::td//button[contains(text(), 'Delete')]")
      );
      await deleteButton.click();
      await driver.sleep(1000);

      // Step 9: Confirm deletion
      const stageRowsAfterDelete = await driver.findElements(By.xpath("//td[text()='1']"));
      if (stageRowsAfterDelete.length === 0) {
        console.log('✅ Stage deleted successfully.');
      } else {
        console.error('❌ Stage still present after delete.');
      }
    } else {
      console.error('❌ Stage not found in list.');
      throw new Error('Stage verification failed.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await driver.quit();
  }
}

runTest();
