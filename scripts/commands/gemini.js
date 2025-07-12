module.exports = {
  config: {
    name: "gemini",
    version: "1.0.0",
    permission: 0,
    credits: "Nayan",
    description: "",
    prefix: 'awto', 
    category: "user", 
    usages: "query",
    cooldowns: 5,
    dependencies: {
      "axios": '',
    }
  },

  start: async function({ nayan, events, args, Users, NAYAN }) {
    const axios = require("axios");

    const msg = args.join(" ");
    let config;

    if (events.messageReply?.attachments && events.messageReply.attachments.length > 0) {
      const attachment = events.messageReply.attachments[0];
      const url = attachment.url;
      config = {
        modelType: 'text_and_image',
        prompt: msg,
        imageParts: [url]
      };
    } else {
      config = {
        modelType: 'text_only',
        prompt: msg
      };
    }

    try {
    const apis = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json')
    const n = apis.data.gemini
      const { data } = await axios.post(n+'/chat-with-gemini', config); // api by Mohammad Rahad
      const result = data.result;
      NAYAN.react("✔️")

      nayan.reply({ body: result }, events.threadID, events.messageID);
    } catch (error) {
      console.error(error);
      NAYAN.react("❌")
      nayan.reply({ body: "There was an error processing your request." }, events.threadID, events.messageID);
    }
  }
};
