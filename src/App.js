import "./App.css";
import { useState, useEffect } from "react";
import ArticleCard from "./components/article-card/article-card";
import ArticlesGrid from "./components/articles-grid/articles-grid";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Define the endpoint URL
    const apiUrl = "http://localhost:7777/all";

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
    <ArticlesGrid articles={data}/>
  );
}

export default App;
