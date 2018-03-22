const Telegraf = require('telegraf')
const LocalSession = require('telegraf-session-local')
const _ = require('lodash')


class DbusBot {
    constructor(){
        this.stopsManager = null;
    }

    init () {
        this.initBot();
    }

    initBot () {
        this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
        this.initMiddelwares()
        this.bot.start((context) => {
            if (_.has(context.session, 'welcomeMessageDisplayed')) {
                return context.reply('Welcome back!')
            } else {
                context.session.welcomeMessageDisplayed = true
                return context.reply('Welcome, it is your first time here!')
            }
        })
        this.initDialogs()
        this.bot.startPolling()
    }

    initDialogs () {
        this.initMainDialog()
    }

    initMainDialog () {
        this.bot.command('tiemposParada', (context) => {
            console.log(context.entities)
            context.reply('verParada')
        })
    }

    initMiddelwares () {
        // Persistent sessions
        this.bot.use((new LocalSession({ database: 'example_db.json' })).middleware())
        this.bot.on('text', (context, next) => {
            context.session.numberOfRequests = context.session.numberOfRequests + 1 || 1
            next()
        })
        this.bot.use((ctx, next) => {
            const start = new Date()
            return next().then(() => {
                const ms = new Date() - start
                console.log('response time %sms', ms)
            })
        })
    }
}

module.exports = DbusBot