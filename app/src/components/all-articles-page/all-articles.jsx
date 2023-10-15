import ArticlesGrid from "../articles-grid/articles-grid";
import { useState, useEffect } from "react";
import styles from "./all-articles.module.css";
import InfiniteScroll from "react-infinite-scroll-component";
import { RotatingLines } from "react-loader-spinner";

function AllArticles(props) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    // Define the endpoint URL
    const apiUrl = `/api/all/${props.mobileNumber}?page=${page}`;

    // Make an HTTP GET request to the endpoint
    await fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((result) => {
        // Update the state with the fetched data
        setData([...data, ...result]);
        setPage(page + 1);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });
  };

  useEffect(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, []); // Empty dependency array ensures the effect runs once on component mount

  return (
    <>
      <div className={styles.titleBanner}>
        <div className={styles.title}>All Articles</div>
        <div className={styles.title}>تمام مضامین</div>
      </div>
      <a className={styles.homeBtn} href={"/home/" + props.mobileNumber}>
        <div className={styles.navBtnContainer}>
          <div className={styles.btnTextEnglish}>Go To Recent Articles</div>
          <div className={styles.btnTextUrdu}>
            حالیہ مضامین پر جانے کے لیے یہاں کلک کریں
          </div>
        </div>
      </a>

      <InfiniteScroll
        dataLength={data.length}
        next={fetchData}
        hasMore={true} // Replace with a condition based on your data source
        loader={
          loading ? (
            <div className={styles.loadingAnimation}>
              <RotatingLines 
                strokeColor="green"
                strokeWidth="5"
                animationDuration="0.75"
                width="96"
                visible={true}
              />
            </div>
          ) : (
            <p></p>
          )
        }
        endMessage={<p>No more data to load.</p>}
      >
        <ArticlesGrid mobileNumber={props.mobileNumber} articles={data} />
      </InfiniteScroll>
    </>
  );
}

export default AllArticles;
