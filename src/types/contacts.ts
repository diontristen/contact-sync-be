
import { Request } from 'express'

export interface Address {
    addr1: string
    addr2: string
    city: string
    state: string
    zip: string
    country: string
}

export interface Member {
    id?: string,
    email_address: string
    status?: string
    merge_fields: {
        FNAME?: string
        LNAME?: string
        BIRTHDAY?: string
        PHONE?: string
        ADDRESS?: Address
        ADDR1?: string
        ADDR2?: string
        CITY?: string
        STATE?: string
        ZIP?: string
        COUNTRY?: string
    }
}

export interface GetQuery {
    page: string
    limit: string
    sort: string
}

export interface GetRequest extends Request {
    query: {
        page: string
        limit: string
        sort: string
    }
}

export interface GetContactResponse {
    members: Member[]
    totalItems: number
    totalPages: number
}

export interface ContactBody {
    email: string
    first_name: string
    last_name: string
    phone_number: string
    address_1: string
    address_2: string
    city: string
    state: string
    zip: string
    country: string
}

export interface AddContactRequest extends Request {
    body: ContactBody
}

export interface GetContactDataReturn {
    member: Member,
    listId: string
}

export interface ListsSuccessResponse {
    members: Member[]
}

export interface BatchOperationReturn {
    new_members: Member[]
    updated_members: Member[]
    errors: Member[]
}