const { Client, Intents } = require('discord.js');
const fs = require('fs');

class DiscordBot {
    constructor(token, send) {
        this.guilds = require("./guilds.json");
        this.users = [];
        this.client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] });
        this.client.on('ready', async () => {
            console.log(`Logged in as ${this.client.user.tag}!`);
            var guilds = await this.client.guilds.fetch();
            guilds.each(async guild => {
                guild = await guild.fetch();
                var members = await guild.members.fetch();
                members.filter(member => !member.user.bot).each(member => {
                    this.users.push({
                        avatar: member.user.avatarURL(),
                        name: member.user.username,
                        id: member.id
                    });
                });
            });
        });

        this.client.on("messageCreate", message => {
            if (this.guilds[message.guildId] && !message.author.bot) {
                if (message.channelId === this.guilds[message.guildId].channel) {
                    console.log("Send message from discord");
                    send({
                        avatar: message.author.avatarURL(),
                        name: message.author.username,
                        id: message.author.id
                    }, message.content, message.attachments.first() ? message.attachments.first().url : null);
                }
            }
        });

        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
            if (interaction.commandName === 'setchannel') {
                var channel = interaction.options.getChannel('channel');
                if (channel.isText()) {
                    var edited = false;
                    if (this.guilds[channel.guild.id]) {
                        var webhooks = await channel.guild.fetchWebhooks();
                        var webhook = webhooks.get(this.guilds[channel.guild.id].webhook);
                        if (webhook) {
                            console.log("Edit Webhook");
                            await webhook.edit({ channel: channel });
                            edited = true;
                        }
                    }
                    if (!edited) {
                        console.log("Create Webhook");
                        var webhook = await channel.createWebhook('Chat bot', {
                            avatar: "./public/images/user.png",
                            reason: 'The chat webhook.'
                        });
                        this.guilds[interaction.guildId] = {
                            channel: channel.id,
                            webhook: webhook.id
                        };
                        fs.writeFileSync("./guilds.json", JSON.stringify(this.guilds));
                    }
                    await interaction.reply('Channel is set to <#' + channel.id + '>!');
                } else {
                    await interaction.reply('<#' + channel.id + '> is not a text channel.');
                }
            }
        });
        this.client.login(token);
    }
    async send(message) {
        var guilds = await this.client.guilds.fetch();
        guilds.each(async guild => {
            guild = await guild.fetch();
            if (this.guilds[guild.id]) {
                var webhooks = await guild.fetchWebhooks();
                var webhook = webhooks.get(this.guilds[guild.id].webhook);
                if (webhook) {
                    console.log("Send message to discord");
                    await webhook.send({
                        avatarURL: message.author.avatar.startsWith("http") ? message.author.avatar : "https://sti3-chat.glitch.me" + message.author.avatar,
                        username: message.author.name,
                        content: message.text,
                        files: message.file ? ["https://sti3-chat.glitch.me" + message.file] : undefined
                    });
                }
            }
        });
    }
}
module.exports = DiscordBot;