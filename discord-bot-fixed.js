// ---------- STATS AFILIADO ----------
        if (interaction.isChatInputCommand() && interaction.commandName === 'stats_afiliado') {
            const codigo = interaction.options.getString('codigo').toUpperCase();
            const affiliates = getAffiliates();
            const affiliate = affiliates[codigo];

            if (!affiliate) {
                return interaction.reply({ content: '❌ Código de afiliado não encontrado!', ephemeral: true });
            }

            const leads = getLeads().filter(lead => lead.affiliateCode === codigo);
            const conversao = affiliate.totalLeads > 0 ? ((affiliate.totalSales / affiliate.totalLeads) * 100).toFixed(1) : 0;
            const tierEmoji = { 'bronze': '🥉', 'prata': '🥈', 'ouro': '🥇', 'diamante': '💎' };

            const embed = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.PURPLE)
                .setTitle(`📊 Estatísticas - ${codigo}`)
                .setDescription(`**${tierEmoji[affiliate.tier]} Tier:** ${affiliate.tier.toUpperCase()}\n**Afiliado:** ${affiliate.name}`)
                .addFields(
                    { name: '🎫 Total de Leads', value: `\`${affiliate.totalLeads}\``, inline: true },
                    { name: '✅ Vendas Confirmadas', value: `\`${affiliate.totalSales}\``, inline: true },
                    { name: '📈 Taxa de Conversão', value: `\`${conversao}%\``, inline: true },
                    { name: '💰 Total Ganho', value: `\`R$ ${affiliate.totalEarnings.toFixed(2)}\``, inline: true },
                    { name: '⏳ Ganhos Pendentes', value: `\`R$ ${affiliate.pendingEarnings.toFixed(2)}\``, inline: true },
                    { name: '💎 Comissão', value: `\`${affiliate.commission}%\` do lucro`, inline: true },
                    { name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
                    { name: '🔗 Ganhos Cascata', value: `\`R$ ${(affiliate.cascadeEarnings || 0).toFixed(2)}\``, inline: true },
                    { name: '👥 Indicações Feitas', value: `\`${affiliate.referralsCount || 0}\` afiliados`, inline: true },
                    { name: '📊 Indicado por', value: affiliate.referredBy ? `\`${affiliate.referredBy}\`` : '`N/A`', inline: true }
                )
                .setThumbnail(EMBEDS_CONFIG.IMAGES.THUMBNAIL)
                const { Client, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType, ChannelType, PermissionsBitField, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });

// CONFIGURAÇÃO INICIAL
let CONFIG = {
    CATEGORY_ID: null,
    ROLE_SUPPORT_ID: null,
    LOG_CHANNEL_ID: null,
    STAFF_CHANNEL_ID: null,
    AFFILIATE_COMMISSION: 30, // Porcentagem DO LUCRO que vai para o afiliado (30% do lucro)
    CASCADE_COMMISSION: 10, // Porcentagem DO LUCRO para quem indicou o afiliado (10% do lucro)
    MIN_FEE: 10, // Taxa mínima de serviço (10%)
    MAX_FEE: 15  // Taxa máxima de serviço (15%)
};

// CUSTOMIZAÇÃO DAS EMBEDS
const EMBEDS_CONFIG = {
    COLORS: {
        PRIMARY: 0x00ff88,
        SUCCESS: 0x00ff00,
        DANGER: 0xff0000,
        WARNING: 0xffa500,
        INFO: 0x00bfff,
        GOLD: 0xffd700,
        PURPLE: 0x9b59b6
    },
    IMAGES: {
        THUMBNAIL: 'https://i.imgur.com/AfFp7pu.png',
        BANNER: 'https://i.imgur.com/4M34hi2.png',
        FOOTER_ICON: 'https://i.imgur.com/AfFp7pu.png'
    },
    TEXTS: {
        FOOTER: 'Vultos Swap - Sistema de Atendimento Premium',
        SETUP_SUCCESS: '✅ Sistema configurado com sucesso!',
        TICKET_CREATING: '🔄 Criando seu ticket...',
        TICKET_CREATED: '✅ Seu ticket foi criado com sucesso!',
        TICKET_CLOSING: '🔒 Fechando ticket...',
        NO_PERMISSION: '❌ Você não tem permissão para isso!',
        ALREADY_OPEN: '❌ Você já possui um ticket aberto!'
    }
};

// BANCO DE DADOS DE AFILIADOS
const DB_PATH = path.join(__dirname, 'affiliates.json');
const LEADS_PATH = path.join(__dirname, 'leads.json');

// Inicializa os arquivos de banco de dados
function initDatabase() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(LEADS_PATH)) {
        fs.writeFileSync(LEADS_PATH, JSON.stringify([], null, 2));
    }
}

// Funções do banco de dados
function getAffiliates() {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveAffiliates(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getLeads() {
    return JSON.parse(fs.readFileSync(LEADS_PATH, 'utf8'));
}

function saveLeads(data) {
    fs.writeFileSync(LEADS_PATH, JSON.stringify(data, null, 2));
}

// Valida se o código de afiliado existe
function validateAffiliateCode(code) {
    const affiliates = getAffiliates();
    return affiliates[code.toUpperCase()] !== undefined;
}

// Extrai valor numérico de uma string (apenas números)
function extractValue(valueString) {
    // Remove tudo que não é número, ponto ou vírgula
    const cleaned = valueString.replace(/[^\d.,]/g, '');
    // Substitui vírgula por ponto
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
}

// Calcula todas as comissões baseado no lucro da empresa
function calculateCommissions(valorTransacao, taxaPercentual, affiliateCode) {
    const affiliates = getAffiliates();
    const affiliate = affiliates[affiliateCode];
    
    if (!affiliate) {
        return {
            valorTransacao: valorTransacao,
            taxaPercentual: taxaPercentual,
            lucroTotal: 0,
            comissaoAfiliado: 0,
            comissaoCascata: 0,
            lucroEmpresa: 0
        };
    }

    // Calcula o lucro total da empresa (taxa sobre a transação)
    const lucroTotal = (valorTransacao * taxaPercentual) / 100;
    
    // Calcula comissão do afiliado direto (% do lucro)
    const comissaoAfiliado = (lucroTotal * (affiliate.commission || CONFIG.AFFILIATE_COMMISSION)) / 100;
    
    // Calcula comissão cascata se existir
    let comissaoCascata = 0;
    if (affiliate.referredBy) {
        const cascadeAffiliate = affiliates[affiliate.referredBy];
        if (cascadeAffiliate) {
            comissaoCascata = (lucroTotal * (cascadeAffiliate.cascadeCommission || CONFIG.CASCADE_COMMISSION)) / 100;
        }
    }
    
    // O que sobra é o lucro líquido da empresa
    const lucroEmpresa = lucroTotal - comissaoAfiliado - comissaoCascata;
    
    return {
        valorTransacao,
        taxaPercentual,
        lucroTotal,
        comissaoAfiliado,
        comissaoCascata,
        lucroEmpresa,
        affiliateData: affiliate,
        cascadeAffiliate: affiliate.referredBy ? affiliates[affiliate.referredBy] : null
    };
}

// --------------------------- REGISTRAR COMANDOS SLASH ---------------------------
const commands = [
    new SlashCommandBuilder()
        .setName('setup_ticket')
        .setDescription('Configura o sistema de tickets')
        .addChannelOption(opt => 
            opt.setName('canal')
               .setDescription('Canal para enviar o botão de abrir ticket')
               .addChannelTypes(ChannelType.GuildText)
               .setRequired(true))
        .addChannelOption(opt => 
            opt.setName('categoria')
               .setDescription('Categoria onde os tickets serão criados')
               .addChannelTypes(ChannelType.GuildCategory)
               .setRequired(true))
        .addRoleOption(opt =>
            opt.setName('role_suporte')
               .setDescription('Role que terá acesso aos tickets')
               .setRequired(true))
        .addChannelOption(opt =>
            opt.setName('log')
               .setDescription('Canal para logs de tickets')
               .addChannelTypes(ChannelType.GuildText)
               .setRequired(false))
        .addChannelOption(opt =>
            opt.setName('staff_channel')
               .setDescription('Canal exclusivo para staff ver leads e comissões')
               .addChannelTypes(ChannelType.GuildText)
               .setRequired(false))
        .addIntegerOption(opt =>
            opt.setName('comissao')
               .setDescription('Porcentagem de comissão para afiliados (padrão: 10%)')
               .setMinValue(1)
               .setMaxValue(50)
               .setRequired(false)),

    new SlashCommandBuilder()
        .setName('criar_afiliado')
        .setDescription('Cria um novo código de afiliado')
        .addStringOption(opt =>
            opt.setName('codigo')
               .setDescription('Código do afiliado (ex: JOAO123)')
               .setRequired(true))
        .addUserOption(opt =>
            opt.setName('usuario')
               .setDescription('Usuário Discord do afiliado')
               .setRequired(true))
        .addStringOption(opt =>
            opt.setName('nome')
               .setDescription('Nome do afiliado')
               .setRequired(true))
        .addIntegerOption(opt =>
            opt.setName('comissao_custom')
               .setDescription('% do LUCRO para este afiliado (padrão: 30%)')
               .setMinValue(1)
               .setMaxValue(80)
               .setRequired(false))
        .addStringOption(opt =>
            opt.setName('indicado_por')
               .setDescription('Código de quem indicou este afiliado (cascata)')
               .setRequired(false))
        .addStringOption(opt =>
            opt.setName('tier')
               .setDescription('Nível do afiliado')
               .addChoices(
                   { name: '🥉 Bronze (20% do lucro)', value: 'bronze' },
                   { name: '🥈 Prata (30% do lucro)', value: 'prata' },
                   { name: '🥇 Ouro (40% do lucro)', value: 'ouro' },
                   { name: '💎 Diamante (50% do lucro)', value: 'diamante' }
               )
               .setRequired(false)),

    new SlashCommandBuilder()
        .setName('listar_afiliados')
        .setDescription('Lista todos os afiliados cadastrados'),

    new SlashCommandBuilder()
        .setName('stats_afiliado')
        .setDescription('Mostra estatísticas de um afiliado')
        .addStringOption(opt =>
            opt.setName('codigo')
               .setDescription('Código do afiliado')
               .setRequired(true)),

    new SlashCommandBuilder()
        .setName('ranking_afiliados')
        .setDescription('Mostra o ranking dos melhores afiliados'),

    new SlashCommandBuilder()
        .setName('remover_afiliado')
        .setDescription('Remove um afiliado do sistema')
        .addStringOption(opt =>
            opt.setName('codigo')
               .setDescription('Código do afiliado a ser removido')
               .setRequired(true)),

    new SlashCommandBuilder()
        .setName('confirmar_venda')
        .setDescription('Confirma uma venda e registra a comissão')
        .addStringOption(opt =>
            opt.setName('ticket_id')
               .setDescription('ID do ticket (copie do canal staff)')
               .setRequired(true))
        .addNumberOption(opt =>
            opt.setName('valor_final')
               .setDescription('Valor FINAL da transação do cliente')
               .setRequired(true))
        .addNumberOption(opt =>
            opt.setName('taxa')
               .setDescription('Taxa cobrada (10-15%)')
               .setMinValue(10)
               .setMaxValue(15)
               .setRequired(true)),

    new SlashCommandBuilder()
        .setName('meus_ganhos')
        .setDescription('Mostra seus ganhos como afiliado')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Registrando comandos slash...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('✅ Comandos slash registrados com sucesso!');
    } catch (err) { 
        console.error('❌ Erro ao registrar comandos:', err); 
    }
})();

// --------------------------- READY ---------------------------
client.on('ready', () => {
    initDatabase();
    console.log(`✅ Bot online! Logado como ${client.user.tag}`);
    console.log(`📊 Afiliados cadastrados: ${Object.keys(getAffiliates()).length}`);
    console.log(`🎫 Leads registrados: ${getLeads().length}`);
});

// --------------------------- INTERACTIONS ---------------------------
client.on('interactionCreate', async interaction => {
    try {
        const guild = interaction.guild;

        // ---------- SETUP TICKET ----------
        if (interaction.isChatInputCommand() && interaction.commandName === 'setup_ticket') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: EMBEDS_CONFIG.TEXTS.NO_PERMISSION, ephemeral: true });
            }

            const canal = interaction.options.getChannel('canal');
            const categoria = interaction.options.getChannel('categoria');
            const roleSuporte = interaction.options.getRole('role_suporte');
            const logChannel = interaction.options.getChannel('log');
            const staffChannel = interaction.options.getChannel('staff_channel');
            const comissao = interaction.options.getInteger('comissao') || 10;

            CONFIG = {
                CATEGORY_ID: categoria.id,
                ROLE_SUPPORT_ID: roleSuporte.id,
                LOG_CHANNEL_ID: logChannel ? logChannel.id : null,
                STAFF_CHANNEL_ID: staffChannel ? staffChannel.id : null,
                AFFILIATE_COMMISSION: comissao
            };

            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('abrirTicket')
                    .setLabel('🎫 Abrir Ticket de Swap')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫')
            );

            const embed = {
                color: EMBEDS_CONFIG.COLORS.PRIMARY,
                author: {
                    name: 'Vultos Swap - Sistema de Tickets',
                    icon_url: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                },
                title: '🔄 **Sistema de Tickets - Swap**',
                description: '> Bem-vindo ao sistema de atendimento da **Vultos Swap**!\n> Clique no botão abaixo para abrir um ticket.\n\n**🔥 Serviços disponíveis:**',
                fields: [
                    {
                        name: '💸 PIX → CRYPTO',
                        value: '```Troque seu dinheiro por criptomoedas```',
                        inline: true
                    },
                    {
                        name: '💎 CRYPTO → PIX',
                        value: '```Converta suas criptos em dinheiro```',
                        inline: true
                    },
                    {
                        name: '\u200b',
                        value: '\u200b',
                        inline: true
                    },
                    {
                        name: '⚡ Processamento Rápido',
                        value: '• Atendimento 24/7\n• Taxas competitivas\n• Segurança garantida\n• Sistema de afiliados',
                        inline: false
                    }
                ],
                image: {
                    url: EMBEDS_CONFIG.IMAGES.BANNER
                },
                thumbnail: {
                    url: EMBEDS_CONFIG.IMAGES.THUMBNAIL
                },
                footer: { 
                    text: EMBEDS_CONFIG.TEXTS.FOOTER,
                    icon_url: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                },
                timestamp: new Date()
            };

            await canal.send({ embeds: [embed], components: [button] });
            await interaction.reply({ 
                content: `${EMBEDS_CONFIG.TEXTS.SETUP_SUCCESS}\n**Comissão de Afiliados:** ${comissao}%`, 
                ephemeral: true 
            });
        }

        // ---------- CRIAR AFILIADO ----------
        if (interaction.isChatInputCommand() && interaction.commandName === 'criar_afiliado') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: EMBEDS_CONFIG.TEXTS.NO_PERMISSION, ephemeral: true });
            }

            const codigo = interaction.options.getString('codigo').toUpperCase();
            const usuario = interaction.options.getUser('usuario');
            const nome = interaction.options.getString('nome');
            const comissaoCustom = interaction.options.getInteger('comissao_custom');
            const indicadoPor = interaction.options.getString('indicado_por')?.toUpperCase();
            const tier = interaction.options.getString('tier');

            const affiliates = getAffiliates();

            if (affiliates[codigo]) {
                return interaction.reply({ content: '❌ Este código já existe!', ephemeral: true });
            }

            // Valida código de cascata
            if (indicadoPor && !affiliates[indicadoPor]) {
                return interaction.reply({ 
                    content: `❌ O código de referência **${indicadoPor}** não existe!`, 
                    ephemeral: true 
                });
            }

            // Define comissão baseada no tier
            const tierCommissions = {
                'bronze': 20,
                'prata': 30,
                'ouro': 40,
                'diamante': 50
            };

            const tierEmojis = {
                'bronze': '🥉',
                'prata': '🥈',
                'ouro': '🥇',
                'diamante': '💎'
            };

            const finalCommission = comissaoCustom || (tier ? tierCommissions[tier] : CONFIG.AFFILIATE_COMMISSION);
            const finalTier = tier || 'prata'; // Padrão prata

            affiliates[codigo] = {
                userId: usuario.id,
                username: usuario.username,
                name: nome,
                commission: finalCommission, // % do LUCRO
                cascadeCommission: CONFIG.CASCADE_COMMISSION, // % do LUCRO para cascata
                tier: finalTier,
                referredBy: indicadoPor || null, // Código de quem indicou
                createdAt: new Date().toISOString(),
                totalLeads: 0,
                totalSales: 0,
                totalEarnings: 0, // Total ganho em comissões
                pendingEarnings: 0, // Ganhos pendentes (não confirmados)
                cascadeEarnings: 0, // Ganhos por indicações (cascata)
                referralsCount: 0 // Quantos afiliados ele indicou
            };

            saveAffiliates(affiliates);

            // Se tem cascata, atualiza o contador de referrals
            if (indicadoPor) {
                affiliates[indicadoPor].referralsCount = (affiliates[indicadoPor].referralsCount || 0) + 1;
                saveAffiliates(affiliates);
            }

            const embed = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.SUCCESS)
                .setTitle('✅ Afiliado Criado com Sucesso!')
                .addFields(
                    { name: '🎯 Código', value: `\`${codigo}\``, inline: true },
                    { name: '👤 Nome', value: nome, inline: true },
                    { name: `${tierEmojis[finalTier]} Tier`, value: finalTier.toUpperCase(), inline: true },
                    { name: '💰 Comissão', value: `**${finalCommission}%** do lucro`, inline: true },
                    { name: '📱 Discord', value: `${usuario}`, inline: true },
                    { name: '🔗 Cascata', value: indicadoPor ? `Sim - ${indicadoPor}` : 'Não', inline: true },
                    { name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
                    { name: '📊 Exemplo de Cálculo', value: `\`\`\`Cliente: R$ 1000\nTaxa (12%): R$ 120\nComissão afiliado (${finalCommission}%): R$ ${(120 * finalCommission / 100).toFixed(2)}${indicadoPor ? `\nCascata (10%): R$ ${(120 * 10 / 100).toFixed(2)}` : ''}\nLucro Empresa: R$ ${indicadoPor ? (120 - (120 * finalCommission / 100) - (120 * 10 / 100)).toFixed(2) : (120 - (120 * finalCommission / 100)).toFixed(2)}\`\`\``, inline: false }
                )
                .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: EMBEDS_CONFIG.TEXTS.FOOTER })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

            // Envia DM para o afiliado
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(EMBEDS_CONFIG.COLORS.GOLD)
                    .setTitle('🎉 Bem-vindo ao Programa de Afiliados!')
                    .setDescription('Você foi cadastrado como afiliado da **Vultos Swap**!')
                    .addFields(
                        { name: '🎯 Seu Código', value: `\`${codigo}\``, inline: false },
                        { name: `${tierEmojis[finalTier]} Seu Tier`, value: finalTier.toUpperCase(), inline: true },
                        { name: '💰 Sua Comissão', value: `**${finalCommission}%** do lucro`, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: '💡 Como Funciona?', value: '```1. Cliente faz swap de R$ 1000\n2. Vultos cobra 10-15% (R$ 100-150)\n3. Você ganha ' + finalCommission + '% desse lucro!\n4. Exemplo: R$ 120 lucro = R$ ' + (120 * finalCommission / 100).toFixed(2) + ' pra você```', inline: false },
                        { name: '📝 Comandos Úteis', value: '• `/meus_ganhos` - Ver seus ganhos\n• `/stats_afiliado` - Ver suas stats', inline: false }
                    )
                    .setThumbnail(EMBEDS_CONFIG.IMAGES.THUMBNAIL)
                    .setFooter({ text: 'Boa sorte nas vendas!' })
                    .setTimestamp();

                await usuario.send({ embeds: [dmEmbed] });
            } catch (err) {
                console.log('Não foi possível enviar DM para o afiliado');
            }
        }

        // ---------- LISTAR AFILIADOS ----------
        if (interaction.isChatInputCommand() && interaction.commandName === 'listar_afiliados') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: EMBEDS_CONFIG.TEXTS.NO_PERMISSION, ephemeral: true });
            }

            const affiliates = getAffiliates();
            const affiliateList = Object.entries(affiliates);

            if (affiliateList.length === 0) {
                return interaction.reply({ content: '❌ Nenhum afiliado cadastrado ainda!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.INFO)
                .setTitle('📋 Lista de Afiliados')
                .setDescription(`Total: **${affiliateList.length}** afiliados cadastrados`)
                .setThumbnail(EMBEDS_CONFIG.IMAGES.THUMBNAIL)
                .setFooter({ text: EMBEDS_CONFIG.TEXTS.FOOTER })
                .setTimestamp();

            affiliateList.slice(0, 10).forEach(([code, data]) => {
                embed.addFields({
                    name: `🎯 ${code}`,
                    value: `👤 ${data.name}\n💰 ${data.commission}% | 🎫 ${data.totalLeads} leads | 💵 R$ ${data.totalEarnings.toFixed(2)}`,
                    inline: true
                });
            });

            if (affiliateList.length > 10) {
                embed.addFields({ name: '\u200b', value: `... e mais ${affiliateList.length - 10} afiliados`, inline: false });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ---------- STATS AFILIADO ----------
        if (interaction.isChatInputCommand() && interaction.commandName === 'stats_afiliado') {
            const codigo = interaction.options.getString('codigo').toUpperCase();
            const affiliates = getAffiliates();
            const affiliate = affiliates[codigo];

            if (!affiliate) {
                return interaction.reply({ content: '❌ Código de afiliado não encontrado!', ephemeral: true });
            }

            const leads = getLeads().filter(lead => lead.affiliateCode === codigo);
            const conversao = affiliate.totalLeads > 0 ? ((affiliate.totalSales / affiliate.totalLeads) * 100).toFixed(1) : 0;

            const embed = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.PURPLE)
                .setTitle(`📊 Estatísticas - ${codigo}`)
                .setDescription(`**Afiliado:** ${affiliate.name}`)
                .addFields(
                    { name: '🎫 Total de Leads', value: `\`${affiliate.totalLeads}\``, inline: true },
                    { name: '✅ Vendas Confirmadas', value: `\`${affiliate.totalSales}\``, inline: true },
                    { name: '📈 Taxa de Conversão', value: `\`${conversao}%\``, inline: true },
                    { name: '💰 Total Ganho', value: `\`R$ ${affiliate.totalEarnings.toFixed(2)}\``, inline: true },
                    { name: '⏳ Ganhos Pendentes', value: `\`R$ ${affiliate.pendingEarnings.toFixed(2)}\``, inline: true },
                    { name: '💎 Comissão', value: `\`${affiliate.commission}%\``, inline: true }
                )
                .setThumbnail(EMBEDS_CONFIG.IMAGES.THUMBNAIL)
                .setFooter({ text: `Cadastrado em ${new Date(affiliate.createdAt).toLocaleDateString('pt-BR')}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ---------- MEUS GANHOS ----------
        if (interaction.isChatInputCommand() && interaction.commandName === 'meus_ganhos') {
            const affiliates = getAffiliates();
            const myAffiliate = Object.entries(affiliates).find(([code, data]) => data.userId === interaction.user.id);

            if (!myAffiliate) {
                return interaction.reply({ 
                    content: '❌ Você não está cadastrado como afiliado! Entre em contato com um administrador.', 
                    ephemeral: true 
                });
            }

            const [code, data] = myAffiliate;
            const conversao = data.totalLeads > 0 ? ((data.totalSales / data.totalLeads) * 100).toFixed(1) : 0;
            const tierEmoji = { 'bronze': '🥉', 'prata': '🥈', 'ouro': '🥇', 'diamante': '💎' };

            const embed = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.GOLD)
                .setTitle('💰 Seus Ganhos Como Afiliado')
                .setDescription(`**Seu Código:** \`${code}\`\n**${tierEmoji[data.tier]} Tier:** ${data.tier.toUpperCase()}`)
                .addFields(
                    { name: '🎫 Leads Gerados', value: `\`${data.totalLeads}\``, inline: true },
                    { name: '✅ Vendas Confirmadas', value: `\`${data.totalSales}\``, inline: true },
                    { name: '📈 Conversão', value: `\`${conversao}%\``, inline: true },
                    { name: '💵 Total Ganho', value: `\`R$ ${data.totalEarnings.toFixed(2)}\``, inline: true },
                    { name: '⏳ Pendente', value: `\`R$ ${data.pendingEarnings.toFixed(2)}\``, inline: true },
                    { name: '💎 Comissão', value: `\`${data.commission}%\` do lucro`, inline: true },
                    { name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
                    { name: '🔗 Ganhos Cascata', value: `\`R$ ${(data.cascadeEarnings || 0).toFixed(2)}\``, inline: true },
                    { name: '👥 Afiliados Indicados', value: `\`${data.referralsCount || 0}\``, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '📊 Exemplo de Ganho', value: `\`\`\`Cliente: R$ 1000\nTaxa (12%): R$ 120\nSeu ganho (${data.commission}%): R$ ${(120 * data.commission / 100).toFixed(2)}\`\`\``, inline: false }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Continue divulgando para ganhar mais!' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ---------- RANKING AFILIADOS ----------
        if (interaction.isChatInputCommand() && interaction.commandName === 'ranking_afiliados') {
            const affiliates = getAffiliates();
            const ranking = Object.entries(affiliates)
                .sort((a, b) => b[1].totalEarnings - a[1].totalEarnings)
                .slice(0, 10);

            if (ranking.length === 0) {
                return interaction.reply({ content: '❌ Nenhum afiliado cadastrado ainda!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.GOLD)
                .setTitle('🏆 Ranking de Afiliados')
                .setDescription('**Top 10 afiliados com maior faturamento**\n━━━━━━━━━━━━━━━━━━━━━━━━')
                .setThumbnail(EMBEDS_CONFIG.IMAGES.THUMBNAIL)
                .setFooter({ text: EMBEDS_CONFIG.TEXTS.FOOTER })
                .setTimestamp();

            ranking.forEach(([code, data], index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
                embed.addFields({
                    name: `${medal} ${code} - ${data.name}`,
                    value: `💰 R$ ${data.totalEarnings.toFixed(2)} | 🎫 ${data.totalLeads} leads | ✅ ${data.totalSales} vendas`,
                    inline: false
                });
            });

            await interaction.reply({ embeds: [embed] });
        }

        // ---------- REMOVER AFILIADO ----------
        if (interaction.isChatInputCommand() && interaction.commandName === 'remover_afiliado') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: EMBEDS_CONFIG.TEXTS.NO_PERMISSION, ephemeral: true });
            }

            const codigo = interaction.options.getString('codigo').toUpperCase();
            const affiliates = getAffiliates();

            if (!affiliates[codigo]) {
                return interaction.reply({ content: '❌ Código de afiliado não encontrado!', ephemeral: true });
            }

            delete affiliates[codigo];
            saveAffiliates(affiliates);

            await interaction.reply({ content: `✅ Afiliado **${codigo}** removido com sucesso!`, ephemeral: true });
        }

        // ---------- MEUS GANHOS ----------
        if (interaction.isChatInputCommand() && interaction.commandName === 'meus_ganhos') {
            const affiliates = getAffiliates();
            const myAffiliate = Object.entries(affiliates).find(([code, data]) => data.userId === interaction.user.id);

            if (!myAffiliate) {
                return interaction.reply({ 
                    content: '❌ Você não está cadastrado como afiliado! Entre em contato com um administrador.', 
                    ephemeral: true 
                });
            }

            const [code, data] = myAffiliate;
            const conversao = data.totalLeads > 0 ? ((data.totalSales / data.totalLeads) * 100).toFixed(1) : 0;

            const embed = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.GOLD)
                .setTitle('💰 Seus Ganhos Como Afiliado')
                .setDescription(`**Seu Código:** \`${code}\``)
                .addFields(
                    { name: '🎫 Leads Gerados', value: `\`${data.totalLeads}\``, inline: true },
                    { name: '✅ Vendas Confirmadas', value: `\`${data.totalSales}\``, inline: true },
                    { name: '📈 Conversão', value: `\`${conversao}%\``, inline: true },
                    { name: '💵 Total Ganho', value: `\`R$ ${data.totalEarnings.toFixed(2)}\``, inline: true },
                    { name: '⏳ Pendente', value: `\`R$ ${data.pendingEarnings.toFixed(2)}\``, inline: true },
                    { name: '💎 Comissão', value: `\`${data.commission}%\``, inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Continue divulgando para ganhar mais!' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ---------- CONFIRMAR VENDA ----------
        if (interaction.isChatInputCommand() && interaction.commandName === 'confirmar_venda') {
            if (!interaction.member.roles.cache.has(CONFIG.ROLE_SUPPORT_ID)) {
                return interaction.reply({ content: EMBEDS_CONFIG.TEXTS.NO_PERMISSION, ephemeral: true });
            }

            const ticketId = interaction.options.getString('ticket_id');
            const valorFinal = interaction.options.getNumber('valor_final');
            const taxa = interaction.options.getNumber('taxa');

            const leads = getLeads();
            const leadIndex = leads.findIndex(l => l.id === ticketId);

            if (leadIndex === -1) {
                return interaction.reply({ content: '❌ Ticket não encontrado!', ephemeral: true });
            }

            const lead = leads[leadIndex];
            
            if (lead.status === 'confirmed') {
                return interaction.reply({ content: '❌ Esta venda já foi confirmada!', ephemeral: true });
            }

            // Calcula as comissões REAIS baseado no valor final e taxa real
            const calculoFinal = calculateCommissions(valorFinal, taxa, lead.affiliateCode);

            // Atualiza o lead
            lead.status = 'confirmed';
            lead.valorFinal = valorFinal;
            lead.taxaFinal = taxa;
            lead.lucroFinal = calculoFinal.lucroTotal;
            lead.comissaoAfiliadoFinal = calculoFinal.comissaoAfiliado;
            lead.comissaoCascataFinal = calculoFinal.comissaoCascata;
            lead.lucroEmpresaFinal = calculoFinal.lucroEmpresa;
            lead.confirmedAt = new Date().toISOString();
            lead.confirmedBy = interaction.user.id;

            // Atualiza afiliado principal
            const affiliates = getAffiliates();
            const affiliate = affiliates[lead.affiliateCode];
            
            if (affiliate) {
                affiliate.totalSales++;
                affiliate.totalEarnings += calculoFinal.comissaoAfiliado;
                affiliate.pendingEarnings -= lead.comissaoAfiliadoEstimada || 0;

                // Notifica o afiliado
                try {
                    const affiliateUser = await client.users.fetch(affiliate.userId);
                    const notifyEmbed = new EmbedBuilder()
                        .setColor(EMBEDS_CONFIG.COLORS.SUCCESS)
                        .setTitle('💰 Venda Confirmada!')
                        .setDescription('Uma de suas indicações foi convertida em venda!')
                        .addFields(
                            { name: '🎫 Ticket', value: `\`${ticketId}\``, inline: false },
                            { name: '💵 Valor Transação', value: `R$ ${valorFinal.toFixed(2)}`, inline: true },
                            { name: '📊 Taxa Cobrada', value: `${taxa}%`, inline: true },
                            { name: '💰 Lucro Total', value: `R$ ${calculoFinal.lucroTotal.toFixed(2)}`, inline: true },
                            { name: '🎯 Sua Comissão', value: `**${affiliate.commission}%** do lucro`, inline: true },
                            { name: '💸 Você Ganhou', value: `**R$ ${calculoFinal.comissaoAfiliado.toFixed(2)}**`, inline: true },
                            { name: '\u200b', value: '\u200b', inline: true }
                        )
                        .setFooter({ text: 'Parabéns pela venda! Continue divulgando!' })
                        .setTimestamp();

                    await affiliateUser.send({ embeds: [notifyEmbed] });
                } catch (err) {
                    console.log('Não foi possível notificar o afiliado');
                }
            }

            // Atualiza afiliado cascata se existir
            if (lead.cascadeCode && calculoFinal.comissaoCascata > 0) {
                const cascadeAffiliate = affiliates[lead.cascadeCode];
                if (cascadeAffiliate) {
                    cascadeAffiliate.cascadeEarnings += calculoFinal.comissaoCascata;
                    cascadeAffiliate.totalEarnings += calculoFinal.comissaoCascata;

                    // Notifica afiliado cascata
                    try {
                        const cascadeUser = await client.users.fetch(cascadeAffiliate.userId);
                        const cascadeNotify = new EmbedBuilder()
                            .setColor(EMBEDS_CONFIG.COLORS.PURPLE)
                            .setTitle('🔗 Comissão Cascata Recebida!')
                            .setDescription('Sua indicação **' + lead.affiliateCode + '** fez uma venda!')
                            .addFields(
                                { name: '🎫 Ticket', value: `\`${ticketId}\``, inline: false },
                                { name: '👥 Seu Indicado', value: `**${lead.affiliateCode}**`, inline: true },
                                { name: '💵 Valor Transação', value: `R$ ${valorFinal.toFixed(2)}`, inline: true },
                                { name: '\u200b', value: '\u200b', inline: true },
                                { name: '💰 Lucro Total', value: `R$ ${calculoFinal.lucroTotal.toFixed(2)}`, inline: true },
                                { name: '🔗 Sua Comissão Cascata', value: `${CONFIG.CASCADE_COMMISSION}%`, inline: true },
                                { name: '💸 Você Ganhou', value: `**R$ ${calculoFinal.comissaoCascata.toFixed(2)}**`, inline: true }
                            )
                            .setFooter({ text: 'Continue indicando mais afiliados!' })
                            .setTimestamp();

                        await cascadeUser.send({ embeds: [cascadeNotify] });
                    } catch (err) {
                        console.log('Não foi possível notificar o afiliado cascata');
                    }
                }
            }

            saveAffiliates(affiliates);
            saveLeads(leads);

            const tierEmoji = { 'bronze': '🥉', 'prata': '🥈', 'ouro': '🥇', 'diamante': '💎' };
            const embed = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.SUCCESS)
                .setTitle('✅ Venda Confirmada com Sucesso!')
                .setDescription('**Comissões calculadas e registradas**\n━━━━━━━━━━━━━━━━━━━━━━━━')
                .addFields(
                    { name: '🎫 Ticket ID', value: `\`${ticketId}\``, inline: false },
                    { name: '💵 Valor Transação', value: `R$ ${valorFinal.toFixed(2)}`, inline: true },
                    { name: '📊 Taxa Cobrada', value: `${taxa}%`, inline: true },
                    { name: '💰 Lucro Total', value: `**R$ ${calculoFinal.lucroTotal.toFixed(2)}**`, inline: true },
                    { name: '\u200b', value: '**💸 DIVISÃO DO LUCRO:**', inline: false },
                    { name: `${tierEmoji[affiliate.tier]} Afiliado ${lead.affiliateCode}`, value: `${affiliate.name}\n${affiliate.commission}% = **R$ ${calculoFinal.comissaoAfiliado.toFixed(2)}**`, inline: true }
                );

            if (calculoFinal.comissaoCascata > 0 && lead.cascadeCode) {
                const cascadeAff = affiliates[lead.cascadeCode];
                embed.addFields({ 
                    name: `🔗 Cascata ${lead.cascadeCode}`, 
                    value: `${cascadeAff.name}\n${CONFIG.CASCADE_COMMISSION}% = **R$ ${calculoFinal.comissaoCascata.toFixed(2)}**`, 
                    inline: true 
                });
            } else {
                embed.addFields({ name: '\u200b', value: '\u200b', inline: true });
            }

            embed.addFields(
                { name: '🏢 Lucro Empresa', value: `**R$ ${calculoFinal.lucroEmpresa.toFixed(2)}**`, inline: true },
                { name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
                { name: '📊 Afiliados Notificados', value: '```✅ Notificações enviadas por DM```', inline: false }
            );

            embed.setFooter({ text: `Confirmado por ${interaction.user.tag}` });
            embed.setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

            // Atualiza no canal staff
            if (CONFIG.STAFF_CHANNEL_ID) {
                const staffChannel = guild.channels.cache.get(CONFIG.STAFF_CHANNEL_ID);
                if (staffChannel) {
                    const staffUpdate = new EmbedBuilder()
                        .setColor(EMBEDS_CONFIG.COLORS.SUCCESS)
                        .setTitle('✅ VENDA CONFIRMADA')
                        .setDescription(`**Ticket:** \`${ticketId}\`\n━━━━━━━━━━━━━━━━━━━━━━━━`)
                        .addFields(
                            { name: '💵 Valor Final', value: `R$ ${valorFinal.toFixed(2)}`, inline: true },
                            { name: '📊 Taxa', value: `${taxa}%`, inline: true },
                            { name: '💰 Lucro', value: `R$ ${calculoFinal.lucroTotal.toFixed(2)}`, inline: true },
                            { name: '🏢 Empresa', value: `R$ ${calculoFinal.lucroEmpresa.toFixed(2)}`, inline: true },
                            { name: '👤 Afiliado', value: `R$ ${calculoFinal.comissaoAfiliado.toFixed(2)}`, inline: true },
                            { name: '🔗 Cascata', value: calculoFinal.comissaoCascata > 0 ? `R$ ${calculoFinal.comissaoCascata.toFixed(2)}` : 'N/A', inline: true }
                        )
                        .setFooter({ text: `Confirmado por ${interaction.user.tag}` })
                        .setTimestamp();

                    await staffChannel.send({ embeds: [staffUpdate] });
                }
            }
        }

        // ---------- ABRIR TICKET ----------
        if (interaction.isButton() && interaction.customId === 'abrirTicket') {
            if (!CONFIG.CATEGORY_ID || !CONFIG.ROLE_SUPPORT_ID) {
                return interaction.reply({ 
                    content: '❌ Sistema de tickets não configurado! Contate um administrador.', 
                    ephemeral: true 
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('ticketModal')
                .setTitle('Iniciar Ticket de Swap');

            const referralInput = new TextInputBuilder()
                .setCustomId('referralCode')
                .setLabel('🎯 Código de Afiliado (OBRIGATÓRIO)')
                .setPlaceholder('Ex: JOAO123, MARIA456, etc.')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(20);

            const tipoInput = new TextInputBuilder()
                .setCustomId('tipoServico')
                .setLabel('Tipo de serviço')
                .setPlaceholder('Ex: PIX -> CRYPTO ou CRYPTO -> PIX')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const valorInput = new TextInputBuilder()
                .setCustomId('valor')
                .setLabel('💰 Valor da transação (APENAS NÚMEROS)')
                .setPlaceholder('Ex: 1000 ou 500.50 (não use R$, apenas números)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const criptoInput = new TextInputBuilder()
                .setCustomId('cripto')
                .setLabel('Qual criptomoeda você tem ou quer?')
                .setPlaceholder('Ex: BTC, ETH, USDT, etc.')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const detalhesInput = new TextInputBuilder()
                .setCustomId('detalhes')
                .setLabel('Informações adicionais (opcional)')
                .setPlaceholder('Alguma observação importante?')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(referralInput),
                new ActionRowBuilder().addComponents(tipoInput),
                new ActionRowBuilder().addComponents(valorInput),
                new ActionRowBuilder().addComponents(criptoInput)
            );

            await interaction.showModal(modal);
        }

        // ---------- SUBMIT MODAL ----------
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'ticketModal') {
            const referralCode = interaction.fields.getTextInputValue('referralCode').toUpperCase();
            const tipoServico = interaction.fields.getTextInputValue('tipoServico');
            const valorInput = interaction.fields.getTextInputValue('valor');
            const cripto = interaction.fields.getTextInputValue('cripto');

            // Extrai apenas números do valor
            const valorTransacao = extractValue(valorInput);

            // Valida se o valor é numérico
            if (valorTransacao === 0 || isNaN(valorTransacao)) {
                return interaction.reply({ 
                    content: `❌ Valor inválido! Use apenas números. Exemplo: 1000 ou 500.50`, 
                    ephemeral: true 
                });
            }

            // Valida valor mínimo (R$ 100 = 20 USD)
            if (valorTransacao < 100) {
                return interaction.reply({ 
                    content: `❌ Valor mínimo para swap: **R$ 100** (20 USD)`, 
                    ephemeral: true 
                });
            }

            // Valida o código de afiliado
            if (!validateAffiliateCode(referralCode)) {
                return interaction.reply({ 
                    content: `❌ Código de afiliado **${referralCode}** inválido! Verifique com quem te indicou.`, 
                    ephemeral: true 
                });
            }

            // Checa ticket duplicado
            const existing = guild.channels.cache.find(c => c.name === `ticket-${interaction.user.username.toLowerCase()}`);
            if (existing) {
                return interaction.reply({ 
                    content: `❌ Você já possui um ticket aberto: ${existing}`, 
                    ephemeral: true 
                });
            }

            await interaction.reply({ content: '🔄 Criando seu ticket...', ephemeral: true });

            const channel = await guild.channels.create({
                name: `ticket-${interaction.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CONFIG.CATEGORY_ID,
                topic: `Ticket de ${interaction.user.tag} | Afiliado: ${referralCode} | Criado em ${new Date().toLocaleString('pt-BR')}`,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ],
                    },
                    {
                        id: CONFIG.ROLE_SUPPORT_ID,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ],
                    },
                ],
            });

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('fecharTicket')
                    .setLabel('Fechar Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            // Calcula comissões com taxa média de 12.5%
            const taxaMedia = 12.5;
            const calculo = calculateCommissions(valorTransacao, taxaMedia, referralCode);

            // Registra o lead
            const ticketId = `LEAD-${Date.now()}`;
            const lead = {
                id: ticketId,
                affiliateCode: referralCode,
                userId: interaction.user.id,
                username: interaction.user.tag,
                tipoServico,
                valorTransacao: valorTransacao,
                cripto,
                taxaEstimada: taxaMedia,
                lucroEstimado: calculo.lucroTotal,
                comissaoAfiliadoEstimada: calculo.comissaoAfiliado,
                comissaoCascataEstimada: calculo.comissaoCascata,
                lucroEmpresaEstimado: calculo.lucroEmpresa,
                channelId: channel.id,
                createdAt: new Date().toISOString(),
                status: 'pending',
                cascadeCode: calculo.affiliateData.referredBy || null
            };

            const leads = getLeads();
            leads.push(lead);
            saveLeads(leads);

            // Atualiza estatísticas do afiliado
            const affiliates = getAffiliates();
            affiliates[referralCode].totalLeads++;
            affiliates[referralCode].pendingEarnings += calculo.comissaoAfiliado;
            saveAffiliates(affiliates);

            // EMBED PARA O CLIENTE
            const ticketEmbedCliente = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.SUCCESS)
                .setAuthor({ 
                    name: `Ticket de ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTitle('🎫 Seu Ticket foi Criado!')
                .setDescription(`> Olá ${interaction.user}!\n> Nossa equipe já foi notificada e irá atendê-lo em breve.\n\n**📋 Informações do seu pedido:**`)
                .addFields(
                    { name: '🔄 Tipo de Serviço', value: `\`\`\`${tipoServico}\`\`\``, inline: false },
                    { name: '💰 Valor da Transação', value: `\`\`\`R$ ${valorTransacao.toFixed(2)}\`\`\``, inline: true },
                    { name: '💎 Criptomoeda', value: `\`\`\`${cripto}\`\`\``, inline: true },
                    { name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
                    { name: '📊 Taxa de Serviço', value: `Entre **10% a 15%** do valor\n(taxa varia por moeda)`, inline: false },
                    { name: '⏰ Tempo de Resposta', value: '```Geralmente respondemos em até 5 minutos```', inline: false }
                )
                .setThumbnail(EMBEDS_CONFIG.IMAGES.THUMBNAIL)
                .setFooter({ 
                    text: 'Obrigado por escolher a Vultos Swap!',
                    iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                })
                .setTimestamp();

            await channel.send({ embeds: [ticketEmbedCliente] });

            // EMBED PARA O STAFF NO CANAL DO TICKET
            const tierEmoji = { 'bronze': '🥉', 'prata': '🥈', 'ouro': '🥇', 'diamante': '💎' };
            const ticketEmbedStaff = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.WARNING)
                .setAuthor({ 
                    name: '🚨 NOVO TICKET - AÇÃO NECESSÁRIA',
                    iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                })
                .setTitle('📊 Informações do Cliente')
                .setDescription(`<@&${CONFIG.ROLE_SUPPORT_ID}> **Um novo cliente aguarda atendimento!**`)
                .addFields(
                    { name: '👤 Cliente', value: `${interaction.user}\n\`${interaction.user.tag}\`\n\`ID: ${interaction.user.id}\``, inline: true },
                    { name: '📅 Data de Criação', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '🎯 Código Afiliado', value: `\`\`\`${referralCode}\`\`\``, inline: true },
                    { name: `${tierEmoji[calculo.affiliateData.tier]} Tier do Afiliado`, value: `${calculo.affiliateData.tier.toUpperCase()}\n${calculo.affiliateData.commission}% do lucro`, inline: true },
                    { name: '👨‍💼 Nome', value: `\`\`\`${calculo.affiliateData.name}\`\`\``, inline: true },
                    { name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
                    { name: '🔄 Tipo de Serviço', value: `\`\`\`fix\n${tipoServico}\n\`\`\``, inline: false },
                    { name: '💰 Valor Transação', value: `\`\`\`R$ ${valorTransacao.toFixed(2)}\`\`\``, inline: true },
                    { name: '💎 Criptomoeda', value: `\`\`\`${cripto}\`\`\``, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '⚠️ Ações Recomendadas', value: '```• Verificar histórico do cliente\n• Confirmar qual moeda e taxa exata\n• Calcular valor final\n• Fornecer instruções de pagamento```', inline: false }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setImage(EMBEDS_CONFIG.IMAGES.BANNER)
                .setFooter({ 
                    text: 'Sistema de Tickets - Vultos Swap',
                    iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                })
                .setTimestamp();

            await channel.send({ embeds: [ticketEmbedStaff], components: [closeButton] });getTextInputValue('cripto');

            // Valida o código de afiliado
            if (!validateAffiliateCode(referralCode)) {
                return interaction.reply({ 
                    content: `❌ Código de afiliado **${referralCode}** inválido! Verifique com quem te indicou.`, 
                    ephemeral: true 
                });
            }

            // Checa ticket duplicado
            const existing = guild.channels.cache.find(c => c.name === `ticket-${interaction.user.username.toLowerCase()}`);
            if (existing) {
                return interaction.reply({ 
                    content: `❌ Você já possui um ticket aberto: ${existing}`, 
                    ephemeral: true 
                });
            }

            await interaction.reply({ content: '🔄 Criando seu ticket...', ephemeral: true });

            const channel = await guild.channels.create({
                name: `ticket-${interaction.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CONFIG.CATEGORY_ID,
                topic: `Ticket de ${interaction.user.tag} | Afiliado: ${referralCode} | Criado em ${new Date().toLocaleString('pt-BR')}`,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ],
                    },
                    {
                        id: CONFIG.ROLE_SUPPORT_ID,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ],
                    },
                ],
            });

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('fecharTicket')
                    .setLabel('Fechar Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            // Calcula comissão estimada
            const valorNumerico = extractValue(valor);
            const affiliates = getAffiliates();
            const affiliate = affiliates[referralCode];
            const comissaoEstimada = (valorNumerico * affiliate.commission) / 100;
            const lucroEstimado = valorNumerico - comissaoEstimada;

            // Registra o lead
            const ticketId = `LEAD-${Date.now()}`;
            const lead = {
                id: ticketId,
                affiliateCode: referralCode,
                userId: interaction.user.id,
                username: interaction.user.tag,
                tipoServico,
                valor,
                valorNumerico,
                cripto,
                estimatedCommission: comissaoEstimada,
                channelId: channel.id,
                createdAt: new Date().toISOString(),
                status: 'pending'
            };

            const leads = getLeads();
            leads.push(lead);
            saveLeads(leads);

            // Atualiza estatísticas do afiliado
            affiliate.totalLeads++;
            affiliate.pendingEarnings += comissaoEstimada;
            saveAffiliates(affiliates);

            // EMBED PARA O CLIENTE
            const ticketEmbedCliente = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.SUCCESS)
                .setAuthor({ 
                    name: `Ticket de ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTitle('🎫 Seu Ticket foi Criado!')
                .setDescription(`> Olá ${interaction.user}!\n> Nossa equipe já foi notificada e irá atendê-lo em breve.\n\n**📋 Informações do seu pedido:**`)
                .addFields(
                    { name: '🔄 Tipo de Serviço', value: `\`\`\`${tipoServico}\`\`\``, inline: false },
                    { name: '💰 Valor', value: `\`\`\`${valor}\`\`\``, inline: true },
                    { name: '💎 Criptomoeda', value: `\`\`\`${cripto}\`\`\``, inline: true },
                    { name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
                    { name: '⏰ Tempo de Resposta', value: '```Geralmente respondemos em até 5 minutos```', inline: false }
                )
                .setThumbnail(EMBEDS_CONFIG.IMAGES.THUMBNAIL)
                .setFooter({ 
                    text: 'Obrigado por escolher a Vultos Swap!',
                    iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                })
                .setTimestamp();

            await channel.send({ embeds: [ticketEmbedCliente] });

            // EMBED PARA O STAFF NO CANAL DO TICKET
            const ticketEmbedStaff = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.WARNING)
                .setAuthor({ 
                    name: '🚨 NOVO TICKET - AÇÃO NECESSÁRIA',
                    iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                })
                .setTitle('📊 Informações do Cliente')
                .setDescription(`<@&${CONFIG.ROLE_SUPPORT_ID}> **Um novo cliente aguarda atendimento!**`)
                .addFields(
                    { name: '👤 Cliente', value: `${interaction.user}\n\`${interaction.user.tag}\`\n\`ID: ${interaction.user.id}\``, inline: true },
                    { name: '📅 Data de Criação', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '🎯 Código Afiliado', value: `\`\`\`${referralCode}\`\`\``, inline: true },
                    { name: '👨‍💼 Afiliado', value: `\`\`\`${affiliate.name}\`\`\``, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '🔄 Tipo de Serviço', value: `\`\`\`fix\n${tipoServico}\n\`\`\``, inline: false },
                    { name: '💰 Valor Solicitado', value: `\`\`\`yaml\n${valor}\n\`\`\``, inline: true },
                    { name: '💎 Criptomoeda', value: `\`\`\`yaml\n${cripto}\n\`\`\``, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '⚠️ Ações Recomendadas', value: '```• Verificar histórico do cliente\n• Confirmar dados da transação\n• Calcular taxa e valor final\n• Fornecer instruções de pagamento```', inline: false }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setImage(EMBEDS_CONFIG.IMAGES.BANNER)
                .setFooter({ 
                    text: 'Sistema de Tickets - Vultos Swap',
                    iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                })
                .setTimestamp();

            await channel.send({ embeds: [ticketEmbedStaff], components: [closeButton] });

            // EMBED PARA CANAL STAFF (Dashboard de Leads)
            if (CONFIG.STAFF_CHANNEL_ID) {
                const staffChannel = guild.channels.cache.get(CONFIG.STAFF_CHANNEL_ID);
                if (staffChannel) {
                    const staffDashboard = new EmbedBuilder()
                        .setColor(EMBEDS_CONFIG.COLORS.GOLD)
                        .setAuthor({ 
                            name: '💎 NOVO LEAD REGISTRADO',
                            iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                        })
                        .setTitle('📈 Dashboard de Vendas')
                        .setDescription(`**🆔 Ticket ID:** \`${ticketId}\`\n━━━━━━━━━━━━━━━━━━━━━━━━`)
                        .addFields(
                            { name: '💰 Valor da Transação', value: `\`R$ ${valorTransacao.toFixed(2)}\``, inline: true },
                            { name: '📊 Taxa Estimada', value: `\`${taxaMedia}%\``, inline: true },
                            { name: '💵 Lucro Total', value: `\`R$ ${calculo.lucroTotal.toFixed(2)}\``, inline: true },
                            { name: '\u200b', value: '**💸 DIVISÃO DO LUCRO:**', inline: false },
                            { name: `${tierEmoji[calculo.affiliateData.tier]} Comissão Afiliado`, value: `**${referralCode}** (${calculo.affiliateData.commission}%)\n\`R$ ${calculo.comissaoAfiliado.toFixed(2)}\``, inline: true }
                        )
                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

                    // Adiciona cascata se existir
                    if (calculo.comissaoCascata > 0 && calculo.cascadeAffiliate) {
                        staffDashboard.addFields({ 
                            name: '🔗 Comissão Cascata', 
                            value: `**${calculo.affiliateData.referredBy}** (${CONFIG.CASCADE_COMMISSION}%)\n\`R$ ${calculo.comissaoCascata.toFixed(2)}\``, 
                            inline: true 
                        });
                    } else {
                        staffDashboard.addFields({ name: '\u200b', value: '\u200b', inline: true });
                    }

                    staffDashboard.addFields(
                        { name: '🏢 Lucro Empresa', value: `\`R$ ${calculo.lucroEmpresa.toFixed(2)}\``, inline: true },
                        { name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
                        { name: '👤 Cliente', value: `${interaction.user}`, inline: true },
                        { name: '🔄 Tipo', value: `\`${tipoServico}\``, inline: true },
                        { name: '💎 Cripto', value: `\`${cripto}\``, inline: true },
                        { name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
                        { name: '🎫 Canal do Ticket', value: `${channel}`, inline: true },
                        { name: '📊 Status', value: '```⏳ Aguardando Atendimento```', inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: '📝 Para Confirmar Venda', value: `\`\`\`/confirmar_venda ticket_id:${ticketId} valor_final:[VALOR] taxa:[10-15]\`\`\``, inline: false }
                    );

                    staffDashboard.setFooter({ 
                        text: `Stats ${referralCode}: ${calculo.affiliateData.totalLeads} leads | ${calculo.affiliateData.totalSales} vendas | R$ ${calculo.affiliateData.totalEarnings.toFixed(2)} ganhos`,
                        iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                    });

                    staffDashboard.setTimestamp();

                    await staffChannel.send({ embeds: [staffDashboard] });
                }
            }

            // Log
            if (CONFIG.LOG_CHANNEL_ID) {
                const log = guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
                if (log) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(EMBEDS_CONFIG.COLORS.SUCCESS)
                        .setAuthor({ 
                            name: 'Sistema de Logs - Ticket Criado',
                            iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                        })
                        .setTitle('🟢 Novo Ticket Aberto')
                        .setDescription('**Um novo ticket foi criado no sistema**')
                        .addFields(
                            { name: '🎫 Canal', value: `${channel}\n\`${channel.name}\``, inline: true },
                            { name: '👤 Usuário', value: `${interaction.user}\n\`${interaction.user.tag}\``, inline: true },
                            { name: '\u200b', value: '\u200b', inline: true },
                            { name: '🎯 Afiliado', value: `\`${referralCode}\``, inline: true },
                            { name: '🔄 Tipo', value: `\`${tipoServico}\``, inline: true },
                            { name: '💰 Valor', value: `\`R$ ${valorTransacao.toFixed(2)}\``, inline: true }
                        )
                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ 
                            text: 'Log de Sistema',
                            iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                        })
                        .setTimestamp();

                    await log.send({ embeds: [logEmbed] });
                }
            }

            await interaction.editReply({ content: `✅ Seu ticket foi criado: ${channel}` });
        }

        // ---------- FECHAR TICKET ----------
        if (interaction.isButton() && interaction.customId === 'fecharTicket') {
            const channel = interaction.channel;
            const channelName = channel.name.split('-')[1];

            const hasPermission = interaction.member.roles.cache.has(CONFIG.ROLE_SUPPORT_ID) || 
                                 interaction.user.username.toLowerCase() === channelName ||
                                 interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

            if (!hasPermission) {
                return interaction.reply({ content: EMBEDS_CONFIG.TEXTS.NO_PERMISSION, ephemeral: true });
            }

            const closeEmbed = new EmbedBuilder()
                .setColor(EMBEDS_CONFIG.COLORS.DANGER)
                .setAuthor({ 
                    name: 'Sistema de Tickets',
                    iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                })
                .setTitle('🔒 Ticket Sendo Fechado')
                .setDescription(`> Este ticket será **fechado** e **deletado** em **5 segundos**.\n> Fechado por: ${interaction.user}`)
                .addFields(
                    { name: '⏰ Fechamento', value: '```5 segundos...```', inline: true },
                    { name: '📊 Status', value: '```Finalizado```', inline: true }
                )
                .setFooter({ 
                    text: 'Obrigado por usar nossos serviços!',
                    iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                })
                .setTimestamp();

            await interaction.reply({ embeds: [closeEmbed] });

            // Log antes de fechar
            if (CONFIG.LOG_CHANNEL_ID) {
                const log = guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
                if (log) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(EMBEDS_CONFIG.COLORS.DANGER)
                        .setAuthor({ 
                            name: 'Sistema de Logs - Ticket Fechado',
                            iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                        })
                        .setTitle('🔴 Ticket Fechado')
                        .setDescription('**Um ticket foi encerrado**')
                        .addFields(
                            { name: '🎫 Canal', value: `\`${channel.name}\``, inline: true },
                            { name: '👤 Fechado por', value: `${interaction.user}\n\`${interaction.user.tag}\``, inline: true },
                            { name: '\u200b', value: '\u200b', inline: true },
                            { name: '⏰ Horário de Fechamento', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                        )
                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ 
                            text: 'Log de Sistema',
                            iconURL: EMBEDS_CONFIG.IMAGES.FOOTER_ICON
                        })
                        .setTimestamp();

                    await log.send({ embeds: [logEmbed] });
                }
            }

            setTimeout(() => channel.delete(), 5000);
        }

    } catch (error) {
        console.error('❌ Erro na interação:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ 
                content: '❌ Ocorreu um erro ao processar sua solicitação!', 
                ephemeral: true 
            }).catch(() => {});
        } else {
            await interaction.reply({ 
                content: '❌ Ocorreu um erro ao processar sua solicitação!', 
                ephemeral: true 
            }).catch(() => {});
        }
    }
});

// Tratamento de erros global
client.on('error', error => {
    console.error('❌ Erro no cliente Discord:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Erro não tratado:', error);
});

client.login(process.env.TOKEN);