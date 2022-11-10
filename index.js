const puppeteer = require("puppeteer");
const fs = require("fs");

let stack = {};
let companyNames = [];

// load from file
try {
  const data = fs.readFileSync("stack.json");
  stack = JSON.parse(data);

  const data2 = fs.readFileSync("companyNames.json");
  companyNames = JSON.parse(data2);
} catch (e) {
  console.log("Error:", e);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    "https://www.welcometothejungle.com/fr/jobs?page=2&groupBy=job&sortBy=mostRelevant&query=fullstack&aroundQuery=Paris%2C%20France&aroundLatLng=48.85718%2C2.34141&aroundRadius=20000"
  );

  // wait for navigation to finish
  await page.waitForSelector("section.sc-8lzkc1-0.hSsBuD > div > ol > li");

  // click on selector
  await page.click(
    "#prc-1-1-1 > div > section.sc-8lzkc1-0.dKsUBG > div > div > div > ul > li.ais-Pagination-item.ais-Pagination-item--nextPage > a"
  );

  const offerLinks = await page.evaluate(async () => {
    const listItems = document.querySelectorAll(
      "section.sc-8lzkc1-0.hSsBuD > div > ol > li"
    );

    // get link
    const links = Array.from(listItems).map((item) => {
      return item.querySelector("a").href;
    });

    return links;
  });

  for (let i = 0; i < offerLinks.length; i++) {
    // goto first link
    await page.goto(offerLinks[i]);

    const url = page.url();
    const companyName = url.split("/")[5];

    console.log(url);

    if (companyNames.includes(companyName) && companyName !== undefined) {
      console.log("Company already exists:", companyName);
      continue;
    }

    companyNames.push(companyName);

    // click on selector
    await page.waitForSelector("#prc-1-1-1 > main > section > div > a");
    await page.click("#prc-1-1-1 > main > section > div > a");
    // find "tech" in a tag
    try {
      await page.waitForSelector("[data-testid='organization-nav-link-tech']", {
        timeout: 1500,
      });
    } catch {
      continue;
    }

    await page.click("[data-testid='organization-nav-link-tech']");

    await page.waitForSelector("#stacks-0 > ul > li > article > header > h5");
    const techs = await page.evaluate(async () => {
      const techList = document.querySelectorAll(
        "#stacks-0 > ul > li > article > header > h5"
      );

      const techs = Array.from(techList).map((item) => {
        return item.textContent;
      });

      return techs;
    });

    techs.forEach((tech) => {
      if (stack[tech]) {
        stack[tech] += 1;
      } else {
        stack[tech] = 1;
      }
    });
    // go back
    await page.goBack();
    // go back again
    await page.goBack();
    // sort stack by dsc
    const sortedStack = Object.fromEntries(
      Object.entries(stack).sort(([, a], [, b]) => b - a)
    );

    // write to file
    fs.writeFile("stack.json", JSON.stringify(sortedStack), (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });

    fs.writeFile("companyNames.json", JSON.stringify(companyNames), (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
    // console log current page url
  }
})();
