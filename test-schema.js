const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const schema = z.object({
  to: z.string(),
  subject: z.string(),
  body: z.string(),
});
console.log(JSON.stringify(zodToJsonSchema(schema), null, 2));
