
import { logger } from "@server/config/logger";
import { Router } from "express";
import {
    type Member,
    type GetRequest,
    type GetQuery,
    type AddContactRequest
} from "@server/types/contacts";
import {
    getContacts,
    addContact,
    updateContact,
    deleteContact,
    // addContactsByCsv,
    exportContactsToCsv,
    addContactsByCsv,
    replaceContactsByCsv
} from "@server/controller/contacts.controller";
import { Response } from 'express'
import multer from 'multer';
const contactsRouter = Router()
/**
 * GET /v1/contacts
 * Returns the paginated list of contacts by calling getContacts
 * Available Queries: page, limit and sort
 */
contactsRouter.get('/', async (req: GetRequest, res: Response) => {
    try {
        const { page, limit, sort }: GetQuery = req.query
        const { members, totalItems, totalPages } = await getContacts(page, limit, sort)
        res.status(200).json({
            members,
            total_items: totalItems,
            total_pages: totalPages
        })
    } catch (error: any) {
        const errorMessage = error?.detail || error?.message || 'Failed to fetch data'
        logger.error(errorMessage)
        res.status(500).json({ error: errorMessage })
    }
})

/**
 * POST /v1/contacts
 * Adds a contact in a specific list by calling addContacts
 * Request Body should be equal to ContactBody type
 */
contactsRouter.post('/', async (req: AddContactRequest, res: Response) => {
    try {
        const member: Member = await addContact(req.body)
        res.status(200).json(member)
    } catch (error: any) {
        const errorMessage = error?.response?.text || error?.detail || error?.message || 'Failed to fetch data'
        logger.error(errorMessage)
        res.status(500).json({ error: errorMessage })
    }
})



/**
 * PUT /v1/contacts
 * Updates a contact data by calling updateContact
 * Request Body should be equal to ContactBody type
 */
contactsRouter.put('/', async (req: AddContactRequest, res: Response) => {
    try {
        const member: Member = await updateContact(req.body)
        res.status(200).json(member)
    } catch (error: any) {
        const errorMessage = error?.response?.text || error?.detail || error?.message || 'Failed to fetch data'
        logger.error(errorMessage)
        res.status(500).json({ error: errorMessage })
    }
})

/**
 * DELETE /v1/contacts/:email
 * Archives an existing user by calling deleteContact
 * email should be existing in the request params.
 */
contactsRouter.delete('/:email', async (req, res) => {
    try {
        const {
            email
        } = req.params
        await deleteContact(email)
        res.status(200).json({ message: 'Succesful' })
    } catch (error: any) {
        const errorMessage = error?.response?.text || error?.detail || error?.message || 'Failed to fetch data'
        logger.error(errorMessage)
        res.status(500).json({ error: errorMessage })
    }
})
const upload = multer();



/**
 * POST /v1/contacts/csv
 * Sends a CSV contains member / contact list to be added or updated
 * Follow CSV format.
 */
contactsRouter.post('/csv', upload.single('file'), async (req, res) => {
    try {
        await addContactsByCsv(req, res)
    } catch (error: any) {
        const errorMessage = error?.response?.text || error?.detail || error?.message || 'Failed to fetch data'
        logger.error(errorMessage)
        res.status(500).json({ error: errorMessage })
    }
})

contactsRouter.post('/csv/replace', upload.single('file'), async (req, res) => {
    try {
        await replaceContactsByCsv(req, res)
    } catch (error: any) {
        const errorMessage = error?.response?.text || error?.detail || error?.message || 'Failed to fetch data'
        logger.error(errorMessage)
        res.status(500).json({ error: errorMessage })
    }
})


/**
 * GET /v1/contacts/csv
 * Retrieves a CSV file to be downloaded for exporting contact list
 */
contactsRouter.get('/csv', async (_req, res) => {
    try {
        const csvString = await exportContactsToCsv()
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sgs_contacts.csv');
        res.send(csvString);
    } catch (error: any) {
        const errorMessage = error?.response?.text || error?.detail || error?.message || 'Failed to fetch data'
        logger.error(errorMessage)
        res.status(500).json({ error: errorMessage })
    }
})


export default contactsRouter