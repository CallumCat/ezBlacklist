const Discord = require("discord.js")
const MongoDB = require("mongodb")
const client = new Discord.Client();
const config = require("./config.json");
const { promptMessage } = require("./functions.js");
var mongo;

MongoDB.MongoClient.connect("mongodb+srv://", { useUnifiedTopology: true }).then((client) => {
  console.log("Your connected to mongodb.")
  mongo = client;
}).catch(() => {
  console.log("Your not connected to mongodb.")
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity(`${client.guilds.cache.size} Servers!`, {type: "WATCHING" }); 
});  

client.on("guildCreate", async guild => {
    let channelID;
    let channels = guild.channels;
    channelLoop:
    for (let c of channels) {
      let channelType = c[1].type;
      if (channelType === "text") {
        channelID = c[0];
        break channelLoop;
      }
    }
    let channel = client.channels.get(guild.systemChannelID || channelID);
    let invite = await channel.createInvite({
      maxAge: 86400
    })
    var embed = new Discord.MessageEmbed()
      .setTitle(`Bot Added`)
      .addField('Server', guild, true)
      .addField('Owner (Tag)', guild.member(guild.owner), true)
      .addField('Owner (ID)', guild.member(guild.owner).id, true)
      .addField('Invite', invite, true)
      .addField('Member Count', guild.memberCount, true)
      .setTimestamp()
    let message = await client.channels.get('727268177008001045').send(embed)
    message.pin()
});

client.on("guildDelete", async guild => {
    console.log(guild.id)
    var embed = new Discord.MessageEmbed()
      .setTitle(`Bot Left`)
      .addField('Server', guild, true)
      .addField('Owner (Tag)', guild.member(guild.owner), true)
      .addField('Owner (ID)', guild.member(guild.owner).id, true)
      .addField('Member Count', guild.memberCount, true)
      .setTimestamp()
      let message = await client.channels.get('727268177008001045').send(embed)
    message.pin()
});

client.on("message", (message) => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);

    
    // code for commands
    if (message.content.startsWith(config.prefix + "lookup")) {
        const collection = mongo.db("ezblacklist").collection("bans")
        let user = message.member;
        if (message.mentions.members.first()) {
            user = message.mentions.members.first()
        }
        let servers = [];
        client.guilds.cache.array().forEach((g) => {
        if (g.members.cache.has(user.user.id)) {
            servers.push(g.name);
        }
        });
        let text = servers.join("\n"); 
        collection.findOne({ discordId: user.user.id}).then((doc) => {
          if (doc) {
            // in ban db!!!
            let reason = doc.reason; // the ban reason

            const embe2d = new Discord.MessageEmbed()
           .setColor("GRAY")
           .setAuthor(`Lookup Of ${user.user.username}#${user.user.discriminator}`)
           .addField('Discord ID', `${user.user.id}`)
           .addField('Blacklisted', "true")
           .addField('Servers', '' + text)
           .addField('Moderation Reason', '`' + reason + '`')
           message.channel.send(embe2d)
          } else {
            const embed = new Discord.MessageEmbed()
           .setColor("GRAY")
           .setAuthor(`Lookup Of ${user.user.username}#${user.user.discriminator}`)
           .addField('Discord ID', `${user.user.id}`)
           .addField('Blacklisted', "false")
           .addField('Servers', '' + text)
           .addField('Moderation Reason', '`NO LOGS`')
           message.channel.send(embed)
          }
        }).catch(() => {
          // error
        });
      } else
      if (message.content.startsWith(config.prefix + "sban")) {
        const collection = mongo.db("ezblacklist").collection("bans")
        if(!message.member.hasPermission(["ADMINISTRATOR"])) return message.channel.send("You do not have permission to perform this command!")

        let guild = client.guilds.cache.get('545419360584466433')

        let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.member(message.mentions.users.first())
        if(!target) return message.channel.send("Please provide a valid user").then(m => m.delete(15000))

        let reason = args.slice(1).join(" ")
        if(!reason) return message.channel.send(`Please provide a reason for reporting **${target.user.tag}**`).then(m => m.delete(15000))
        
        const embed = new Discord.MessageEmbed()
        .setColor(`GRAY`)
        .setAuthor("ezBlacklist - Systems")
        .setDescription(`Would you Sync-Ban <@${target.user.id}> from ezBlacklist Databases?`)
        message.channel.send(embed).then(async msg => {
        const emoji = await promptMessage(msg, message.author, 5, ["✅", "❌"]);

        collection.insertOne({ discordId: theid, reason: "thereason"}).then(() => {

          // Verification stuffs
          if (emoji === "✅") {
              const newembedlol = new Discord.MessageEmbed()
              .setColor(`242424`)
              .setTitle("Blacklisted")
              .addField('User Id', `${target.user.id}`)
              .addField('User Tag', `${target.user.tag}`)
              let BChannel = guild.channels.cache.find(x => x.name === "ban-database")
              BChannel.send(newembedlol)
              const blacklistedlol = new Discord.MessageEmbed()
              .setColor(`242424`)
              .setTitle("You have been blacklisted of ezBlacklist Databases")
              .addField('User Id', `${target.user.id}`)
              .addField('User Tag', `${target.user.tag}`)
              target.send(blacklistedlol).then(() =>
              client.guilds.cache.array().forEach((guild) => message.guild.member.ban(target, { days: 1, reason: reason})).catch(err => console.log(err)))
          } else if (emoji === "❌") {
            message.delete(embed)
            const newembedlol = new Discord.MessageEmbed()
            .setColor(`242424`)
            .setTitle("ezBlacklist - Systems")
            .setDescription(`You have denied to not Sync-Ban <@${target.user.id}>`)
            message.channel.send(newembedlol)
          }
        })
        }).catch(() => {
          console.log("failed to do !sban")
        });

      } else
      if (message.content.startsWith(config.prefix + "skick")) {
        if(!message.member.hasPermission(["ADMINISTRATOR"])) return message.channel.send("You do not have permission to perform this command!")

        let guild = client.guilds.cache.get('545419360584466433')

        let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.member(message.mentions.users.first())
        if(!target) return message.channel.send("Please provide a valid user").then(m => m.delete(15000))

        // reasoning definition
        let reason = args.slice(1).join(" ")
        if(!reason) return message.channel.send(`Please provide a reason for reporting **${target.user.tag}**`).then(m => m.delete(15000))

        const embed = new Discord.MessageEmbed()
        .setColor(`242424`)
        .setAuthor("ezBlacklist - Systems")
        .setDescription(`Would you Sync-Kick <@${target.user.id}> from ezBlacklist Databases?`)
        message.channel.send(embed).then(async msg => {
          const emoji = await promptMessage(msg, message.author, 30, ["✅", "❌"]);

          // Verification stuffs
          if (emoji === "✅") {
              const newembedlol = new Discord.MessageEmbed()
              .setColor(`242424`)
              .setTitle("Kicked")
              .addField('User Id', `${target.user.id}`)
              .addField('User Tag', `${target.user.tag}`)
              let BChannel = guild.channels.cache.find(x => x.name === "kick-database")
              BChannel.send(newembedlol)
              const blacklistedlol = new Discord.MessageEmbed()
              .setColor(`242424`)
              .setTitle("You have been Kicked of ezBlacklist Databases")
              .addField('User Id', `${target.user.id}`)
              .addField('User Tag', `${target.user.tag}`)
              target.send(blacklistedlol)
              client.guilds.cache.array().forEach((guild) => {
                if (guild.members.cache.has(target.user.id)) {
                  guild.members.cache.get(target.user.id).kick({reason: reason});
                }
              });
          } else if (emoji === "❌") {
            message.delete(embed)
            const newembedlol = new Discord.MessageEmbed()
            .setColor(`242424`)
            .setTitle("ezBlacklist - Systems")
            .setDescription(`You have denied to not Sync-Kick <@${target.user.id}>`)
            message.channel.send(newembedlol)
          }
        })
      } else
      if (message.content.startsWith(config.prefix + "report")) {
        const collection = mongo.db("ezblacklist").collection("bans")

        collection.insertOne({ discordId: theid, reason: "thereason"}).then(() => {
          message.delete()
          let guild = client.guilds.cache.get('545419360584466433')
  
          const embedtarget = new Discord.MessageEmbed()
          .setColor('242424')
          .setAuthor('Valid User')
          .setDescription(`Please provide a valid user`)
  
          let target = message.mentions.members.first() || message.guild.members.get(args[0]) || message.guild.member(message.mentions.users.first())
          if(!target) return message.channel.send(embedtarget).then(m => m.delete(15000))
  
          // reasoning definition
          const embedreason = new Discord.MessageEmbed()
          .setColor('242424')
          .setAuthor('Reason')
          .setDescription(`Please provide a reason for reporting **${target.user.tag}**`)
  
          let reason = args.slice(1).join(" ")
          if(!reason) return message.channel.send(embedreason).then(m => m.delete(15000))
  
          // send to reports channel and add tick or cross
          const embedsd = new Discord.MessageEmbed()
          .setColor(`242424`)
          .setAuthor("Thanks!")
          .setDescription("Your Report has been sent to our Review Team.")
  
          message.channel.send(embedsd)
          const embed = new Discord.MessageEmbed()
          .setColor(`242424`)
          .setTitle("New Report")
          .addField('Submitter', `<@${message.author.id}>`)
          .addField('Accused', `<@${target.user.id}>`)
          .addField('Evidence', `${reason}`)
  
          let sChannel = guild.channels.cache.find(x => x.name === "blacklist-reviews")
          sChannel.send(embed).then(async msg => {
            // Await the reactions and the reactioncollector
            const emoji = await promptMessage(msg, message.author, 5, ["✅", "❌"]);
  
            // Verification stuffs
            if (emoji === "✅") {
                const newembedlol = new Discord.MessageEmbed()
                .setColor(`242424`)
                .setTitle("Blacklist Accepted")
                .setDescription(`Accepted by <@463247705527812097>`)
                .addField('Submitter', `<@${message.author.id}>`)
                .addField('Accused', `<@${target.user.id}>`)
                .addField('Evidence', `${reason}`)
                let BChannel = guild.channels.cache.find(x => x.name === "ban-database")
                BChannel.send(newembedlol)
                const blacklistedlol = new Discord.MessageEmbed()
                .setColor(`2F3136`)
                .setTitle("You have been blacklisted of ezBlacklist")
                .addField('Submitter', `<@${message.author.id}>`)
                .addField('Accused', `<@${target.user.id}>`)
                .addField('Evidence', `${reason}`)
                target.send(blacklistedlol)
            } else if (emoji === "❌") {
              const newembedlol = new Discord.MessageEmbed()
              .setColor(`242424`)
              .setTitle("Report Declined")
              .setDescription(`Declined by <@684516973853278266>`)
              .addField('Submitter', `<@${message.author.id}>`)
              .addField('Accused', `<@${target.user.id}>`)
              .addField('Evidence', `${reason}`)
              let CChannel = guild.channels.cache.find(x => x.name === "reject-database")
              CChannel.send(newembedlol)
              const notblacklistedlol = new Discord.MessageEmbed()
              .setColor(`242424`)
              .setTitle("Declined")
              .setDescription(`Your report about <@${target.user.id}> was declined`)
        //      message.user.send(notblacklistedlol)
            }
        });
        }).catch(() => {
          // error
        });
      }

});

client.login(process.env.token);
