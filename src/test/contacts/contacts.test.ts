import request from 'supertest';
import { expect } from "chai";
import { createExpressServer } from "@server/config/express";
import { faker } from '@faker-js/faker';
import fs from 'fs'
import path from 'path';
const app = createExpressServer();

const email = faker.internet.email();
const firstName = faker.person.firstName();
const lastName = faker.person.firstName();
const phoneNumber = faker.phone.number();
const address = faker.location.streetAddress();

const email2 = faker.internet.email();
const firstName2 = faker.person.firstName();
const lastName2 = faker.person.firstName();
const phoneNumber2 = faker.phone.number();

const testAddCsvEmail = 'testunit@gmail.com'
const testUpdateCsvName = 'Unit Update'

describe("POST /v1/contacts", function () {
    after(async () => {
        // Delete the uploaded file using the uploadedFileId
        if (testAddCsvEmail) {
            await request(app).delete(`/v1/contacts/${email2}`).send()
        }
    });
    it("should be able to add contacts", async () => {
        const response = await request(app).post("/v1/contacts").send({
            email: email,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
            address_1: address
        })
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.include({ email_address: email });
        expect(response.body.merge_fields).to.deep.include({ FNAME: firstName });
        expect(response.body.merge_fields).to.deep.include({ LNAME: lastName });
        expect(response.body.merge_fields).to.deep.include({ PHONE: phoneNumber });
        expect(response.body.merge_fields).to.deep.include({ ADDR1: address });
    });
    it("should be able to add contacts even without a required field", async () => {
        const response = await request(app).post("/v1/contacts").send({
            email: email2,
            first_name: firstName2,
            last_name: lastName2,
            phone_number: phoneNumber2
        })
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.include({ email_address: email2 });
        expect(response.body.merge_fields).to.deep.include({ FNAME: firstName2 });
        expect(response.body.merge_fields).to.deep.include({ LNAME: lastName2 });
        expect(response.body.merge_fields).to.deep.include({ PHONE: phoneNumber2 });
    });
    it("should not be able to add contact if email is already existing", async () => {
        const response = await request(app).post("/v1/contacts").send({
            email: email,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber
        })
        expect(response.status).to.equal(500);
        expect(response.body).to.have.own.property('error');
        expect(response.body.error).to.be.an('string');
    });
    it("should not be able to add if email is missing", async () => {
        const response = await request(app).post("/v1/contacts").send({
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber
        })
        expect(response.status).to.equal(500);
        expect(response.body).to.have.own.property('error');
        expect(response.body.error).to.be.an('string');
    });
});

describe("GET /v1/contacts", function () {
    it("should be able to get contacts", async () => {
        const response = await request(app).get("/v1/contacts")
        expect(response.status).to.equal(200);
        expect(response.body).to.have.own.property('members');
        expect(response.body.members).to.be.an('array');
        expect(response.body).to.have.own.property('total_items');
        expect(response.body).to.have.own.property('total_pages');
    });
    it("should be able to get contacts with page as query", async () => {
        const response = await request(app).get("/v1/contacts?page=1")
        expect(response.status).to.equal(200);
        expect(response.body).to.have.own.property('members');
        expect(response.body.members).to.be.an('array');
        expect(response.body).to.have.own.property('total_items');
        expect(response.body).to.have.own.property('total_pages');
    });
    it("should be able to see newly added contact", async () => {
        const response = await request(app).get("/v1/contacts?page=1")
        expect(response.status).to.equal(200);
        expect(response.body).to.have.own.property('members');
        expect(response.body.members[0]).to.deep.include({ email_address: email });
        expect(response.body.members[0].merge_fields).to.deep.include({ FNAME: firstName });
        expect(response.body.members[0].merge_fields).to.deep.include({ LNAME: lastName });
        expect(response.body.members[0].merge_fields).to.deep.include({ PHONE: phoneNumber });
        expect(response.body.members).to.be.an('array');
        expect(response.body).to.have.own.property('total_items');
        expect(response.body).to.have.own.property('total_pages');
    });
});

describe("PUT /v1/contacts", function () {
    it("should not able to update a contact if email is missing", async () => {
        const newFirstName = faker.person.firstName();
        const response = await request(app).put("/v1/contacts").send({
            first_name: newFirstName,
            last_name: lastName,
            phone_number: phoneNumber,
        })
        expect(response.status).to.equal(500);
        expect(response.body).to.have.own.property('error');
        expect(response.body.error).to.be.an('string');
    });
    it("should be able to update a contact", async () => {
        const newFirstName = faker.person.firstName();
        const response = await request(app).put("/v1/contacts").send({
            email: email,
            first_name: newFirstName,
            last_name: lastName,
            phone_number: phoneNumber,
        })
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.include({ email_address: email });
        expect(response.body.merge_fields).to.deep.include({ FNAME: newFirstName });
        expect(response.body.merge_fields).to.deep.include({ LNAME: lastName });
        expect(response.body.merge_fields).to.deep.include({ PHONE: phoneNumber });
    });
});

describe("DELETE /v1/contacts", function () {
    it("should not able to delete a contact if email is missing in the url params", async () => {
        const response = await request(app).delete(`/v1/contacts`)
        expect(response.status).to.equal(404);
    });
    it("should not able to delete a contact if email is not existing", async () => {
        const nonExistingEmail = faker.internet.email();
        const response = await request(app).delete(`/v1/contacts/${nonExistingEmail}`)
        expect(response.status).to.equal(500);
        expect(response.body).to.have.own.property('error');
        expect(response.body.error).to.be.an('string');
    });
    it("should be able to delete a contact", async () => {
        const response = await request(app).delete(`/v1/contacts/${email}`).send()
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.include({ message: 'Succesful' });
    });
});

describe("POST /v1/contacts/csv", function () {
    this.afterAll(async () => {
        // Delete the uploaded file using the uploadedFileId
        if (testAddCsvEmail) {
            await request(app).delete(`/v1/contacts/${testAddCsvEmail}`).send()
        }
    });
    it("should not be able add without uploading a csv file", async () => {
        const response = await request(app)
            .post(`/v1/contacts/csv`)
            .field('Content-Type', 'text/csv')
        expect(response.status).to.equal(400);
        expect(response.body).to.have.own.property('error');
        expect(response.body).to.deep.include({ error: 'No file uploaded' });
    });
    it("should be able to upload csv file and add test users to the list", async () => {
        const testAddCsvFile = path.join(__dirname, './test_add.csv')
        const response = await request(app)
            .post(`/v1/contacts/csv`)
            .field('Content-Type', 'text/csv')
            .attach('file', fs.readFileSync(testAddCsvFile), 'sample.csv');
        console.log(response)
        expect(response.status).to.equal(200);
        expect(response.body).to.have.own.property('new_members');
        expect(response.body).to.have.own.property('updated_members');
        expect(response.body).to.have.own.property('failed_members');
        expect(response.body.new_members).to.be.an('array');
        expect(response.body.updated_members).to.be.an('array');
        expect(response.body.failed_members).to.be.an('array');
        expect(response.body.new_members[0]).to.deep.include({ email_address: testAddCsvEmail });
    });
    it("should be able to upload csv file and update test users", async () => {
        const testAddCsvFile = path.join(__dirname, './test_update.csv')
        const response = await request(app)
            .post(`/v1/contacts/csv`)
            .field('Content-Type', 'text/csv')
            .attach('file', fs.readFileSync(testAddCsvFile), 'sample.csv');
        expect(response.status).to.equal(200);
        expect(response.body).to.have.own.property('new_members');
        expect(response.body).to.have.own.property('updated_members');
        expect(response.body).to.have.own.property('failed_members');
        expect(response.body.new_members).to.be.an('array');
        expect(response.body.updated_members).to.be.an('array');
        expect(response.body.failed_members).to.be.an('array');
        expect(response.body.updated_members[0]).to.deep.include({ email_address: testAddCsvEmail });
        expect(response.body.updated_members[0].merge_fields).to.deep.include({ FNAME: testUpdateCsvName });
    });
    it("should return a user in the failed member if email column is blank", async () => {
        const testAddCsvFile = path.join(__dirname, './test_add_failed.csv')
        const response = await request(app)
            .post(`/v1/contacts/csv`)
            .field('Content-Type', 'text/csv')
            .attach('file', fs.readFileSync(testAddCsvFile), 'sample.csv');
        expect(response.status).to.equal(200);
        expect(response.body).to.have.own.property('new_members');
        expect(response.body).to.have.own.property('updated_members');
        expect(response.body).to.have.own.property('failed_members');
        expect(response.body.new_members).to.be.an('array');
        expect(response.body.updated_members).to.be.an('array');
        expect(response.body.failed_members).to.be.an('array');
        expect(response.body.failed_members[0]).to.deep.include({ field_message: 'This value should not be blank.' });
        expect(response.body.failed_members[0]).to.deep.include({ field: 'email_address' });
    });
});


describe("POST /v1/contacts/csv/replace", function () {
    after(async () => {
        const testAddCsvFile = path.join(__dirname, './default_contact.csv')
        await request(app)
            .post(`/v1/contacts/csv/replace`)
            .field('Content-Type', 'text/csv')
            .attach('file', fs.readFileSync(testAddCsvFile), 'sample.csv');
    })
    it("should not be able add without uploading a csv file", async () => {
        const response = await request(app)
            .post(`/v1/contacts/csv/replace`)
            .field('Content-Type', 'text/csv')
        expect(response.status).to.equal(400);
        expect(response.body).to.have.own.property('error');
        expect(response.body).to.deep.include({ error: 'No file uploaded' });
    });
    it("should be able to upload csv and replace the list", async () => {
        const testAddCsvFile = path.join(__dirname, './test_replace.csv')
        const response = await request(app)
            .post(`/v1/contacts/csv/replace`)
            .field('Content-Type', 'text/csv')
            .attach('file', fs.readFileSync(testAddCsvFile), 'sample.csv');
        expect(response.status).to.equal(200);
        expect(response.body).to.have.own.property('new_members');
        expect(response.body).to.have.own.property('updated_members');
        expect(response.body).to.have.own.property('failed_members');
        expect(response.body.new_members).to.be.an('array');
        expect(response.body.new_members).to.have.lengthOf(3);
        expect(response.body.updated_members).to.be.an('array');
        expect(response.body.failed_members).to.be.an('array');
        expect(response.body.new_members[0]).to.deep.include({ email_address: 'testunit1@gmail.com' });
        expect(response.body.new_members[1]).to.deep.include({ email_address: 'testunit1@gmail.com' });
        expect(response.body.new_members[2]).to.deep.include({ email_address: 'testunit1@gmail.com' });
    });
});

describe("GET /v1/contacts/csv", function () {
    it("should be able to export a csv file of the contact list", async () => {
        const response = await request(app)
            .get(`/v1/contacts/csv`)
        expect(response.status).to.equal(200);
        expect(response.header['content-type']).to.equal('text/csv; charset=utf-8');
        expect(response.header['content-disposition']).to.include('attachment; filename=sgs_contacts.csv');
    });
});


