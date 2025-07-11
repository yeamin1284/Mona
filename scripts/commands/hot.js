const axios = require('axios');

module.exports.config = {
  name: "result",
  aliases: ["eBoard", "eboard", "ssc", "hsc"],
  version: "1.0.0",
  permission: 0,
  prefix: 2,
  credits: "Nayan",
  description: "Check eBoard exam result",
  category: "utility",
  usages: "",
  cooldowns: 2
};

module.exports.run = async function({ api, event }) {
  try {
    const res = await axios.get("https://nayan-eboard-result.vercel.app/eboard/options");
    const exams = res.data.examinations;

    let msg = "📚 𝗦𝗲𝗹𝗲𝗰𝘁 𝗘𝘅𝗮𝗺:\n";
    exams.forEach((exam, index) => {
      msg += `${index + 1}. ${exam.name}\n`;
    });

    return api.sendMessage(msg, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        type: "exam",
        exams
      });
    }, event.messageID);
  } catch (e) {
    return api.sendMessage("❌ Failed to load exam list", event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { author, type } = handleReply;
  if (event.senderID !== author) return;

  try {
    switch (type) {
      case "exam": {
        const selected = parseInt(event.body) - 1;
        if (isNaN(selected) || selected < 0 || selected >= handleReply.exams.length) {
          return api.sendMessage("❌ Invalid selection.", event.threadID);
        }

        const exam = handleReply.exams[selected];
        const res = await axios.get("https://nayan-eboard-result.vercel.app/eboard/options");
        const boards = res.data.boards;

        let msg = "🏫 𝗦𝗲𝗹𝗲𝗰𝘁 𝗕𝗼𝗮𝗿𝗱:\n";
        boards.forEach((b, i) => {
          msg += `${i + 1}. ${b.name}\n`;
        });

        api.unsendMessage(handleReply.messageID);
        return api.sendMessage(msg, event.threadID, (err, info) => {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author,
            type: "board",
            boards,
            exam: exam.value
          });
        }, event.messageID);
      }

      case "board": {
        const selected = parseInt(event.body) - 1;
        if (isNaN(selected) || selected < 0 || selected >= handleReply.boards.length) {
          return api.sendMessage("❌ Invalid board selection.", event.threadID);
        }

        const board = handleReply.boards[selected];
        api.unsendMessage(handleReply.messageID);
        return api.sendMessage("📅 Enter exam year (e.g., 2024):", event.threadID, (err, info) => {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author,
            type: "year",
            exam: handleReply.exam,
            board: board.value
          });
        }, event.messageID);
      }

      case "year": {
        const year = parseInt(event.body);
        if (isNaN(year) || year < 2000 || year > 2099) {
          return api.sendMessage("❌ Invalid year. Try again.", event.threadID);
        }

        api.unsendMessage(handleReply.messageID);
        return api.sendMessage("🧾 Enter roll number:", event.threadID, (err, info) => {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author,
            type: "roll",
            exam: handleReply.exam,
            board: handleReply.board,
            year
          });
        }, event.messageID);
      }

      case "roll": {
        const roll = event.body.trim();
        if (!/^\d{3,10}$/.test(roll)) {
          return api.sendMessage("❌ Invalid roll number.", event.threadID);
        }

        api.unsendMessage(handleReply.messageID);
        return api.sendMessage("📝 Enter registration number:", event.threadID, (err, info) => {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author,
            type: "reg",
            exam: handleReply.exam,
            board: handleReply.board,
            year: handleReply.year,
            roll
          });
        }, event.messageID);
      }

      case "reg": {
        const reg = event.body.trim();
        if (!/^\d{3,15}$/.test(reg)) {
          return api.sendMessage("❌ Invalid registration number.", event.threadID, event.messageID);
        }

        api.unsendMessage(handleReply.messageID);
        const { exam, board, year, roll } = handleReply;

        try {
          const url = `https://nayan-eboard-result.vercel.app/result?exam=${exam}&roll=${roll}&reg=${reg}&board=${board}&year=${year}`;
          const res = await axios.get(url);
          const data = res.data;

          if (!data.student) {
            return api.sendMessage("❌ No result found or invalid information.", event.threadID, event.messageID);
          }

          const student = data.student;
          const grades = data.grades || [];

          let msg = "===== Student Information =====\n";
          for (let [key, value] of Object.entries(student)) {
            msg += `${key}: ${value || "N/A"}\n`;
          }

          msg += `\n===== Grade Sheet =====\n`;
          for (let subject of grades) {
            msg += `${subject.code} - ${subject.subject}: ★ ${subject.grade} ★\n`;
          }

          return api.sendMessage(msg.trim(), event.threadID, event.messageID);
        } catch (e) {
          return api.sendMessage("❌ Error fetching result.", event.threadID, event.messageID);
        }
      }
    }
  } catch (err) {
    return api.sendMessage("❌ An unexpected error occurred.", event.threadID, event.messageID);
  }
};
