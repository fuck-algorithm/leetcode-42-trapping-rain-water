const { chromium } = require('playwright');
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1366,height:768},recordVideo:{dir:'docs/evidence/round-3/video'},reducedMotion:'no-preference'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:48046');
 for(const tab of ['twoPointers','precomputation','monotonicStack','bruteForce','rowByRow']){
   await page.getByTestId(`tab-button-${tab}`).click();
   await page.waitForTimeout(700);
   await page.getByTitle('下一步 (→)').click();
   await page.waitForTimeout(1050);
   await page.getByTitle('下一步 (→)').click();
 }
 for(let i=0;i<3;i++){
   const id=['twoPointers','precomputation','monotonicStack','bruteForce','rowByRow'][i];
   await page.getByTestId(`tab-button-${id}`).click();
   await page.waitForTimeout(120);
 }
 const report={errors,activeTab:(await page.locator('.tab-button.active').textContent())?.trim(),title:await page.title()};
 console.log(JSON.stringify(report,null,2));
 await browser.close();
})();
