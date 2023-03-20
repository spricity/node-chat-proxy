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
      ctx.body = await this.text(payload);
    } catch(e) {
      ctx.body = {success: false, message: e.message};
    }
  }
  async text(payload) {
    const { ctx } = this;
    const { prompt } = payload;
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
          // {
          //   role: 'system',
          //   content: 'You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.\n' +
          //     'Knowledge cutoff: 2021-09-01\n' +
          //     'Current date: 2023-03-17'
          // },
          { role: 'user', content: prompt }
        ],
        stream: true
      })
    };
    console.log('start');
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', options);
      if( response.ok ) {
        ctx.set({
          'Content-Type': 'text/event-stream;chartset=UTF-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'Transfer-Encoding': 'off',
        });
        steamUtil(response, (data) => {
          if(data ===  '[DONE]') {
            stream.sendEnd(new TextEncoder().encode(data));
          } else {
            stream.send(new TextEncoder().encode(data));
          }
        })
      }
      return stream;
    }catch(e) {
      console.log(e);
      return {success: false, message: e.message};
    }
  }
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
