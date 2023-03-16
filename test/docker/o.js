import express from 'express'
import path from 'path';
import fetch from 'cross-fetch';
const app = express()
import { OpenAI }  from 'openai-streams';
import multer from 'multer';
var forms = multer({limits: { fieldSize: 10*1024*1024 }});
app.use(forms.array()); 
import bodyParser from 'body-parser';
app.use(bodyParser.json({limit : '50mb' }));  
app.use(bodyParser.urlencoded({ extended: true }));
import { yieldStream } from "yield-stream";
const DECODER = new TextDecoder();
app.all(`*`, async (req, res) => {
  const stream = await OpenAI(
    "chat",
    {
      model: "gpt-3.5-turbo",
      messages: [
//        { "role": "system", "content": "You are a helpful assistant that translates English to French." },
 //       { "role": "user", "content": "Translate the following English text to Chinese: \"Hello world!\"" }
        {"role": "user", content: req.query.q }
      ],
    },
    { apiKey: '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' }
  );
  // console.log(stream);
  const chunks = [];
  for await (const chunk of yieldStream(stream)) {
    const value = JSON.parse(DECODER.decode(chunk));
    chunks.push(value.content);
    console.log(chunks.join("").trim());
  //console.log(value);
  }
})

async function* streamAsyncIterable(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

async function myFetch(url, options) {
  const {timeout, ...fetchOptions} = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout||30000)
  const res = await fetch(url, {...fetchOptions,signal:controller.signal});
  clearTimeout(timeoutId);
  return res;
}






// Error handler
app.use(function(err, req, res, next) {
  console.error(err)
  res.status(500).send('Internal Serverless Error')
})

const port = process.env.PORT||9000;
app.listen(port, () => {
  console.log(`Server start on http://localhost:${port}`);
})
