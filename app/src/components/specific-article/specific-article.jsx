import React, { useState, useEffect } from "react";
import styles from "./specific-article.module.css";
import "./specificArticle.css";

const SpecificArticle = (props) => {
  const [articleEnglishHTML, setArticleEnglishHTML] = useState("");
  const [articleUrduHTML, setArticleUrduHTML] = useState("");

  const articleLink = window.location.pathname.split("/")[2];

  useEffect(() => {
    async function fetchArticleContent() {
      try {
        const response = await fetch(
          `http://0.0.0.0/api/article/${articleLink}/${props.mobileNumber}`
        );
        const articleData = await response.json();

        const englishHTML = articleData.articleHTMLEnglish;
        const urduHTML = articleData.articleHTMLUrdu;

        let countEnglish = 0;
        const modifiedHtmlContentEnglish = englishHTML.replace(
          /<img([^>]*)>/gi,
          (match, p1) => {
            const dataSrc = p1.match(/data-src="([^"]*)"/i);
            if (countEnglish === 0) {
              countEnglish = countEnglish + 1;
              return dataSrc
                ? `<img class="articleFirstImage" src="${dataSrc[1]}">`
                : "";
            }
            countEnglish = countEnglish;
            return dataSrc
              ? `<img class="articleImage" src="${dataSrc[1]}">`
              : "";
          }
        );

        setArticleEnglishHTML(modifiedHtmlContentEnglish);

        let countUrdu = 0;
        const modifiedHtmlContentUrdu = urduHTML.replace(
          /<img([^>]*)>/gi,
          (match, p1) => {
            const dataSrc = p1.match(/data-src="([^"]*)"/i);
            if (countUrdu === 0) {
              countUrdu = countUrdu + 1;
              return dataSrc
                ? `<img class="articleFirstImage" src="${dataSrc[1]}">`
                : "";
            }
            countUrdu = countUrdu;
            return dataSrc
              ? `<img class="articleImage" src="${dataSrc[1]}">`
              : "";
          }
        );

        setArticleUrduHTML(modifiedHtmlContentUrdu);
      } catch (error) {
        console.error(error);
      }
    }

    fetchArticleContent();
  }, [articleLink]);

  return (
    <div style={{ padding: "30px", fontSize:"30px" }}>
      <div>
        {/* Render the HTML content received from the backend */}
        <div dangerouslySetInnerHTML={{ __html: articleUrduHTML }} />
        <div dangerouslySetInnerHTML={{ __html: articleEnglishHTML }} />
      </div>
    </div>
  );
};

export default SpecificArticle;
