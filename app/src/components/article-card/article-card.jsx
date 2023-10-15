import { useRef } from "react";
import styles from "./article-card.module.css";
import {useOnScreen} from '../useOnScreen/useOnScreen.js'

function ArticleCard(props) {

  const elementRef = useRef(null);
  const isOnScreen = useOnScreen(elementRef);

  return (
    <div className={styles.articleCardWrapper}>
      <a  key={props.id} id={props.id}  href={"/specific/" + props.article.Article_Link?.split("/")[3] + '/' + props.mobileNumber} className={styles.articleCard}>
        <div ref={elementRef} className={isOnScreen ? styles.imgContainer : styles.hiddenImgContainer}>
          <img className={styles.img} src={props.article.Img_Data_Src} />
        </div>
        <div className={styles.headlineContainer}>
          <p className={styles.articleHeadlineUrdu}>
            {props.article.Translated_Article_Headline}
          </p>
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
