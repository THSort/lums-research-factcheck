import ArticlesGrid from "../articles-grid/articles-grid";
import { useState, useEffect } from "react";
import styles from "./all-articles.module.css";
import ArticleCard from "../article-card/article-card";

function AllArticles(props) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Define the endpoint URL
    const apiUrl = `http://0.0.0.0:7777/all/${props.mobileNumber}`;

    // Make an HTTP GET request to the endpoint
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((result) => {
        console.log(result);
        // Update the state with the fetched data
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });
  }, []); // Empty dependency array ensures the effect runs once on component mount

  return (
    <>
      <div className={styles.titleBanner}>
        <div className={styles.title}>
          All Articles
        </div>
        <div className={styles.title}>
          تمام مضامین
        </div>
      </div>
      <a className={styles.homeBtn} href={"/home/" + props.mobileNumber}>
        <div className={styles.navBtnContainer}>
          <div className={styles.btnTextEnglish}>Go To Recent Articles</div>
          <div className={styles.btnTextUrdu}>حالیہ مضامین پر جانے کے لیے یہاں کلک کریں</div>
        </div>
      </a>
      <ArticlesGrid mobileNumber={props.mobileNumber} articles={data}/>
    </>
  );
}

export default AllArticles;
