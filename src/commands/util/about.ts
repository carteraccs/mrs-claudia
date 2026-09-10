import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  time,
} from "discord.js";
import axios from "axios";
import { Command } from "../../base/classes/command.js";
import { Embed } from "../../base/functions/embed.js";
import packageInfo from "../../../package.json" with { type: "json" };

interface GithubRes {
  login: string;
  html_url: string;
}

export default new Command({
  info: new SlashCommandBuilder()
    .setName("info")
    .setDescription("View system metrics, features, and contributors for Mrs. Claudia"),

  async execute(interaction) {
    await interaction.deferReply();

    const client = interaction.client;
    
    const info = await axios.get<GithubRes[]>(
      "https://api.github.com/repos/carteraccs/mrs-claudia/contributors"
    ).catch(() => ({ data: [] }));

    const uptimeTimestamp = Math.floor((Date.now() - client.uptime) / 1000);
    const createdTimestamp = Math.floor(client.user.createdTimestamp / 1000);

    const embed = (await Embed())
      .setAuthor({
        name: `${client.user.username} Overview`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setThumbnail(client.user.displayAvatarURL({ size: 1024 }))
      .setDescription(
        "A utility bot providing API requests, debugging tools, database utilities, and more.\n*This project was created with substantial assistance from AI tools.*"
      )
      .addFields(
        {
          name: `Contributors [${info.data.length}]`,
          value: info.data.length > 0 
            ? info.data.map((user) => `[@${user.login}](${user.html_url})`).join("\n")
            : "No contributors found or API limit reached.",
          inline: true,
        },
        {
          name: "Special Thanks 💖",
          value: "**Tiago S.** Hosting\n**Significant** Contributions",
          inline: true,
        },
        {
          name: "System Status",
          value: [
            `**Latency:** \`${client.ws.ping}ms\``,
            `**Online Since:** ${time(uptimeTimestamp, "R")}`,
            `**Created:** ${time(createdTimestamp, "D")}`,
          ].join("\n"),
          inline: false,
        },
        {
          name: "Environment",
          value: [
            `**Runtime:** \`Bun v${(process.versions as any).bun || "Unknown"}\``,
            `**Discord.js:** \`${packageInfo.dependencies?.["discord.js"] || "N/A"}\``,
            `**Version:** \`v${packageInfo.version || "Unknown"}\``,
          ].join("\n"),
          inline: true,
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    const addAppBtn = new ButtonBuilder()
      .setLabel("Add to my Apps")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=0&integration_type=0&scope=bot+applications.commands`);

    const repoBtn = new ButtonBuilder()
      .setLabel("GitHub Repository")
      .setStyle(ButtonStyle.Link)
      .setURL("https://github.com/carteraccs/mrs-claudia");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(addAppBtn, repoBtn);

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  },
});
