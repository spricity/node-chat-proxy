const { Readable } = require("stream");
const { yieldStream } = require("yield-stream");
const { OpenAI as OpenAIEdge } = require("./edge");
/**
 * A Node.js client for OpenAI's API, using NodeJS.Readable.
 *
 *  Create a new completion stream. Stream of strings by default, set `mode:
 * 'raw'` for the raw stream of JSON objects.
 *
 * @note Use `openai-streams/edge` for Edge Runtime or Browser.
 */
export const OpenAI = async (endpoint, args, options) => {
  const stream = await OpenAIEdge(endpoint, args, options);
  const nodeStream = Readable.from(yieldStream(stream));

  return nodeStream;
};
