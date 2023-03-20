const  { createParser } = require("eventsource-parser");
module.exports = async (response, callback) => {
    const parser = createParser((event) => {
      if (event.type === "event") {
        callback(event.data);
      }
    });
    if (!response.body.getReader) {
      const body = response.body;
      if (!body.on || !body.read) {
        throw new error('unsupported "fetch" implementation');
      }
      body.on("readable", () => {
        let chunk;
        while (null !== (chunk = body.read())) {
          parser.feed(chunk.toString());
        }
      });
    } else {
      for await (const chunk of streamAsyncIterable(response.body)) {
        // const str = new TextDecoder().decode(chunk);
        parser.feed(chunk);
      }
    }
}


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