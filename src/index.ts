import express from 'express'
import puppeteer from 'puppeteer';
import cheerio from 'cheerio';


const app = express();
const PORT = 8082;

async function initPage() {
  // Wait for browser launching.
  const browser = await puppeteer.launch({
    args: [
      // Required for Docker version of Puppeteer
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // This will write shared memory files into /tmp instead of /dev/shm,
      // because Docker’s default for /dev/shm is 64MB
      '--disable-dev-shm-usage'
    ]
  });
  // Wait for creating the new page.
  page = await browser.newPage();

  const path = 'http://mock:80';
  await page.goto(path, {
    waitUntil: 'networkidle2',
  });

  return page;
}

async function getSensorData(page: any) {
  const content = await page.content();

  const $ = cheerio.load(content);
  return $('tr').map((i:number, element:any) => ({
    name: $(element).find('td:nth-of-type(1)').text().trim(),
    active: $(element).find('td:nth-of-type(2)').text().trim()
    })).get()
}

let page:any = false;

app.use(express.static('./static'));
app.get('/sensors', async (req, res) => {
  if (!(page)) {
    page = await initPage();
  }
  const sensors = await getSensorData(page);
  res.json(sensors);
});
app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
