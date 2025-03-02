import { useState , useEffect} from 'react'
import "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import axios from "axios"
import prism from "prismjs"
import rehypeHighlight from 'rehype-highlight';
import "highlight.js/styles/github-dark.css";
import Markdown from "react-markdown"
import './App.css'

function App() {
 
  const [code, setCode] = useState(`function sum(){
       return 1 + 1
 }`);

 const [review , setReview] = useState(``);
 const [displayedReview , setDisplayedReview] = useState("");


  useEffect(() => {
      prism.highlightAll();

  },[code]);

   async function reviewCode(){

    setReview("");
    setDisplayedReview("");
    const response = await axios.post("http://localhost:3000/ai/get-review",{code})
   setReview(response.data);

   simulateTypingEffect(response.data);

  }
   function simulateTypingEffect(text){
    let index = 0;
    setDisplayedReview("");
    const interval = setInterval(() =>{
      if(index < text.length){
        setDisplayedReview((prev) => prev + text[index]);
        index++;
      }
      else{
        clearInterval(interval);
      }

    }, 50);

    return () => clearInterval(interval);
   }








  return (
    <>
      <main>
        <div className="left">
          <div className="code">
            <Editor 
            value={code}
            onValueChange={newCode => setCode(newCode)}
            highlight={(code) => prism.highlight(code, prism.languages.javascript ||"javascript","javascript")}
            padding={10}
            readOnly={false}
            style={{
              fontFamily:'"Fira code"," Fira Mono",monospace',
              fontSize: 16,
              border:"1px solid #ddd",
              borderRadius: "5px",
              height:"100%",
              width:"100%",
              color: "#f8f8f2",
            }}

            />


           


          </div>

          <div onClick={reviewCode}
           className="review">Review</div>
        </div>
        <div className="right">
          <Markdown
          rehypePlugins={[rehypeHighlight]}
          >{displayedReview || "waiting for review"}</Markdown>
          
        </div>



      </main>
      
     
    </>
  )
}



export default App
