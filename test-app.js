const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded');
    
    // Screenshot 1: Member select screen
    await page.screenshot({ path: 'screenshot-1-member-select.png' });
    console.log('✓ Screenshot 1: Member select screen');
    
    // Click first member (檀上)
    const firstMember = page.locator('button.member-button').first();
    await firstMember.click();
    await page.waitForTimeout(500);
    console.log('✓ Clicked first member');
    
    // Screenshot 2: Input screen with member selected
    await page.screenshot({ path: 'screenshot-2-input-screen.png' });
    console.log('✓ Screenshot 2: Input screen');
    
    // Test tab switching - click file tab
    const fileTabs = page.locator('button.tab-button');
    const fileTab = fileTabs.nth(1);
    await fileTab.click();
    await page.waitForTimeout(300);
    console.log('✓ Clicked file tab');
    
    // Screenshot 3: File tab
    await page.screenshot({ path: 'screenshot-3-file-tab.png' });
    console.log('✓ Screenshot 3: File tab');
    
    // Click text tab
    const textTab = fileTabs.nth(2);
    await textTab.click();
    await page.waitForTimeout(300);
    console.log('✓ Clicked text tab');
    
    // Screenshot 4: Text tab
    await page.screenshot({ path: 'screenshot-4-text-tab.png' });
    console.log('✓ Screenshot 4: Text tab');
    
    // Test textarea
    const textarea = page.locator('.input-textarea');
    await textarea.fill('テストテキストです');
    console.log('✓ Filled textarea');
    
    // Screenshot 5: Text tab with input
    await page.screenshot({ path: 'screenshot-5-text-input.png' });
    console.log('✓ Screenshot 5: Text tab with input');
    
    // Test mobile responsive - resize to 400px
    await page.setViewportSize({ width: 400, height: 800 });
    await page.waitForTimeout(300);
    console.log('✓ Resized to mobile (400px)');
    
    // Screenshot 6: Mobile view
    await page.screenshot({ path: 'screenshot-6-mobile.png' });
    console.log('✓ Screenshot 6: Mobile view');
    
    // Test back button
    const backButton = page.locator('button.back-button');
    await backButton.click();
    await page.waitForTimeout(500);
    console.log('✓ Clicked back button');
    
    // Screenshot 7: Back to member select
    await page.screenshot({ path: 'screenshot-7-back-mobile.png' });
    console.log('✓ Screenshot 7: Back to member select (mobile)');
    
    // Resize back to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);
    
    // Screenshot 8: Member select on desktop
    await page.screenshot({ path: 'screenshot-8-desktop-member.png' });
    console.log('✓ Screenshot 8: Member select on desktop');
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();