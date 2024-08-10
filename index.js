const Discord = require('discord.js');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_INVITES"] });
const config = require('./config.json');
const { MessageActionRow, MessageButton } = require('discord.js');

let invites = {};

const getInviteCounts = async (guild) => {
    return new Map(guild.invites.cache.map(invite => [invite.code, invite.uses]));
};

client.once('ready', async () => {
    console.log('Bot is online!');
	console.log('Code by Wick Studio!');
	console.log('discord.gg/wicks');

    // Load all server invites
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            const currentInvites = await guild.invites.fetch();
            invites[guildId] = new Map(currentInvites.map(invite => [invite.code, invite.uses]));
            console.log(`Loaded ${currentInvites.size} invites for guild: ${guild.name}`);
        } catch (err) {
            console.log(`Failed to load invites for guild: ${guild.name}`);
            console.error(err);
        }
    }
});

client.on('inviteCreate', async invite => {
    const guildInvites = invites[invite.guild.id];
    guildInvites.set(invite.code, invite.uses);
});

client.on('inviteDelete', async invite => {
    const guildInvites = invites[invite.guild.id];
    guildInvites.delete(invite.code);
});

client.on('guildMemberAdd', async member => {
    const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);
    const role = member.guild.roles.cache.get(config.autoRoleId);

    
    if (role) {
        member.roles.add(role).catch(console.error);
    } else {
        console.log('Role not found');
    }

    const newInvites = await member.guild.invites.fetch();
    const usedInvite = newInvites.find(inv => {
        const prevUses = (invites[member.guild.id].get(inv.code) || 0);
        return inv.uses > prevUses;
    });

    let inviterMention = 'Unknown';
    if (usedInvite && usedInvite.inviter) {
        inviterMention = `<@${usedInvite.inviter.id}>`;
        console.log(`Member joined with invite code ${usedInvite.code}, invited by ${inviterMention}`);
    } else {
        console.log(`Member joined, but no matching invite was found.`);
    }

    
    const fullUser = await client.users.fetch(member.user.id, { force: true });

    const welcomeEmbed = new Discord.MessageEmbed()
        .setColor('#05131f')
        .setTitle('Welcome to the Server!')
        .setDescription(`Hello ${member}, welcome to **${member.guild.name}**! enjoy your stay.`)
        .addFields(
            { name: 'Username', value: member.user.tag, inline: true },
            { name: 'Invited By', value: inviterMention, inline: true },
            { name: 'Invite Used', value: usedInvite ? `||${usedInvite.code}||` : 'Direct Join', inline: true },
            { name: 'You\'re Member', value: `${member.guild.memberCount}`, inline: true },
            { name: 'Server Rules', value: '<#1164662648080707604>.', inline: true },
            { name: 'Support Channel', value: '<#1166772582951964702>.', inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    const bannerUrl = fullUser.bannerURL({ dynamic: true, format: 'png', size: 1024 });
    if (bannerUrl) {
        welcomeEmbed.setImage(bannerUrl);
    }

    // buttons
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setStyle('LINK')
                .setURL('https://www.twitch.tv/ifahad_ix')       // link to button 1
                .setLabel('twitch')                                 // name of button 1
                .setEmoji('<:twitch:1246870993134424165> '),       // emoji of button 1
            new MessageButton()
                .setStyle('LINK')
                .setURL('https://discord.gg/646')           // link to button 2
                .setLabel('64. ™')                               // name of button 2
                .setEmoji(':0581370F593D4C56B9B850BFDB283196: '),      // emoji of button 2
            new MessageButton()
                .setStyle('LINK')
                .setURL('https://www.tiktok.com/@boc.4')                // link to button 3
                .setLabel('tiktok')                          // name of button 3
                .setEmoji('<:TikTok:1174356848711839804> ')      // emoji of button 3
        );

    welcomeChannel.send({ embeds: [welcomeEmbed], components: [row] });

    invites[member.guild.id] = new Map(newInvites.map(invite => [invite.code, invite.uses]));
});

client.login(config.botToken);
