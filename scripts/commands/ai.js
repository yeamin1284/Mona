const fs = require("fs");
const axios = require("axios");
const gTTS = require("gtts");

module.exports = {
  config: {
    name: "ai",
    version: "1.1.0",
    permission: 0,
    credits: "Nayan + ChatGPT",
    description: "GPT দিয়ে প্রশ্নের উত্তর + ভয়েসে রেসপন্স 🎤",
    prefix: true,
    category: "user",
    usages: "ai প্রশ্ন | aivoice প্রশ্ন",
    cooldowns: 5,
    dependencies: {}
  },

  run: async function ({ api, event, args }) {
    const command = event.body.split(" ")[0].toLowerCase(); // ai বা aivoice
    const question = args.join(" ").toLowerCase();

    // যদি প্রশ্ন না দেয়
    if (!question) {
      return api.sendMessage("❓ ভাই, প্রশ্নটা তো বলো! যেমন: ai সূর্য কত বড়?", event.threadID);
    }

    // কেউ যদি লিখে "কি করো"
    if (question.includes("কি করো")) {
      const funReplies = [
        "😎 বট হয়ে বসে আছি, তুমিই তো রাজা!",
        "🤖 ভাবতেছি কবে তুমি একটা মেসেজ দিবে!",
        "😴 একটু ঘুম, একটু কোড, আর একটু প্রেম 🤭",
        "📱 তোমার মেসেজের জন্যই তো বেঁচে আছি!",
        "🔥 আমি কিছু না করলেও, মাথায় কিন্তু সবসময় চলতেছে!"
      ];
      const reply = funReplies[Math.floor(Math.random() * funReplies.length)];
      return api.sendMessage(reply, event.threadID);
    }

    // GPT-3.5 দিয়ে উত্তর আনবো এখন
    let reply;
    try {
      const gpt = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "তুমি একজন বন্ধুর মতো, বাংলা ভাষায় সহজভাবে আর মাঝে মাঝে ইমোজি দিয়ে উত্তর দাও।" },
            { role: "user", content: question }
          ]
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      reply = gpt.data.choices[0].message.content;

      // যদি ভয়েস না চায়, সরাসরি উত্তর পাঠাও
      if (command !== "aivoice") {
        return api.sendMessage("🧠 " + reply, event.threadID);
      }

    } catch (error) {
      console.error("GPT error:", error);
      return api.sendMessage("❌ উত্তর আনতে পারলাম না, ভাই!", event.threadID);
    }

    // ভয়েসে পাঠানোর জন্য তৈরি করছি
    try {
      const gtts = new gTTS(reply, "bn");
      const path = __dirname + `/voice_${event.senderID}.mp3`;

      await new Promise((resolve, reject) => {
        gtts.save(path, err => {
          if (err) return reject(err);
          resolve();
        });
      });

      const stream = fs.createReadStream(path);
      await api.sendMessage({ attachment: stream }, event.threadID);
      fs.unlinkSync(path);

    } catch (error) {
      console.error("Voice error:", error);
      return api.sendMessage("🎤 ভয়েস বানাতে গিয়া গন্ডগোল হইছে ভাই!", event.threadID);
    }
  }
};
