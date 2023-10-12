import { useState, useEffect } from "react";
import styles from './articles-grid.module.css';
import ArticleCard from "../article-card/article-card";

function ArticlesGrid(props) {
  return (
    <div className={styles.articlesDisplayGrid}>
        {props && props.articles && props.mobileNumber && props.articles.length > 0 && props.articles.map((article) => {
            return (
                <ArticleCard mobileNumber={props.mobileNumber} article={article}/>
            )
        })}
    </div>
  );
}

export default ArticlesGrid;
