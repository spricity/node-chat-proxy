'use strict';

const { Controller } = require('egg');
// const { Configuration, OpenAIApi } = require("openai");
const steamUtil = require('../util/openai-stream/steamUtil');
const SSETransform = require('../util/openai-stream/sse');
class ApiController extends Controller {
  async openai() {
    const { ctx } = this;
    let payload = {};
    if(ctx.method == 'POST') {
      payload = ctx.request.body;
    } else {
      payload = ctx.query;
    }
    ctx.logger.info(ctx.method,ctx.request.body,ctx.query)

    try {
      // await openai(ctx.req, ctx.res, ctx.request.body);
      ctx.body = await this.text(payload);
      // ctx.body = {};
    } catch(e) {
      ctx.body = {success: false, message: e.message};
    }
    
//     let payload = {};
//     if(ctx.method == 'POST') {
//       payload = ctx.request.body;
//     } else {
//       payload = ctx.query;
//     }
//     console.log('payload', payload)
//     ctx.logger.info(ctx.method,ctx.request.body,ctx.query)
// 	  const { q,t } = payload;
// 	  if(!q) {
// 		  ctx.body = {success: false, data: 'argument error'};
// 		  return ;
// 	  }
//   	const configuration = new Configuration({
//   		apiKey: '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',
// 	  });
// 	  const openai = new OpenAIApi(configuration);
//   	try {
//       let data;
// //      if(t === 'image') {
//   //      data = await this.image(openai, payload);
//     //  } else {
//          ctx.response.set('content-type', 'application/json');
//         data = await this.text(openai, payload);
//       //}
//       ctx.logger.info('reponse data', data);
//     	ctx.body = {success: true, message: "aaa"};
//   	} catch(e) {
//   		ctx.body = {success: false, message: e.message};
//   	}
  }
  async text(payload) {
    const { ctx } = this;
    const stream = new SSETransform(ctx);
    const options = {
      method: 'POST',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer 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',
      },
      body: JSON.stringify({
        max_tokens: 1000,
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        top_p: 1,
        presence_penalty: 1,
        messages: [
          {
            role: 'system',
            content: 'You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.\n' +
              'Knowledge cutoff: 2021-09-01\n' +
              'Current date: 2023-03-17'
          },
          { role: 'user', content: '请问现在几点了' }
        ],
        stream: true
      })
    };
    console.log('start');
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', options);
      console.log(response);
      if( response.ok ) {
        ctx.set({
          'Content-Type': 'text/event-stream;chartset=UTF-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'Transfer-Encoding': 'off',
        });
        steamUtil(response, (data) => {
          stream.send(data);
          if(data ===  '[DONE]') {
            stream.sendEnd(data);
          } else {
            stream.send(data);
          }
        })
      }
      return stream;
    }catch(e) {
      console.log(e);
      return {success: false, message: e.message};
    }
  }
  // async text(openai, payload) {
  //   const { q, } = payload;

  //   console.log(222, q);
  //   const completion = await openai.createChatCompletion({
  //     model: "gpt-3.5-turbo",
  //     messages: [{role:"user", content: q}]
  //   });
    
  //   console.log(3333, completion.data.choices[0].message.content);

  //   completion.data.on("data", data => {
  //     this.ctx.logger.info('receive data', data.toString());
  //      const lines = data.toString().split('\n').filter(line => line.trim() !== '');
  //       for (const line of lines) {
  //           const message = line.replace(/^data: /, '');
  //           if (message === '[DONE]') {
  //               return; // Stream finished
  //           }
  //           try {
  //               const parsed = JSON.parse(message);
  //               this.ctx.logger.info(parsed.choices[0].text);
  //           } catch(error) {
  //               this.ctx.logger.error('Could not JSON parse stream message', message, error);
  //           }
  //       }
  //   })
  //   return 111;;
  // }
  async image(openai, payload) {
    const { q, n, size } = payload;
    const response = await openai.createImage({
      prompt: q,
      n: n ? parseInt(n) : 1,
      size: size || "1024x1024"
    });
    return response.data.data;
  }
}

module.exports = ApiController;
