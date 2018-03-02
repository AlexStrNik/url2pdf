const exec = require('child_process').exec;
const puppeteer = require('puppeteer');
const fs = require('fs');

let path = `${process.cwd()}\\downloads`;
if(!fs.existsSync(path)){
    fs.mkdirSync(path);
}

function file2pdf(filename,cb) {
    exec(`${fs.realpathSync('.\\\\')}\\OfficeToPdf.exe "${filename}" "${filename.split('.')[0]}.pdf"`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            cb(err,undefined)
        }
    });
    cb(undefined,`${filename.split('.')[0]}.pdf`);
}
async function url2pdf(browser,url,cb) {
    const page = await browser.newPage();
    if(!url.startsWith('https://cloud.mail.ru/public')){
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['stylesheet', 'image', 'font','other'].indexOf(request.resourceType()) !== -1) { //'stylesheet', 'image', 'font'
                request.abort();
            } else {
                request.continue();
            }
        });
    }

    try{
        await page.goto(url, {timeout: 60000, waitUntil: 'load'});
    }
    catch (e){cb(e,url)}
    await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: path});
    switch (true){
        case url.startsWith('https://yadi.sk'):
            console.log('Hey >> YandexDisk');
            try {
                await page.click('.download-button');
                return
            }
            catch (e){return cb(e,url)}
            break;
        case url.startsWith('https://drive.google.com'):
            console.log('Hey >> GoogleDrive');
            try {
                await page.goto(`https://drive.google.com/uc?authuser=0&id=${url.split('/')[url.split('/').length-2]}&export=download`);
                return
            }
            catch (e){return cb(e,url)}
            break;
        case url.startsWith('https://cloud.mail.ru/public'):
            console.log('Hey >> MailCloud');
            try {
                await page.waitForSelector('#toolbar > div > div.b-toolbar__group.b-toolbar__group_left > div.b-toolbar__item.b-toolbar__item_selectAll', {visible:true});
                await page.click('#toolbar > div > div.b-toolbar__group.b-toolbar__group_left > div.b-toolbar__item.b-toolbar__item_selectAll');
                await page.waitForSelector('#toolbar > div > div.b-toolbar__group.b-toolbar__group_left > div.b-toolbar__item.b-toolbar__item_main.b-toolbar__item_download', {visible:true});
                await page.click('#toolbar > div > div.b-toolbar__group.b-toolbar__group_left > div.b-toolbar__item.b-toolbar__item_main.b-toolbar__item_download');
                return
            }
            catch (e){return cb(e,url)}
            break;
        case url.startsWith('https://docs.google.com/document'):
            console.log('Hey >> GoogleDocs');
            try {
                await page.goto(`https://docs.google.com/document/export?format=docx&id=${url.split('/')[url.split('/').length-2]}&includes_info_params=true`);
                return
            }
            catch (e){return cb(e,url)}
            break;
        case url.startsWith('http://cloud.it-help247.ru'):
            try {
                await page.goto(`${url}/download`);
                return
            }
            catch (e){return cb(e,url)}
            break;
        default:
            return cb('Err >> StrangeUrl',url);
    }
    //await page.close();
}

async function json2pdf(json) {
    let urls = [];
    function callback(err,unt) {
        if(unt){
            console.warn(err);
            urls.push(unt);
        }
    }
    puppeteer.launch({headless: false}).then(async browser => {
        for(let i in json){
            let urls = json[i].url;
            for(let u in urls){
                let url = urls[u];
                await url2pdf(browser,url,callback);
            }
        }
    });
    return(urls)
}
function downloads2pdf(dwnld_path = path) {
    let urls = [];
    let paths = [];
    function callback(err,path) {
        if(err){
            console.warn(err);
        }
        paths.push(path);
    }
    fs.readdirSync(dwnld_path).forEach(file => {
        file2pdf(path+'\\'+file,callback)
    });
    return [urls,paths];
}
downloads2pdf('./downloads');
/*
json2pdf([
    {
        "descripition": "\"https://drive.google.com/file/d/1Hi0-Yfz3rOpl72MLyoBFTK8oxmRh1-yu/view?usp=sharing Техническое задание\"",
        "zakupkiObjectId": 158235,
        "url": [
            "https://drive.google.com/file/d/1Hi0-Yfz3rOpl72MLyoBFTK8oxmRh1-yu/view?usp=sharing"
        ]
    },
    {
        "descripition": "\"Участник не должен состоять в РНП. Проект Контракта и Техническое задание расположены по ссылке: https://docs.google.com/document/d/1smCMr7mlBmVl8InUeuMS9vfznHHZxyFvDcR_g0ApjGM/edit?usp=sharing Срок подписания Контракта со стороны Поставщика (победителя мини-аукциона) не должен превышать 3 (три) рабочих дня.\"",
        "zakupkiObjectId": 158279,
        "url": [
            "https://docs.google.com/document/d/1smCMr7mlBmVl8InUeuMS9vfznHHZxyFvDcR_g0ApjGM/edit?usp=sharing"
        ]
    },
    {
        "descripition": "\"Оказание услуг по уборке и содержанию прилегающей территории ГБОУ Школа № 514 в марте 2018 года (6 зданий). Ссылка на ТЗ: https://yadi.sk/i/184LzyjK3SgM87\"",
        "zakupkiObjectId": 158180,
        "url": [
            "https://yadi.sk/i/184LzyjK3SgM87"
        ]
    },
    {
        "descripition": "\"Поставка жалюзи для нужд ГБОУ \\\" Школа №1595\\\" согласно ТЗ https://cloud.mail.ru/public/Dkwf/VVNLhNbGq\"",
        "zakupkiObjectId": 158224,
        "url": [
            "https://cloud.mail.ru/public/Dkwf/VVNLhNbGq"
        ]
    },
    {
        "url": [
            "http://cloud.it-help247.ru/index.php/s/WI2soy0x2EKoQPy"
        ]
    }
]);//require('./description_obr.json'));*/