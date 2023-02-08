import puppeteer from 'puppeteer';
import express from 'express';

// sane defaults for host and port
const host    = process.env.HOST || '0.0.0.0';
const port    = process.env.PORT || 3000;

// express application
const app = express();

function error(status, msg)
{
    return {
        status: status,
        msg: msg
    };
}

// use json requests
app.use(express.json());

// screenshot api
app.post('/api/screenshot', async (req, res) =>
{
    let args = {};

    if(req.body.url === undefined)
    {
        res.status(400);
        res.send(error(400, 'field [url] required'));
        return;
    }
        
    if(req.body.delay === undefined)
    {
        res.status(400);
        res.send(error(400, 'field [delay] required'));
        return;
    }

    // populate args
    args.url   = new URL(req.body.url);
    args.delay = parseInt(req.body.delay);
    
    // sleep function
    const sleep = (milliseconds) =>
    {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
    
    try
    {
        // open the browser ...
        const browser = await puppeteer.launch({
            executablePath: process.env.CHROME_EXECUTABLE || undefined,
            headless: true,
            args: [
                '--no-sandbox',
                '--use-gl=egl',
            ],
        });

        // ... to a new page ...
        const page = await browser.newPage();
        
        // ... and navigate to the provided url ...
        await page.goto(args.url);

        // ... then wait for x milliseconds ...
        await sleep(args.delay);
        
        // ... then capture screenshot as base64 encoded data ...
        const screenshot = await page.screenshot({encoding: 'base64'});
        
        // ... and close the browser
        browser.close();
        
        // respond with the image data
        res.status(200);
        res.send({'image-data': `data:image/png;base64,${screenshot}`});
    }
    catch(err)
    {
        // something went wrong
        res.status(500);
        res.send({'error': 'something has gone horribly wrong, contact the administrator.'});
        console.log(err);
    }
});

// start server
app.listen(port, host, () =>
{
    console.log(`Running on: http://${host}:${port}`);
});
