
# Contact Sync
`Note: Created while enhancing react skills`

A very simple backend application that allows you to sync your audience / contact list in your mailchimp account.
This application has an easy UI in order for you to take advantage the Mailchimp API.

This connects with a frontend application:  [Contact Sync Frontend](https://github.com/diontristen/contact-sync-fe) that I created as well.

## Reminder

This repository is for learning purposes only.

## Functionality
- Retrieve the existing contact list of your mailchimp api in paginated form.
- Allows you to add a new contact
- Allows you to add or update new contacts by uploading a csv file. Existing contacts will be updated by email.
- Allows you to complety sync up your csv with your mailchimp contact list. It moves all your existing contact list to archive and replace it with the csv list.
- Allows you to Update an existing contact
- Allows you to delete a contact
- Allows you to export your whole contact list in a `.csv` format


## Technology Used
 - NodeJS
 - Express
 - Mailchimp API v3
 - multer
 - winston
 - csvtojson


## Todo
 - Add Validation
 - Unit Test
 - Improve Logic
 - Multiple Delete
 

## Requirements

Node Version: `v18.12.1`


## Getting Started

First, install necesassary packages:
```bash
npm install
```

Then, create an `.env` file, a sample `.env.sample` is uploaded for basis.

Lasty, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.
