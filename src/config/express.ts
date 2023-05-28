import express from 'express';
import cors from 'cors';
import contactsRouter from '@routes/contacts.routes'
import errorHandler from '@middleware/errorHandler';
import mailchimp from '@config/mailchimp';
import { logger } from '@config//logger';
const createExpressServer = (): express.Application => {
    const app = express();

    app.use(express.urlencoded({ extended: true }))
    app.use(cors())
    app.use(express.json())

    app.disable('x-powered-by')
    app.get('/v1/health_checker', (_req, res) => {
        res.send('UP')
    })

    app.get('/v1/health_mailchimp', async (_req, res) => {
        try {
            const response = await mailchimp.ping.get();
            res.status(200).json(response)
        } catch (error: any) {
            const errorMessage = error?.detail || error?.message || 'Failed to fetch data'
            logger.error(errorMessage)
            res.status(500).json({ error: errorMessage })
        }
    })

    app.use('/v1/contacts', contactsRouter)
    app.use(errorHandler)

    return app;
}

export { createExpressServer }
