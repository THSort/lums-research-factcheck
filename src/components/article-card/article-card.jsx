import styles from "./article-card.module.css";

function ArticleCard(props) {
  console.log("props:", props);
  return (
    <div className={styles.articleCardWrapper}>
      <a href={"/specific/" + props.article.Article_Link?.split("/")[3]} className={styles.articleCard}>
        <div className={styles.imgContainer}>
          <img className={styles.img} src={props.article.Img_Data_Src} />
        </div>
        <div className={styles.headlineContainer}>
          <p className={styles.articleHeadline}>
            {props.article.Article_Headline}
          </p>
        </div>
        <div className={styles.dateContainer}>
          <p className={styles.articleDate}>{props.article.Article_Date}</p>
        </div>
      </a>
    </div>
  );
}

export default ArticleCard;
