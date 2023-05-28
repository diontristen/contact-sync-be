import { BatchOperationReturn, Member } from "@server/types/contacts";
import mailchimp from "@server/config/mailchimp";
import { capitalizeKeys, sanitize } from "@server/utils/helper";
import {
    type Address,
    type ContactBody,
    type GetContactResponse,
    type GetContactDataReturn,
} from "@server/types/contacts";
import { getMD5Hash } from "@server/utils/hash";
import { Request, Response } from "express";
import { createObjectCsvStringifier } from "csv-writer";
import csvtojson from 'csvtojson'
import { File } from 'multer';
import * as dotenv from "dotenv";
dotenv.config();
const listId = process.env.MAILCHIMP_LIST_ID ?? ''
interface MulterRequest extends Request {
    file: File;
}

const MAX_CONTACT_LIST = 500
const ITEM_PER_PAGE = 10
const PAGE = 0
const SORT = 'DESC'
const FIELDS = [
    'members.id',
    'members.email_address',
    'members.merge_fields',
    'members.last_changed',
    'total_items'
]

/**
 * Returns the paginated list of contacts
 * It calls mailchimp api GET /lists/{list_id}/members
 * @param page 
 * @param limit 
 * @param sort 
 * @returns 
 */
export const getContacts = async (page?: string, limit?: string, sort?: string): Promise<GetContactResponse> => {
   
    const response = await mailchimp.lists.getListMembersInfo(listId, {
        count: Number(limit) ?? ITEM_PER_PAGE,
        offset: ((Number(page) - 1) * ITEM_PER_PAGE) ?? PAGE,
        sort_dir: sort ?? SORT,
        sort_field: 'last_changed',
        fields: FIELDS
    });
    const members: Member[] = response?.members ?? []
    const totalItems: number =response?.total_items ?? 0
    const totalPages: number = Math.ceil(response?.total_items / ITEM_PER_PAGE) ?? 1
    return {
        members,
        totalItems,
        totalPages
    }
}

/**
 * Adds a contact in a specific list.
 * It calls mailchimp api POST /lists/{list_id}/members
 * @param data 
 * @returns the members data
 */
export const addContact = async (data: ContactBody): Promise<Member> => {
    const {
        member,
        listId
    }: GetContactDataReturn = getContactData(data)
    await mailchimp.lists.addListMember(
        listId,
        member,
        {
            skipMergeValidation: true,
        }
    );
    return member
}

/**
 * Updates contact data
 * It calls mailchimp api PUT /lists/{list_id}/members/{subscriber_hash}
 * @param data 
 * @returns the members updated data
 */
export const updateContact = async (data: ContactBody): Promise<Member> => {
    const {
        member,
        listId
    }: GetContactDataReturn = getContactData(data)
    const subscriberHash = getMD5Hash(member?.email_address ?? '');
    await mailchimp.lists.updateListMember(
        listId,
        subscriberHash,
        member,
        {
            skipMergeValidation: true,
        }
    );
    return member
}

/**
 * Archives the user by email
 * It calls mailchimp api DELETE /lists/{list_id}/members/{subscriber_hash}
 * @param email 
 */
export const deleteContact = async (email: string) => {
    const subscriberHash = getMD5Hash(email);
    await mailchimp.lists.deleteListMember(
        listId,
        subscriberHash
    );
}



/**
 * Add or updates a contact base on a csv file
 * @param request 
 * @param res 
 */
export const addContactsByCsv = async (request: Request, res: Response) => {
    try {
        const response = await batchAddFromCsv(request, res)
        res.status(200).json({
            new_members: response.new_members,
            updated_members: response.updated_members,
            failed_members: response.errors
        })
    } catch (error: any) {
        const errorMessage = error?.response?.text || error?.detail || error?.message || 'Failed to fetch data'
        res.status(500).json({ error: errorMessage })
    }
}

export const replaceContactsByCsv = async (request: Request, res: Response) => {

    const memberResponse = await mailchimp.lists.getListMembersInfo(listId, {
        count: MAX_CONTACT_LIST,
        fields: ['members.email_address']
    });
    const members: Member[] = memberResponse?.members ?? []
    const operations = []
    members.map((member) => {
        const subscriberHash = getMD5Hash(member?.email_address ?? '');
        const operation = {
            method: 'DELETE',
            path: `/lists/${listId}/members/${subscriberHash}`,
        }
        operations.push(operation)
    })

    const batch = await mailchimp.batches.start({
        operations: operations,
    });
    const batchId = batch?.id
    const endTime = Date.now() + 5000;
    const scanning = setInterval(async () => {
        const response = await mailchimp.batches.status(batchId);
        const status = response?.status ?? 'pending'
        if (status === 'finished') clearInterval(scanning);
        if (endTime < Date.now()) {
            clearInterval(scanning);
        }
    }, 1000)

    const response = await batchAddFromCsv(request, res)
    res.status(200).json({
        new_members: response.new_members,
        updated_members: response.updated_members,
        failed_members: response.errors
    })
}

/**
 * Fetches the complete contact list from mailchip
 * and converts it to csvString
 * @returns csvString
 */
export const exportContactsToCsv = async (): Promise<string> => {
    const response = await mailchimp.lists.getListMembersInfo(listId, {
        count: MAX_CONTACT_LIST,
        sort_dir: 'DESC',
        sort_field: 'last_changed',
        fields: FIELDS
    });
    const members = response?.members ?? []
    const parsedMembers = []
    members.forEach((member) => {
        const email = member.email_address;
        const firstName = member.merge_fields.FNAME;
        const lastName = member.merge_fields.LNAME;
        const phone = member.merge_fields.PHONE;
        const addr1 = member.merge_fields.ADDR1;
        const addr2 = member.merge_fields.ADDR2;
        const city = member.merge_fields.CITY;
        const state = member.merge_fields.STATE;
        const zip = member.merge_fields.ZIP;
        const country = member.merge_fields.COUNTRY;
        const lashChanged = member.last_changed

        parsedMembers.push({
            firstName,
            email,
            lastName,
            phone,
            addr1,
            addr2,
            city,
            state,
            zip,
            country,
            lashChanged
        });
    });

    const csvStringifier = createObjectCsvStringifier({
        header: [
            { id: 'firstName', title: 'First Name' },
            { id: 'lastName', title: 'Last Name' },
            { id: 'email', title: 'Email' },
            { id: 'phone', title: 'Phone No.' },
            { id: 'addr1', title: 'Address 1' },
            { id: 'addr2', title: 'Address 2' },
            { id: 'city', title: 'City' },
            { id: 'state', title: 'State' },
            { id: 'zip', title: 'Zip Code' },
            { id: 'country', title: 'Country' },
            { id: 'lashChanged', title: 'Last Changed' },
        ],
    });
    const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(parsedMembers);
    return csvString
}

/**
 * Parse and Sanitize request body to member data
 * @param data 
 * @returns sanitized member data and listId
 */
const getContactData = (data: ContactBody): GetContactDataReturn => {
    const {
        email: emailAddress,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        address_1: address1,
        address_2: address2,
        city,
        state,
        zip,
        country
    }: ContactBody = data

    const address: Address = {
        addr1: address1 ?? '',
        addr2: address2 ?? '',
        city: city ?? '',
        state: state ?? '',
        zip: zip ?? '',
        country: country ?? ''
    }
    const outerFields = capitalizeKeys(address)

    const member: Member = {
        email_address: emailAddress,
        status: 'subscribed',
        merge_fields: {
            FNAME: firstName,
            LNAME: lastName,
            PHONE: phoneNumber,
            ...outerFields
        }
    }

    const sanitizedData = sanitize(member)
    return {
        member: sanitizedData,
        listId
    }
}


const batchAddFromCsv = async (request, res): Promise<BatchOperationReturn> => {
    if (!(request as MulterRequest).file) {
        res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer: string = (request as MulterRequest).file.buffer.toString();
    const csvParser = csvtojson();

    const csvArray = await csvParser.fromString(fileBuffer)

    const contactList: Member[] = [];

    if (csvArray.length > 0) {
        const headers = Object.keys(csvArray[0]);

        for (const row of csvArray) {
            const rowData: Record<string, any> = {};

            for (const header of headers) {
                rowData[header] = row[header];
            }
            const address: Address = {
                addr1: rowData['Addresses\\Address line 1'] ?? '',
                addr2: rowData['Addresses\\Address line 2'] ?? '',
                city: rowData['Addresses\\City'] ?? '',
                state: rowData['Addresses\\State abbreviation'] ?? '',
                zip: rowData['Addresses\\ZIP'] ?? '',
                country: rowData['Addresses\\Country abbreviation'] ?? '',
            }
            const outerFields = capitalizeKeys(address)
            const member: Member = {
                email_address: rowData['Email Addresses\\Email address'],
                status: 'subscribed',
                merge_fields: {
                    FNAME: rowData['First name'],
                    LNAME: rowData['Last/Organization/Group/Household name'],
                    PHONE: rowData['Phones\\Number'],
                    ...outerFields
                }
            }
            const isDuplicate = contactList.some((contact) => contact.email_address === member.email_address)
            if (!isDuplicate) {
                contactList.push(member);
            }
        }
    }
    const response: BatchOperationReturn = await mailchimp.lists.batchListMembers(listId, {
        members: contactList,
        update_existing: true,
    });
    return response
}