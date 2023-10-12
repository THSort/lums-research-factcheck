import { useEffect } from "react";
import "./App.css";
import AllArticles from "./components/all-articles-page/all-articles";
import RecentArticles from "./components/recent-articles/recent-articles";
import SpecificArticle from "./components/specific-article/specific-article";

function App() {

  useEffect(()=>{
    console.log(window.location);
  },[])

  const showAllArticles = () => {
    const mobileNumber = window.location.pathname.split('/')[window.location.pathname.split('/').length - 1];
    
    if(window.location.pathname.split('/')[1] === 'all')
    {
      return <AllArticles isHidden={false} mobileNumber={mobileNumber}/>
    }
    if(window.location.pathname.split('/')[1] === 'home')
    {
      return <RecentArticles isHidden={false} mobileNumber={mobileNumber}/>
    }
    if(window.location.pathname.split('/')[1] === 'specific')
    {
      return <SpecificArticle isHidden={false} mobileNumber={mobileNumber}/>
    }
  }
  
  return (
    showAllArticles()
  );
}

export default App;
