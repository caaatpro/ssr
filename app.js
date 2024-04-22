const express = require("express");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { URL } = require("url");

const app = express();
const cacheDir = path.join(__dirname, "cache");

let browser;

app.get("/render", async (req, res) => {
  const originalUrl = req.query.url;
  console.log(`Original url: ${originalUrl}`);
  const urlObj = new URL(originalUrl);

  const pathPage200 = getPagePath200(urlObj.pathname);
  const pathPage404 = getPagePath404(urlObj.pathname);

  console.log(pathPage200);
  console.log(pathPage404);

  if (urlObj.searchParams.get("resetCache")) {
    removeCacheFile(pathPage200);
    removeCacheFile(pathPage404);

    console.log(`Cache file ${urlObj.pathname} reset.`);
  }

  if (urlObj.searchParams.get("resetAllCache")) {
    const cache200 = path.join(cacheDir, "200");
    const cache404 = path.join(cacheDir, "404");
    removeCacheDir(cache200);
    removeCacheDir(cache404);
    console.log(`All cache reset.`);
  }

  const url = urlObj.toString();

  if (checkCacheExist(pathPage200)) {
    console.log("Using cached result 200");
    console.log(pathPage200);
    const html = fs.readFileSync(pathPage200, "utf8");
    res.send(html);
    return;
  }

  if (checkCacheExist(pathPage404)) {
    console.log("Using cached result 404");
    console.log(pathPage404);
    const html = fs.readFileSync(pathPage404, "utf8");
    res.statusCode = 404;
    res.send(html);
    return;
  }


  const page = await browser.newPage();

  try {
    urlObj.search = "";
    urlObj.searchParams.append("ssrLazyVisible", "true");
    const modifiedUrl = urlObj.toString();

    console.log(modifiedUrl);

    console.log('go to url');
    const response = await page.goto(modifiedUrl);
    const status = response.status();
    console.log(`status: ${status}`);

    //console.log('waitForNavigation');
    //await page.waitForNavigation({ timeout: 60000 });

    console.log('get content');
    const html = await page.content();

    if (html.includes("page-404") || status != 200) {
      saveCache(pathPage404, html);
      res.status(404).send(html);
    } else {
      saveCache(pathPage200, html);
      res.send(html);
    }
  } catch(err) {
  	console.error('render error');
  	console.error(err);
  }
  finally {
    await page.close();
  }
});

// Start the server on port 3000
app.listen(3000, async () => {
  console.log("Server is running on port 3000");
  browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    headless: true,
    executablePath: "/usr/bin/chromium",
  });
  console.log('browser started');
});

function getPagePath404(pathPage) {
  return path.join(cacheDir, "404", pathPage, "index.html");
}

function getPagePath200(pathPage) {
  return path.join(cacheDir, "200", pathPage, "index.html");
}

function checkCacheExist(pathPage) {
  if (!fs.existsSync(pathPage)) {
    return false;
  }

  try {
    const cacheFileStats = fs.statSync(pathPage);
    if (
      cacheFileStats.isFile() &&
      cacheFileStats.ctime.getTime() + 24 * 60 * 60 * 1000 > Date.now()
    ) {
      console.log('Cache exist!');
      return true;
    }
  } catch (err) {
    console.log('Cache not exist!');
    return false;
  }
}

function removeCacheDir(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true });
  } catch (err) {
    console.error("Remove dir error!");
    console.error(err);
  }
}

function removeCacheFile(filePath) {
  try {
    fs.rmSync(filePath);
  } catch (err) {
    console.error("Remove file error!");
    console.error(err);
  }
}

function saveCache(filePath, fileContent) {
  console.log(`saveCache: ${filePath}`);

  const dirPath = path.dirname(filePath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(filePath, fileContent, "utf8");
}
