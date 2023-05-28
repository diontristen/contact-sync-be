import mailchimp from '@mailchimp/mailchimp_marketing'
import * as dotenv from "dotenv";

dotenv.config();
const apiKey = process.env.MAILCHIMP_API_KEY ?? ''
const server = process.env.MAILCHIM_SERVER ?? ''
const config = {
    apiKey,
    server,
}

mailchimp.setConfig(config);

export default mailchimp


  