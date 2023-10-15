const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { DateTime } = require('luxon');
const app = express();
const port = 7777;

const globalCacheForSpecificArticles = {};
const globalCacheForAllArticles = {};
const globalCacheForRecentArticles = {};

const { Translate } = require('@google-cloud/translate').v2;

const { google } = require('googleapis');

// Create a client
const translate = new Translate({
  keyFilename: './credentials.json', // Replace with the path to your JSON key file
  projectId: 'lums-fact-check',
});

const translateText = async (text, target) => {
  try {
    let [translations] = await translate.translate(text, {
      to: 'ur',
      from: 'en',
      format: 'html'
    });

    return translations;
  } catch (err) {
    console.error('Error translating text:', err);
    throw err;
  }
};

app.use(cors());


const logTrackingData = async (mobileNumber, userStringAgent, requestedUrl) => {
  const timestamp = DateTime.local(); // Get the current timestamp
  const csvData = `${mobileNumber},${requestedUrl},${userStringAgent},${timestamp.toISO()}\n`;

  fs.appendFile('trackingLogs.csv', csvData, (error) => {
    if (error) {
      console.error('Error:', error);
    }
  });

  const googleSheetId = '10ZxeplDvfxpGfh5kNgbEEHGdrSYC1kpJ7GWgsiDTmaY';
  const tabName = 'Data';
  const range = 'A:D'

  async function _getGoogleSheetClient() {
    const auth = new google.auth.GoogleAuth({
      keyFile: './credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    return google.sheets({
      version: 'v4',
      auth: authClient,
    });
  }

  async function _writeGoogleSheet(googleSheetClient, sheetId, tabName, range, data) {
    await googleSheetClient.spreadsheets.values.append({
      spreadsheetId: googleSheetId,
      range: `${tabName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        "majorDimension": "ROWS",
        "values": [[mobileNumber, requestedUrl, userStringAgent, timestamp.toISO()]]
      },
    })
  }

  const googleSheetClient = await _getGoogleSheetClient();

  await _writeGoogleSheet(googleSheetClient, googleSheetId, tabName, range, csvData);

};


const RECENT_ARTICLES_CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day in milliseconds

app.get('/api/:mobileNumber', async (req, res) => {
  try {
    const userAgent = req.get('user-agent');
    const requestedUrl = req.path;
    const { mobileNumber } = req.params;
    const { page } = req.query; // Extract the page number from query parameters

    const monthMap = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };

    const today = DateTime.local();

    // Define the items per page
    const itemsPerPage = 10; // Adjust this as per your requirement

    // Calculate the starting index for the current page
    const startIndex = (page - 1) * itemsPerPage;

    // Generate a unique cache key based on the requested URL
    const cacheKey = `${requestedUrl}:${mobileNumber}:${page}`;

    // Check if cached data for the specific URL exists and is not expired
    if (
      globalCacheForSpecificArticles[cacheKey] &&
      Date.now() - globalCacheForSpecificArticles[cacheKey].timestamp < RECENT_ARTICLES_CACHE_TTL
    ) {
      const cachedData = globalCacheForSpecificArticles[cacheKey].data.slice(startIndex, startIndex + itemsPerPage);
      if(page === "1"){
        logTrackingData(mobileNumber, userAgent, requestedUrl);
      }
      
      res.json(cachedData);
    }
    else {
      if(page === "1"){
        logTrackingData(mobileNumber, userAgent, requestedUrl);
      }

      const url = 'https://www.sochfactcheck.com/category/politics/';
      const response = await axios.get(url);
      const $ = await cheerio.load(response.data);

      let articles = [];
      const allArticlesTemp = [];
      let translationPromises = [];

      $('.card').each((index, element) => {
        const $element = $(element);
        const $anchor = $element.find('a');
        const articleLink = $anchor.attr('href');
        const imgDataSrc = $anchor.find('img').attr('data-src');
        const imgSrc = $anchor.find('img').attr('src');

        const $details = $element.find('.details');
        const articleHeadline = $details.find('h3').text().trim();

        const articleDate = $details.find('time').text().trim();

        const articleDay = articleDate.split(' ')[0];
        const articleMonth = articleDate.split(' ')[1];
        const articleYear = articleDate.split(' ')[2];

        const articleDatetime = DateTime.fromObject({
          year: parseInt(articleYear),
          month: monthMap[articleMonth],
          day: parseInt(articleDay),
        });

        const translationPromise = translateText(articleHeadline, 'ur').then(translatedHeadline => {
          const diff = today.diff(articleDatetime, 'days').days;

          const articleObject = {
            Response: 200,
            Article_Link: articleLink,
            Img_Data_Src: imgDataSrc,
            Img_src: imgSrc,
            Article_Headline: articleHeadline,
            Translated_Article_Headline: translatedHeadline,
            Article_Date: articleDate,
          };

          if (diff <= 1) {
            articles.push(articleObject);
          }

          allArticlesTemp.push(articleObject);
        });

        translationPromises.push(translationPromise);
      });

      // Wait for all translation promises to be resolved
      await Promise.all(translationPromises);

      if (articles.length === 0) {
        const filteredArticles = allArticlesTemp.filter(articleObject => {
          const articleDate = articleObject.Article_Date;
          const articleDay = articleDate.split(' ')[0];
          const articleMonth = articleDate.split(' ')[1];
          const articleYear = articleDate.split(' ')[2];
      
          const articleDatetime = DateTime.fromObject({
            year: parseInt(articleYear),
            month: monthMap[articleMonth],
            day: parseInt(articleDay),
          });
      
          const diff = today.diff(articleDatetime, 'days').days;
      
          return diff <= 30;
        });
      
        // Sort the filtered articles in descending order of Article_Date
        filteredArticles.sort((a, b) => {
          const dateA = DateTime.fromFormat(a.Article_Date, 'dd MMMM yyyy');
          const dateB = DateTime.fromFormat(b.Article_Date, 'dd MMMM yyyy');
          return dateB.diff(dateA).as('milliseconds');
        });
      
        filteredArticles.forEach(articleObject => {
          const translationPromise = translateText(articleObject.Article_Headline, 'ur').then(translatedHeadline => {
            const extendedArticleObject = {
              Response: 200,
              Article_Link: articleObject.Article_Link,
              Img_Data_Src: articleObject.Img_Data_Src,
              Img_src: articleObject.Img_src,
              Article_Headline: articleObject.Article_Headline,
              Translated_Article_Headline: translatedHeadline,
              Article_Date: articleObject.Article_Date,
            };
            articles.push(extendedArticleObject);
          });
          translationPromises.push(translationPromise);
        });
      
        // Wait for the translation promises for the filtered articles to be resolved
        await Promise.all(translationPromises);

        // Sort the articles array in descending order based on Article_Date
        articles.sort((a, b) => new Date(b.Article_Date) - new Date(a.Article_Date));
      
        // If the articles array is still empty, use the filtered articles directly
        if (articles.length === 0) {
          articles = filteredArticles;
        }
      }
      
      // Create a cache entry for the specific URL
      const cacheEntry = {
        data: articles,
        timestamp: Date.now(),
      };

      // Update the global cache for the specific URL
      globalCacheForSpecificArticles[cacheKey] = cacheEntry;

      // Check and remove cache entries that have exceeded their TTL
      const currentTimestamp = Date.now();
      for (const key in globalCacheForSpecificArticles) {
        if (
          globalCacheForSpecificArticles[key].timestamp &&
          currentTimestamp - globalCacheForSpecificArticles[key].timestamp >= RECENT_ARTICLES_CACHE_TTL
        ) {
          delete globalCacheForSpecificArticles[key];
        }
      }

      // Return the subset of articles for the current page
      const articlesSubset = articles.slice(startIndex, startIndex + itemsPerPage);
      res.json(articlesSubset);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const ALL_ARTICLES_CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day in milliseconds

app.get('/api/all/:mobileNumber', async (req, res) => {
  try {
    const userAgent = req.get('user-agent');
    const requestedUrl = req.path;

    const { mobileNumber } = req.params;
    const { page } = req.query; // Extract the page number from query parameters

    // Define the items per page
    const itemsPerPage = 10; // Adjust this as per your requirement

    // Calculate the starting index for the current page
    const startIndex = (page - 1) * itemsPerPage;

    // Check if cached data for 'all' exists and is not expired
    if (
      globalCacheForAllArticles.data &&
      Date.now() - globalCacheForAllArticles.timestamp < ALL_ARTICLES_CACHE_TTL
    ) {
      const cachedData = globalCacheForAllArticles.data.slice(startIndex, startIndex + itemsPerPage);
      if (page === "1") {
        logTrackingData(mobileNumber, userAgent, requestedUrl);
      }
      res.json(cachedData);
    } else {
      if (page === "1") {
        logTrackingData(mobileNumber, userAgent, requestedUrl);
      }

      const url = 'https://www.sochfactcheck.com/category/politics/';
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      let articles = [];
      let translationPromises = [];

      $('.card').each((index, element) => {
        const $element = $(element);
        const $anchor = $element.find('a');
        const articleLink = $anchor.attr('href');
        const imgDataSrc = $anchor.find('img').attr('data-src');
        const imgSrc = $anchor.find('img').attr('src');

        const $details = $element.find('.details');
        const articleHeadline = $details.find('h3').text().trim();
        const articleDate = $details.find('time').text().trim();

        const translationPromise = translateText(articleHeadline, 'ur').then(translatedHeadline => {
          articles.push({
            Response: 200,
            Article_Link: articleLink,
            Img_Data_Src: imgDataSrc,
            Img_src: imgSrc,
            Article_Headline: articleHeadline,
            Translated_Article_Headline: translatedHeadline,
            Article_Date: articleDate,
          });
        });

        translationPromises.push(translationPromise);
      });

      // Wait for all translation promises to be resolved
      await Promise.all(translationPromises);

      // Sort the articles array in descending order based on Article_Date
      articles.sort((a, b) => new Date(b.Article_Date) - new Date(a.Article_Date));

      // Update the global cache for 'all' articles
      globalCacheForAllArticles.data = articles;
      globalCacheForAllArticles.timestamp = Date.now();

      // Check and remove cache entries that have exceeded their TTL
      const currentTimestamp = Date.now();
      if (globalCacheForAllArticles.timestamp && currentTimestamp - globalCacheForAllArticles.timestamp >= ALL_ARTICLES_CACHE_TTL) {
        globalCacheForAllArticles = {};
      }

      // Return the subset of articles for the current page
      const articlesSubset = articles.slice(startIndex, startIndex + itemsPerPage);
      res.json(articlesSubset);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




const SPECIFIC_ARTICLE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

app.get('/api/article/:headline/:mobileNumber', async (req, res) => {
  try {
    const userAgent = req.get('user-agent');
    const requestedUrl = req.path;

    const { headline, mobileNumber } = req.params;

    // Check if the article is already cached and not expired
    if (
      globalCacheForSpecificArticles[headline] &&
      Date.now() - globalCacheForSpecificArticles[headline].timestamp < SPECIFIC_ARTICLE_CACHE_TTL
    ) {
      const cachedData = globalCacheForSpecificArticles[headline].data;
      logTrackingData(mobileNumber, userAgent, requestedUrl);
      res.json(cachedData);
    } else {
      logTrackingData(mobileNumber, userAgent, requestedUrl);

      const url = `https://www.sochfactcheck.com/${headline}`;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Find the <article class='sPost'> element and extract its HTML content
      const $article = $('article.sPost');

      // Remove everything after the <hr> element
      $article.find('hr').nextAll().remove();

      // Get the updated HTML content
      const articleHTML = $article.html();

      // Extract the text content from the HTML
      const textContent = $(articleHTML).text();

      // Translate the text content to Urdu
      const targetLanguage = 'ur'; // Target language code for Urdu
      const translatedText = await translateText(articleHTML, targetLanguage);

      // Create a cache entry for the article
      const cacheEntry = {
        data: {
          articleHTMLUrdu: translatedText,
          articleHTMLEnglish: articleHTML,
        },
        timestamp: Date.now(),
      };

      // Add the cache entry
      globalCacheForSpecificArticles[headline] = cacheEntry;

      // Check and remove cache entries that have exceeded their TTL
      const currentTimestamp = Date.now();
      for (const key in globalCacheForSpecificArticles) {
        if (
          globalCacheForSpecificArticles[key].timestamp &&
          currentTimestamp - globalCacheForSpecificArticles[key].timestamp >= SPECIFIC_ARTICLE_CACHE_TTL
        ) {
          delete globalCacheForSpecificArticles[key];
        }
      }

      res.json({
        articleHTMLUrdu: translatedText,
        articleHTMLEnglish: articleHTML,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});