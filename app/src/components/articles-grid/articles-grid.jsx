import { useState, useEffect, useRef } from "react";
import styles from './articles-grid.module.css';
import ArticleCard from "../article-card/article-card";

function ArticlesGrid(props) {
  return (
    <div className={styles.articlesDisplayGrid}>
        {props && props.articles && props.mobileNumber && props.articles.length > 0 && props.articles.map((article, index) => {
            return (
                <ArticleCard key={index} id={index} mobileNumber={props.mobileNumber} article={article}/>
            )
        })}
    </div>
  );
}

export default ArticlesGrid;
