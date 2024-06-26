'use strict';

const { Controller } = require('egg');
const { Configuration, OpenAIApi } = require("openai");

class ApiController extends Controller {
  async openai() {
    const { ctx } = this;
	  ctx.response.set('Access-Control-Allow-Origin', '*');
    let payload = {};
    if(ctx.method == 'POST') {
      payload = ctx.request.body;
    } else {
      payload = ctx.query;
    }
    ctx.logger.info(ctx.method,ctx.request.body,ctx.query)
	  const { q,t } = payload;
	  if(!q) {
		  ctx.body = {success: false, data: 'argument error'};
		  return ;
	  }
  	const configuration = new Configuration({
  		apiKey: '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',
	  });
	  const openai = new OpenAIApi(configuration);
  	try {
      let data;
//      if(t === 'image') {
  //      data = await this.image(openai, payload);
    //  } else {
         ctx.response.set('content-type', 'application/json');
        data = await this.text(openai, payload);
      //}
      ctx.logger.info('reponse data', data);
    	ctx.body = {success: true, message: "aaa"};
  	} catch(e) {
  		ctx.body = {success: false, message: e.message};
  	}
  }
  async text(openai, payload) {
    const { q, } = payload;
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{role:"user", content: q}]
    }, {responseType: "stream"});

    completion.data.on("data", data => {
      this.ctx.logger.info('receive data', data.toString());
       const lines = data.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            const message = line.replace(/^data: /, '');
            if (message === '[DONE]') {
                return; // Stream finished
            }
            try {
                const parsed = JSON.parse(message);
                this.ctx.logger.info(parsed.choices[0].text);
            } catch(error) {
                this.ctx.logger.error('Could not JSON parse stream message', message, error);
            }
        }
    })
    return 111;;
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
