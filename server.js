// SIMPLE JARVIS SERVER

import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// 🔐 ADD YOUR KEYS
const OPENAI_API_KEY = "YOUR_OPENAI_KEY";
const SERPER_API_KEY = "YOUR_SERPER_KEY";

// 🌐 SEARCH
async function searchWeb(q){
  const r = await axios.post("https://google.serper.dev/search",{q},{
    headers:{ "X-API-KEY": SERPER_API_KEY,"Content-Type":"application/json"}
  });
  return r.data.organic?.slice(0,3).map(x=>x.snippet).join("\\n")||"";
}

// 🤖 CHAT
app.post("/api/chat", async (req,res)=>{
  const {message}=req.body;

  let webData="";
  if(message.length>20) webData=await searchWeb(message);

  try{
    const r=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+OPENAI_API_KEY,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-4o-mini",
        messages:[
          {role:"system",content:"You are Jarvis. "+webData},
          {role:"user",content:message}
        ]
      })
    });

    const data=await r.json();
    res.json({reply:data.choices[0].message.content});
  }catch{
    res.json({reply:"Error"});
  }
});

// 🌐 UI
app.get("/",(req,res)=>{
res.send(`
<!DOCTYPE html>
<html>
<body style="background:black;color:cyan;text-align:center">
<h1>JARVIS</h1>
<div id="chat"></div>
<input id="input"><button onclick="send()">Send</button>

<script>
const chat=document.getElementById("chat");

function add(s,t){
 let p=document.createElement("p");
 p.innerHTML="<b>"+s+":</b> "+t;
 chat.appendChild(p);
}

async function send(){
 let text=document.getElementById("input").value;
 add("You",text);

 let r=await fetch("/api/chat",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({message:text})
 });

 let d=await r.json();
 add("Jarvis",d.reply);
}
</script>
</body>
</html>
`);
});

app.listen(3000,()=>console.log("http://localhost:3000"));
