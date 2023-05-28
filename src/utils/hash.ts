import { createHash } from "crypto";

export const getMD5Hash = (value: string): string => {
    return createHash('md5').update(value.toLowerCase()).digest('hex')
}