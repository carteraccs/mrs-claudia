import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    time
} from 'discord.js';
import axios from 'axios';
import { BotCommand, BotClient, enableEverywhere } from '../../client';
import packageInfo from '../../../package.json' with { type: 'json' };

interface GithubRes {
    login: string;
    html_url: string;
}

const data = enableEverywhere(
    new SlashCommandBuilder()
        .setName('info')
        .setDescription('View system metrics, features, and contributors for Mrs. Claudia')
);

async function run(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const client = interaction.client as BotClient;
    const user = client.user;
    if (!user) return;

    const info = await axios.get<GithubRes[]>(
        "https://api.github.com/repos/carteraccs/mrs-claudia/contributors"
    ).catch(() => ({ data: [] }));

    const uptimeTimestamp = Math.floor((Date.now() - (client.uptime ?? 0)) / 1000);
    const createdTimestamp = Math.floor(user.createdTimestamp / 1000);

    const guildCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const commandCount = client.commands.size;

    const contributors = info.data.slice(0, 5).map((user) => `[@${user.login}](${user.html_url})`).join("\n");
    const contributorField = info.data.length > 5
        ? `${contributors}\n*+${info.data.length - 5} more*`
        : contributors;

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `${user.username} Overview`,
            iconURL: user.displayAvatarURL(),
        })
        .setTitle("✨ Mrs. Claudia")
        .setThumbnail(user.displayAvatarURL({ size: 1024 }))
        .setColor(0x5865f2)
        .setDescription("A utility bot providing API requests, debugging tools, database utilities, and more.\n*This project was created with substantial assistance from AI tools.*")
        .addFields(
            {
                name: "⚡ System Status",
                value: [
                    `**Latency:** \`${client.ws.ping}ms\``,
                    `**Online Since:** ${time(uptimeTimestamp, "R")}`,
                    `**Created:** ${time(createdTimestamp, "D")}`,
                ].join("\n"),
                inline: true,
            },
            {
                name: "🛠️ Environment",
                value: [
                    `**Runtime:** \`Bun v${(process.versions as any).bun || "Unknown"}\``,
                    `**Discord.js:** \`${packageInfo.dependencies?.['discord.js'] || "N/A"}\``,
                    `**Version:** \`v${packageInfo.version || "Unknown"}\``,
                ].join("\n"),
                inline: true,
            },
            {
                name: "🌐 Reach",
                value: [
                    `**Servers:** \`${guildCount}\``,
                    `**Users:** \`${userCount}\``,
                    `**Commands:** \`${commandCount}\``,
                ].join("\n"),
                inline: true,
            },
            {
                name: `🧑‍🤝‍🧑 Contributors [${info.data.length}]`,
                value: info.data.length > 0 ? contributorField : "No contributors found.",
                inline: true,
            },
            {
                name: "💖 Special Thanks",
                value: "**Tiago S.** Hosting\n**Significant** Contributions",
                inline: true,
            },
        )
        .setFooter({
            text: `Requested by ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp(new Date());

    const addAppBtn = new ButtonBuilder()
        .setLabel("Add to my Apps")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/oauth2/authorize?client_id=${user.id}&permissions=0&integration_type=0&scope=bot+applications.commands`);

    const repoBtn = new ButtonBuilder()
        .setLabel("GitHub Repository")
        .setStyle(ButtonStyle.Link)
        .setURL("https://github.com/carteraccs/mrs-claudia");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(addAppBtn, repoBtn);

    await interaction.editReply({
        embeds: [embed],
        components: [row],
    });
}

export const infoCommand: BotCommand = { data, execute: run };
